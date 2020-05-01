import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, cancel, cancelled, delay, fork, put, race, select, take } from 'redux-saga/effects'
import { setPromptForno } from 'src/account/actions'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { waitForRehydrate } from 'src/app/saga'
import { Actions, setGethConnected, setInitState } from 'src/geth/actions'
import {
  FailedToFetchGenesisBlockError,
  FailedToFetchStaticNodesError,
  getGeth,
} from 'src/geth/geth'
import { InitializationState } from 'src/geth/reducer'
import { isGethConnectedSelector } from 'src/geth/selectors'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { deleteChainDataAndRestartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { setContractKitReady } from 'src/web3/actions'
import { fornoSelector } from 'src/web3/selectors'

const gethEmitter = new NativeEventEmitter(NativeModules.RNGeth)

const TAG = 'geth/saga'
const INIT_GETH_TIMEOUT = 15000
const NEW_BLOCK_TIMEOUT = 30000
const GETH_MONITOR_DELAY = 5000

enum GethInitOutcomes {
  SUCCESS = 'SUCCESS',
  NETWORK_ERROR_FETCHING_STATIC_NODES = 'NETWORK_ERROR_FETCHING_STATIC_NODES',
  IRRECOVERABLE_FAILURE = 'IRRECOVERABLE_FAILURE',
  NETWORK_ERROR_FETCHING_GENESIS_BLOCK = 'NETWORK_ERROR_FETCHING_GENESIS_BLOCK',
}

export function* waitForGethConnectivity() {
  const connected = yield select(isGethConnectedSelector)
  if (connected) {
    return
  }
  while (true) {
    const action = yield take(Actions.SET_GETH_CONNECTED)
    if (action.connected) {
      return
    }
  }
}

function* waitForGethInstance() {
  try {
    const gethInstance = yield call(getGeth)
    if (gethInstance == null) {
      throw new Error('geth instance is null')
    }
    return GethInitOutcomes.SUCCESS
  } catch (error) {
    switch (error) {
      case FailedToFetchStaticNodesError:
        return GethInitOutcomes.NETWORK_ERROR_FETCHING_STATIC_NODES
      case FailedToFetchGenesisBlockError:
        return GethInitOutcomes.NETWORK_ERROR_FETCHING_GENESIS_BLOCK
      default: {
        Logger.error(TAG, 'Error getting geth instance', error)
        return GethInitOutcomes.IRRECOVERABLE_FAILURE
      }
    }
  }
}

export function* initGethSaga() {
  Logger.debug(TAG, 'Initializing Geth')
  yield put(setInitState(InitializationState.INITIALIZING))

  const { result } = yield race({
    result: call(waitForGethInstance),
    timeout: delay(INIT_GETH_TIMEOUT),
  })

  let restartAppAutomatically: boolean = false
  switch (result) {
    case GethInitOutcomes.SUCCESS: {
      Logger.debug(TAG, 'Geth initialized')
      yield put(setInitState(InitializationState.INITIALIZED))
      return
    }
    case GethInitOutcomes.NETWORK_ERROR_FETCHING_STATIC_NODES: {
      Logger.error(
        TAG,
        'Could not fetch static nodes from the network. Tell user to check data connection.'
      )
      yield put(setInitState(InitializationState.DATA_CONNECTION_MISSING_ERROR))
      restartAppAutomatically = false
      break
    }
    case GethInitOutcomes.NETWORK_ERROR_FETCHING_GENESIS_BLOCK: {
      Logger.error(
        TAG,
        'Could not fetch genesis block from the network. Tell user to check data connection.'
      )
      yield put(setInitState(InitializationState.DATA_CONNECTION_MISSING_ERROR))
      restartAppAutomatically = false
      break
    }
    case GethInitOutcomes.IRRECOVERABLE_FAILURE: {
      Logger.error(TAG, 'Could not initialize geth. Will retry.')
      yield put(setInitState(InitializationState.INITIALIZE_ERROR))
      restartAppAutomatically = true
      break
    }
    // We assume it's a timeout if it hits this case. It's possible though, if
    // a new enum value is added to GethInitOutcomes and doesn't have a case added
    // for it, the error will be misleading.
    default: {
      Logger.error(TAG, 'Geth initializtion timed out. Will retry.')
      yield put(setInitState(InitializationState.INITIALIZE_ERROR))
      restartAppAutomatically = true
    }
  }

  if (restartAppAutomatically) {
    Logger.error(TAG, 'Geth initialization failed, restarting the app.')
    deleteChainDataAndRestartApp()
  } else {
    // Suggest switch to forno for network-related errors
    if (yield select(promptFornoIfNeededSelector)) {
      yield put(setPromptForno(false))
      navigate(Screens.DataSaver, { promptModalVisible: true })
    } else {
      navigateToError('networkConnectionFailed')
    }
  }
}

function createNewBlockChannel() {
  return eventChannel((emit: any) => {
    const eventSubscription = gethEmitter.addListener('GethNewHead', emit)
    return eventSubscription.remove
  })
}

function* monitorGeth() {
  const newBlockChannel = yield createNewBlockChannel()

  while (true) {
    try {
      const { newBlock } = yield race({
        newBlock: take(newBlockChannel),
        timeout: delay(NEW_BLOCK_TIMEOUT),
      })
      if (newBlock) {
        Logger.debug(`${TAG}@monitorGeth`, 'Received new blocks')
        yield put(setGethConnected(true))
        yield delay(GETH_MONITOR_DELAY)
      } else {
        Logger.error(
          `${TAG}@monitorGeth`,
          `Did not receive a block in ${NEW_BLOCK_TIMEOUT} milliseconds`
        )
        yield put(setGethConnected(false))
      }
    } catch (error) {
      Logger.error(`${TAG}@monitorGeth`, error)
    } finally {
      if (yield cancelled()) {
        try {
          newBlockChannel.close()
        } catch (error) {
          Logger.debug(
            `${TAG}@monitorGeth`,
            'Could not close newBlockChannel. May already be closed.',
            error
          )
        }
      }
    }
  }
}

export function* gethSaga() {
  yield call(initGethSaga)
  const gethRelatedSagas = yield fork(monitorGeth)
  yield take(Actions.CANCEL_GETH_SAGA)
  yield cancel(gethRelatedSagas)
  yield put(setGethConnected(true))
}

export function* gethSagaIfNecessary() {
  yield call(waitForRehydrate) // Wait for rehydrate to know if geth or forno mode
  yield put(setContractKitReady(true)) // ContractKit is blocked (not ready) before rehydrate
  if (!(yield select(fornoSelector))) {
    Logger.debug(`${TAG}@gethSagaIfNecessary`, `Starting geth saga...`)
    yield call(gethSaga)
  }
}

import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, cancel, cancelled, delay, fork, put, race, select, take } from 'redux-saga/effects'
import { setPromptForno } from 'src/account/actions'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
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
import { getContractKit } from 'src/web3/contracts'
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

export function* waitForNextBlock() {
  const startTime = Date.now()
  const contractKit = yield call(getContractKit)
  const initialBlockNumber = yield call(contractKit.web3.eth.getBlockNumber)
  while (Date.now() - startTime < NEW_BLOCK_TIMEOUT) {
    const blockNumber = yield call(contractKit.web3.eth.getBlockNumber)
    if (blockNumber > initialBlockNumber) {
      return
    }
    yield delay(GETH_MONITOR_DELAY)
  }
}

function* waitForGethInstance() {
  try {
    const fornoMode = yield select(fornoSelector)
    // get geth without syncing if fornoMode
    const gethInstance = yield call(getGeth, !fornoMode)
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
  let errorContext: string
  switch (result) {
    case GethInitOutcomes.SUCCESS: {
      Logger.debug(TAG, 'Geth initialized')
      CeloAnalytics.track(CustomEventNames.geth_init_success)
      yield put(setInitState(InitializationState.INITIALIZED))
      return
    }
    case GethInitOutcomes.NETWORK_ERROR_FETCHING_STATIC_NODES: {
      errorContext =
        'Could not fetch static nodes from the network. Tell user to check data connection.'
      Logger.error(TAG, errorContext)
      yield put(setInitState(InitializationState.DATA_CONNECTION_MISSING_ERROR))
      restartAppAutomatically = false
      break
    }
    case GethInitOutcomes.NETWORK_ERROR_FETCHING_GENESIS_BLOCK: {
      errorContext =
        'Could not fetch genesis block from the network. Tell user to check data connection.'
      Logger.error(TAG, errorContext)
      yield put(setInitState(InitializationState.DATA_CONNECTION_MISSING_ERROR))
      restartAppAutomatically = false
      break
    }
    case GethInitOutcomes.IRRECOVERABLE_FAILURE: {
      errorContext = 'Could not initialize geth. Will retry.'
      Logger.error(TAG, errorContext)
      yield put(setInitState(InitializationState.INITIALIZE_ERROR))
      restartAppAutomatically = true
      break
    }
    // We assume it's a timeout if it hits this case. It's possible though, if
    // a new enum value is added to GethInitOutcomes and doesn't have a case added
    // for it, the error will be misleading.
    default: {
      errorContext = 'Geth initializtion timed out. Will retry.'
      Logger.error(TAG, errorContext)
      yield put(setInitState(InitializationState.INITIALIZE_ERROR))
      restartAppAutomatically = true
    }
  }

  CeloAnalytics.track(CustomEventNames.geth_init_failure, {
    error: result,
    context: errorContext,
  })

  if (restartAppAutomatically) {
    Logger.error(TAG, 'Geth initialization failed, restarting the app.')
    CeloAnalytics.track(CustomEventNames.geth_restart_to_fix_init)
    deleteChainDataAndRestartApp()
  } else {
    // Suggest switch to forno for network-related errors
    if (yield select(promptFornoIfNeededSelector)) {
      CeloAnalytics.track(CustomEventNames.prompt_forno, { context: `Geth init error ${result}` })
      yield put(setPromptForno(false))
      navigate(Screens.Settings, { promptFornoModal: true })
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
  yield call(waitForRehydrate) // Wait for rehydrate to know if geth or forno mode
  yield put(setContractKitReady(true)) // TODO(yorke): consider moving elsewhere
  const fornoMode = yield select(fornoSelector)
  yield call(initGethSaga)
  if (!fornoMode) {
    const gethRelatedSagas = yield fork(monitorGeth)
    yield take(Actions.CANCEL_GETH_SAGA)
    yield cancel(gethRelatedSagas)
  } else {
    // TODO(yorke): monitor to make sure RPC is still available
    yield put(setGethConnected(true))
    yield take(Actions.CANCEL_GETH_SAGA)
  }

  yield put(setGethConnected(false))
  // TODO: consider restarting the app when this is reached
}

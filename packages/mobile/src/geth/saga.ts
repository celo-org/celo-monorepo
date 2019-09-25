import { AppState, NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, cancelled, delay, fork, put, race, select, take } from 'redux-saga/effects'
import { Actions, setGethConnected, setInitState } from 'src/geth/actions'
import {
  FailedToFetchGenesisBlockError,
  FailedToFetchStaticNodesError,
  getGeth,
} from 'src/geth/geth'
import { InitializationState, isGethConnectedSelector } from 'src/geth/reducer'
import { navigateToError } from 'src/navigator/NavigationService'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'

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

function* initGethSaga() {
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
    restartApp()
  } else {
    navigateToError('networkConnectionFailed')
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
        newBlockChannel.close()
      }
    }
  }
}

function createAppStateChannel() {
  return eventChannel((emit: any) => {
    AppState.addEventListener('change', emit)

    const removeEventListener = () => {
      AppState.removeEventListener('change', emit)
    }
    return removeEventListener
  })
}

function* monitorAppState() {
  Logger.debug(`${TAG}@monitorAppState`, 'Starting monitor app state saga')
  const appStateChannel = yield createAppStateChannel()
  while (true) {
    try {
      const newState = yield take(appStateChannel)
      Logger.debug(`${TAG}@monitorAppState`, `App changed state: ${newState}`)
    } catch (error) {
      Logger.error(`${TAG}@monitorAppState`, error)
    } finally {
      if (yield cancelled()) {
        appStateChannel.close()
      }
    }
  }
}

export function* gethSaga() {
  yield call(initGethSaga)
  yield fork(monitorAppState)
  yield fork(monitorGeth)
}

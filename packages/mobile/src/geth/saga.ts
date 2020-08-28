import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, cancel, cancelled, delay, fork, put, race, select, take } from 'redux-saga/effects'
import { setPromptForno } from 'src/account/actions'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { GethEvents, NetworkEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  Actions,
  setChainHead,
  setGethConnected,
  SetGethConnectedAction,
  setInitState,
  SetInitStateAction,
} from 'src/geth/actions'
import {
  FailedToFetchGenesisBlockError,
  FailedToFetchStaticNodesError,
  initGeth,
  stopGethIfInitialized,
} from 'src/geth/geth'
import { InitializationState } from 'src/geth/reducer'
import {
  chainHeadSelector,
  gethInitializedSelector,
  isGethConnectedSelector,
} from 'src/geth/selectors'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { deleteChainDataAndRestartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import { getWeb3 } from 'src/web3/contracts'
import { fornoSelector } from 'src/web3/selectors'
import { BLOCK_AGE_LIMIT } from 'src/web3/utils'
import { BlockHeader } from 'web3-eth'

const gethEmitter = new NativeEventEmitter(NativeModules.RNGeth)

const TAG = 'geth/saga'
const INIT_GETH_TIMEOUT = 15000 // ms
const NEW_BLOCK_TIMEOUT = 30000 // ms
const GETH_MONITOR_DELAY = 5000 // ms

export enum GethInitOutcomes {
  SUCCESS = 'SUCCESS',
  NETWORK_ERROR_FETCHING_STATIC_NODES = 'NETWORK_ERROR_FETCHING_STATIC_NODES',
  IRRECOVERABLE_FAILURE = 'IRRECOVERABLE_FAILURE',
  NETWORK_ERROR_FETCHING_GENESIS_BLOCK = 'NETWORK_ERROR_FETCHING_GENESIS_BLOCK',
}

// react-native-geth on Android returns a non-standard block header encoding from the GethNewHead event.
// TODO: Fix the block header encoding in react-native-geth to use the standard JSON fields.
// https://github.com/celo-org/react-native-geth/blob/43d6fcba9551f8b49be13b6841fa535ea9ccafd1/android/src/main/java/com/reactnativegeth/RNGethModule.java#L337-L347
interface RNAndroidBlockHeader {
  parentHash: string
  coinbase: string
  root: string
  TxHash: string
  receiptHash: string
  bloom: string
  number: number
  gasUsed: number
  time: number
  hash: string
  extra: number[]
}

// Differentiate between the standard block header object and a RNGeth block header on Android.
function isRNAndroidBlockHeader(
  block: BlockHeader | RNAndroidBlockHeader
): block is RNAndroidBlockHeader {
  return (block as RNAndroidBlockHeader).time !== undefined
}

export function* waitForGethInitialized() {
  const gethState = yield select(gethInitializedSelector)
  if (gethState === InitializationState.INITIALIZED) {
    return
  }
  while (true) {
    const action: SetInitStateAction = yield take(Actions.SET_INIT_STATE)
    if (action.state === InitializationState.INITIALIZED) {
      return
    }
  }
}

export function* waitForGethConnectivity() {
  const connected = yield select(isGethConnectedSelector)
  if (connected) {
    return
  }
  while (true) {
    const action: SetGethConnectedAction = yield take(Actions.SET_GETH_CONNECTED)
    if (action.connected) {
      return
    }
  }
}

export function* waitForNextBlock() {
  const startTime = Date.now()
  const web3 = yield call(getWeb3)
  const initialBlockNumber = yield call(web3.eth.getBlockNumber)
  while (Date.now() - startTime < NEW_BLOCK_TIMEOUT) {
    const blockNumber = yield call(web3.eth.getBlockNumber)
    if (blockNumber > initialBlockNumber) {
      return
    }
    yield delay(GETH_MONITOR_DELAY)
  }
}

function* waitForGethInit() {
  try {
    const fornoMode = yield select(fornoSelector)
    const gethInitialized = yield call(initGeth, !fornoMode)
    if (!gethInitialized) {
      throw new Error('Geth not initialized correctly')
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

export const _waitForGethInit = waitForGethInit

export function* initGethSaga() {
  Logger.debug(TAG, 'Initializing Geth')
  yield put(setInitState(InitializationState.INITIALIZING))

  const { result } = yield race({
    result: call(waitForGethInit),
    timeout: delay(INIT_GETH_TIMEOUT),
  })

  let restartAppAutomatically: boolean = false
  let errorContext: string
  switch (result) {
    case GethInitOutcomes.SUCCESS: {
      Logger.debug(TAG, 'Geth initialized')
      ValoraAnalytics.track(GethEvents.geth_init_success)
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

  ValoraAnalytics.track(GethEvents.geth_init_failure, {
    error: result,
    context: errorContext,
  })

  if (restartAppAutomatically) {
    Logger.error(TAG, 'Geth initialization failed, restarting the app.')
    ValoraAnalytics.track(GethEvents.geth_restart_to_fix_init)
    deleteChainDataAndRestartApp()
  } else {
    // Suggest switch to forno for network-related errors
    if (yield select(promptFornoIfNeededSelector)) {
      ValoraAnalytics.track(GethEvents.prompt_forno, {
        error: result.message,
        context: 'Geth init error',
      })
      yield put(setPromptForno(false))
      navigate(Screens.Settings, { promptFornoModal: true })
    } else {
      navigateToError('networkConnectionFailed')
    }
  }
}

// Create a channel wrapped around the native event emitter for new blocks.
function createNewBlockChannel() {
  return eventChannel((emit: any) => {
    const eventSubscription = gethEmitter.addListener('GethNewHead', emit)
    return eventSubscription.remove
  })
}

function* monitorGeth() {
  const fornoMode = yield select(fornoSelector)

  if (!fornoMode) {
    const newBlockChannel = yield createNewBlockChannel()

    while (true) {
      try {
        const { newBlock }: { newBlock: BlockHeader | RNAndroidBlockHeader } = yield race({
          newBlock: take(newBlockChannel),
          timeout: delay(NEW_BLOCK_TIMEOUT),
        })
        if (newBlock) {
          const chainHead = {
            number: newBlock.number,
            hash: newBlock.hash,
            timestamp: Number(
              isRNAndroidBlockHeader(newBlock) ? newBlock.time : newBlock.timestamp
            ),
          }
          Logger.debug(
            `${TAG}@monitorGeth`,
            `Received new chain head ${chainHead.number} produced at ${new Date(
              chainHead.timestamp * 1000
            )}`
          )
          yield put(setGethConnected(true))
          yield put(setChainHead(chainHead))
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
  } else {
    yield put(setGethConnected(true))
    yield put(setChainHead(null))
    // TODO: monitor RPC connection when not syncing
  }
}

// Track and send to analytics events when the node become connected or disconnected.
function* trackConnectionStatus() {
  let connected = yield select(isGethConnectedSelector)
  while (true) {
    const action: SetGethConnectedAction = yield take(Actions.SET_GETH_CONNECTED)
    const fornoMode = yield select(fornoSelector)
    if (connected !== action.connected) {
      Logger.debug(
        `${TAG}@trackConnectionStatus`,
        `Connection status transitioned to connected = ${action.connected}`
      )
      ValoraAnalytics.track(
        action.connected ? NetworkEvents.network_connected : NetworkEvents.network_disconnected,
        { fornoMode }
      )
    }
    connected = action.connected
  }
}

// Track and send to analytics events when the node loses or restores sync.
function* trackSyncStatus() {
  let head = yield select(chainHeadSelector)
  let synced: boolean | undefined
  while (true) {
    // Head may be null on startup or when switching to forno.
    // Sync status in this case is undefined.
    if (head === null) {
      synced = undefined
      head = (yield take(Actions.SET_CHAIN_HEAD)).head
      continue
    }

    // Calculate how long, in milliseconds, we have until this node may be out of sync.
    const expiration = (head.timestamp + BLOCK_AGE_LIMIT) * 1000 - Date.now()
    Logger.debug(`${TAG}@trackSyncStatus`, `Chain head has ${expiration} ms to expiration`)
    if (expiration > 0 && synced === false) {
      Logger.debug(`${TAG}@trackSyncStatus`, `Network sync restored`)
      ValoraAnalytics.track(NetworkEvents.network_sync_restored, {
        latestBlock: head.number,
        latestTimestamp: head.timestamp,
      })
    } else if (expiration <= 0 && synced === true) {
      Logger.debug(`${TAG}@trackSyncStatus`, `Network sync lost`)
      ValoraAnalytics.track(NetworkEvents.network_sync_lost, {
        latestBlock: head.number,
        latestTimestamp: head.timestamp,
      })
    }

    // Record transitions from synced to unsynced, or any state to synced.
    // Transitions from undefined to unsynced are barred to because sync cannot be lost if it was never established.
    if (expiration > 0) {
      synced = true
      yield delay(expiration)
      head = yield select(chainHeadSelector)
    } else {
      synced = synced === undefined ? undefined : false
      head = (yield take(Actions.SET_CHAIN_HEAD)).head
    }
  }
}

export function* gethSaga() {
  yield call(initGethSaga)
  const gethMonitor = yield fork(monitorGeth)
  const connectionTracker = yield fork(trackConnectionStatus)
  const syncTracker = yield fork(trackSyncStatus)

  yield take(Actions.CANCEL_GETH_SAGA)
  yield put(setInitState(InitializationState.NOT_YET_INITIALIZED))
  yield call(stopGethIfInitialized)
  yield cancel(gethMonitor)
  yield cancel(connectionTracker)
  yield cancel(syncTracker)
}

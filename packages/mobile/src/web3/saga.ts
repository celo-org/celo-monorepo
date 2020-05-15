import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { setPromptForno } from 'src/account/actions'
import { promptFornoIfNeededSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { features } from 'src/flags'
import { cancelGethSaga } from 'src/geth/actions'
import { deleteChainData, stopGethIfInitialized } from 'src/geth/geth'
import { getConnectedUnlockedAccount, gethSaga, waitForGethConnectivity } from 'src/geth/saga'
import { gethStartedThisSessionSelector } from 'src/geth/selectors'
import { navigate, navigateToError } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { restartApp } from 'src/utils/AppRestart'
import Logger from 'src/utils/Logger'
import {
  Actions,
  completeWeb3Sync,
  setContractKitReady,
  setFornoMode,
  SetIsFornoAction,
  updateWeb3SyncProgress,
  Web3SyncProgress,
} from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'
import { fornoSelector } from 'src/web3/selectors'
import { getLatestBlock } from 'src/web3/utils'
import { Block } from 'web3-eth'

const TAG = 'web3/saga'

// The timeout for web3 to complete syncing and the latestBlock to be > 0
export const SYNC_TIMEOUT = 2 * 60 * 1000 // 2 minutes
const BLOCK_CHAIN_CORRUPTION_ERROR = "Error: CONNECTION ERROR: Couldn't connect to node on IPC."
const SWITCH_TO_FORNO_TIMEOUT = 15000 // if syncing takes >15 secs, suggest switch to forno
const WEB3_MONITOR_DELAY = 100

// checks if web3 claims it is currently syncing and attempts to wait for it to complete
export function* checkWeb3SyncProgress() {
  Logger.debug(TAG, 'checkWeb3SyncProgress', 'Checking sync progress')

  let syncLoops = 0
  while (true) {
    try {
      let syncProgress: boolean | Web3SyncProgress

      // isSyncing returns a syncProgress object when it's still syncing, false otherwise
      const contractKit = yield call(getContractKit)
      syncProgress = yield call(contractKit.web3.eth.isSyncing)

      if (typeof syncProgress === 'boolean' && !syncProgress) {
        Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync maybe complete, checking')

        const latestBlock: Block = yield call(getLatestBlock)
        if (latestBlock && latestBlock.number > 0) {
          yield put(completeWeb3Sync(latestBlock.number))
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync is complete')
          return true
        } else {
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync not actually complete, still waiting')
        }
      } else if (typeof syncProgress === 'object') {
        yield put(updateWeb3SyncProgress(syncProgress))
      } else {
        throw new Error('Invalid syncProgress type')
      }
      yield delay(WEB3_MONITOR_DELAY) // wait 100ms while web3 syncs then check again
      syncLoops += 1
      if (syncLoops * WEB3_MONITOR_DELAY > SWITCH_TO_FORNO_TIMEOUT) {
        if (yield select(promptFornoIfNeededSelector) && features.DATA_SAVER) {
          yield put(setPromptForno(false))
          navigate(Screens.DataSaver, { promptModalVisible: true })
          return true
        }
      }
    } catch (error) {
      if (error.toString().toLowerCase() === BLOCK_CHAIN_CORRUPTION_ERROR.toLowerCase()) {
        CeloAnalytics.track(CustomEventNames.blockChainCorruption, {}, true)
        const deleted = yield call(deleteChainData)
        if (deleted) {
          navigateToError('corruptedChainDeleted')
        }
      } else {
        Logger.error(TAG, 'Unexpected sync error', error)
      }
      return false
    }
  }
}

export function* waitForWeb3Sync() {
  try {
    const { syncComplete, timeout, fornoSwitch } = yield race({
      syncComplete: call(checkWeb3SyncProgress),
      timeout: delay(SYNC_TIMEOUT),
      fornoSwitch: take(Actions.TOGGLE_IS_FORNO),
    })
    if (fornoSwitch) {
      Logger.debug(
        `${TAG}@waitForWeb3Sync`,
        'Switching providers, expected web3 sync failure occured'
      )
      return true
    }
    if (timeout || !syncComplete) {
      Logger.error(TAG, 'Could not complete sync')
      navigateToError('web3FailedToSync')
      return false
    }
    return true
  } catch (error) {
    Logger.error(TAG, 'checkWeb3Sync', error)
    navigateToError('errorDuringSync')
    return false
  }
}

export function* waitWeb3LastBlock() {
  if (!(yield select(fornoSelector))) {
    yield call(waitForGethConnectivity)
    yield call(waitForWeb3Sync)
  }
}

export function* switchToGethFromForno() {
  Logger.debug(TAG, 'Switching to geth from forno..')
  const gethAlreadyStartedThisSession = yield select(gethStartedThisSessionSelector)
  if (gethAlreadyStartedThisSession) {
    // Restart app to allow users to start geth a second time
    // TODO remove when https://github.com/celo-org/celo-monorepo/issues/2101 fixed
    Logger.debug(TAG + '@switchToGethFromForno', 'Restarting...')
    restartApp()
    return
  }
  try {
    yield put(setContractKitReady(false)) // Lock contractKit during provider switch
    yield put(setFornoMode(false))
    yield spawn(gethSaga)
    // yield call(ensureAccountInGethKeystore)
    yield call(waitForGethConnectivity)
    yield put(setContractKitReady(true))
    Logger.debug(TAG + '@switchToGethFromForno', 'Ensured in keystore')
  } catch (e) {
    Logger.error(TAG + '@switchToGethFromForno', 'Error switching to geth from forno')
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
    yield put(setContractKitReady(true))
  }
}

export function* switchToFornoFromGeth() {
  Logger.debug(TAG, 'Switching to forno from geth..')
  try {
    yield put(setContractKitReady(false)) // Lock contractKit during provider switch
    yield put(setFornoMode(true))
    yield put(cancelGethSaga())
    yield call(stopGethIfInitialized)
    yield put(setContractKitReady(true))
  } catch (e) {
    Logger.error(TAG + '@switchToFornoFromGeth', 'Error switching to forno from geth')
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
    yield put(setContractKitReady(true))
  }
}

export function* toggleFornoMode(action: SetIsFornoAction) {
  if ((yield select(fornoSelector)) !== action.fornoMode) {
    Logger.debug(TAG + '@toggleFornoMode', ` to: ${action.fornoMode}`)
    if (action.fornoMode) {
      yield call(switchToFornoFromGeth)
    } else {
      yield call(switchToGethFromForno)
    }
    // Unlock account to ensure private keys are accessible in new mode
    try {
      const account = yield call(getConnectedUnlockedAccount)
      Logger.debug(
        TAG + '@toggleFornoMode',
        `Switched to ${action.fornoMode} and able to unlock account ${account}`
      )
    } catch (e) {
      // Rollback if private keys aren't accessible in new mode
      if (action.fornoMode) {
        yield call(switchToGethFromForno)
      } else {
        yield call(switchToFornoFromGeth)
      }
    }
  } else {
    Logger.debug(TAG + '@toggleFornoMode', ` already in desired state: ${action.fornoMode}`)
  }
}

export function* watchFornoMode() {
  yield takeLatest(Actions.TOGGLE_IS_FORNO, toggleFornoMode)
}

export function* web3Saga() {
  yield spawn(watchFornoMode)
  yield spawn(waitWeb3LastBlock)
}

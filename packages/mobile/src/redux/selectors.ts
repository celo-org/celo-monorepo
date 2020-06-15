import { createSelector } from 'reselect'
import { getIncomingPaymentRequests } from 'src/account/selectors'
import { DAYS_TO_BACKUP, DAYS_TO_DELAY } from 'src/backup/utils'
import { BALANCE_OUT_OF_SYNC_THRESHOLD } from 'src/config'
import { isGethConnectedSelector } from 'src/geth/selectors'
import { RootState } from 'src/redux/reducers'
import { timeDeltaInDays, timeDeltaInSeconds } from 'src/utils/time'
import { contractKitReadySelector, fornoSelector } from 'src/web3/selectors'

export const disabledDueToNoBackup = (
  accountCreationTime: number,
  backupCompleted: boolean,
  backupDelayedTime: number
) => {
  const disableThreshold = backupDelayedTime ? DAYS_TO_DELAY : DAYS_TO_BACKUP
  const startTime = backupDelayedTime || accountCreationTime
  return timeDeltaInDays(Date.now(), startTime) > disableThreshold && !backupCompleted
}

export const isBackupTooLate = (state: RootState) => {
  return disabledDueToNoBackup(
    state.account.accountCreationTime,
    state.account.backupCompleted,
    state.account.backupDelayedTime
  )
}

export const getNetworkConnected = (state: RootState) => state.networkInfo.connected

export const isAppConnected = createSelector(
  fornoSelector,
  contractKitReadySelector, // App acts as if disconnected when contractKit is locked
  isGethConnectedSelector,
  getNetworkConnected,
  (fornoEnabled, contractKitReady, gethConnected, networkConnected) =>
    (fornoEnabled || gethConnected) && contractKitReady && networkConnected
)

export const isAppSynced = (state: RootState) => {
  return (
    state.web3.syncProgress.currentBlock > 0 &&
    state.web3.syncProgress.highestBlock > 0 &&
    state.web3.syncProgress.currentBlock === state.web3.syncProgress.highestBlock
  )
}

export const getTabBarActiveNotification = createSelector(
  isBackupTooLate,
  getIncomingPaymentRequests,
  (tooLate, paymentRequests) => tooLate || Boolean(paymentRequests.length)
)

export const goldTokenLastFetch = (state: RootState) => state.goldToken.lastFetch || 0
export const stableTokenLastFetch = (state: RootState) => state.stableToken.lastFetch || 0

export const lastFetchTooOld = (lastFetch: number) => {
  // if lastFetch is null, then skip
  return !!lastFetch && timeDeltaInSeconds(Date.now(), lastFetch) > BALANCE_OUT_OF_SYNC_THRESHOLD
}

export const areAllBalancesFresh = (state: RootState) =>
  lastFetchTooOld(goldTokenLastFetch(state)) || lastFetchTooOld(stableTokenLastFetch(state))

// isAppConnected is used to either show the "disconnected banner" or "Refresh balance"
// but not both at the same time
export const shouldUpdateBalance = (state: RootState) =>
  areAllBalancesFresh(state) && isAppConnected(state)

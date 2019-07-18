import { createSelector } from 'reselect'
import { getPaymentRequests } from 'src/account/selectors'
import { DAYS_TO_BACKUP } from 'src/backup/Backup'
import { BALANCE_OUT_OF_SYNC_THRESHOLD } from 'src/config'
import { isGethConnectedSelector } from 'src/geth/reducer'
import { RootState } from 'src/redux/reducers'
import { timeDeltaInDays, timeDeltaInSeconds } from 'src/utils/time'

export const disabledDueToNoBackup = (accountCreationTime: number, backupCompleted: boolean) => {
  return timeDeltaInDays(Date.now(), accountCreationTime) > DAYS_TO_BACKUP && !backupCompleted
}

export const isBackupTooLate = (state: RootState) => {
  return disabledDueToNoBackup(state.account.accountCreationTime, state.account.backupCompleted)
}

export const getNetworkConnected = (state: RootState) => state.networkInfo.connected

export const isAppConnected = createSelector(
  isGethConnectedSelector,
  getNetworkConnected,
  (gethConnected, networkConnected) => gethConnected && networkConnected
)

export const getTabBarActiveNotification = createSelector(
  isBackupTooLate,
  getPaymentRequests,
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
export const showRefreshBalanceMessage = (state: RootState) =>
  areAllBalancesFresh(state) && isAppConnected(state)

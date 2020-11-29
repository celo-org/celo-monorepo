import { createSelector } from 'reselect'
import { BALANCE_OUT_OF_SYNC_THRESHOLD } from 'src/config'
import { isGethConnectedSelector } from 'src/geth/selectors'
import { RootState } from 'src/redux/reducers'
import { timeDeltaInSeconds } from 'src/utils/time'

export const getNetworkConnected = (state: RootState) => state.networkInfo.connected

export const isAppConnected = createSelector(
  isGethConnectedSelector,
  getNetworkConnected,
  (gethConnected, networkConnected) => gethConnected && networkConnected
)

export const isAppSynced = (state: RootState) => {
  return (
    state.web3.syncProgress.currentBlock > 0 &&
    state.web3.syncProgress.highestBlock > 0 &&
    state.web3.syncProgress.currentBlock === state.web3.syncProgress.highestBlock
  )
}

export const celoTokenLastFetch = (state: RootState) => state.goldToken.lastFetch || 0
export const stableTokenLastFetch = (state: RootState) => state.stableToken.lastFetch || 0

export const lastFetchTooOld = (lastFetch: number) => {
  // if lastFetch is null, then skip
  return !!lastFetch && timeDeltaInSeconds(Date.now(), lastFetch) > BALANCE_OUT_OF_SYNC_THRESHOLD
}

export const isStableTokenBalanceStale = (state: RootState) =>
  lastFetchTooOld(stableTokenLastFetch(state))

export const isCeloTokenBalanceStale = (state: RootState) =>
  lastFetchTooOld(stableTokenLastFetch(state))

export const areAllBalancesStale = (state: RootState) =>
  isCeloTokenBalanceStale(state) || isStableTokenBalanceStale(state)

// isAppConnected is used to either show the "disconnected banner" or "Refresh balance"
// but not both at the same time
export const shouldUpdateBalance = (state: RootState) =>
  areAllBalancesStale(state) && isAppConnected(state)

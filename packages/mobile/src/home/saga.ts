import {
  call,
  cancel,
  delay,
  fork,
  put,
  select,
  spawn,
  take,
  takeLeading,
} from 'redux-saga/effects'
import { fetchSentEscrowPayments } from 'src/escrow/actions'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { Actions, refreshAllBalances, setLoading } from 'src/home/actions'
import { withTimeout } from 'src/redux/sagas-helpers'
import { shouldUpdateBalance } from 'src/redux/selectors'
import { fetchDollarBalance } from 'src/stableToken/actions'
import Logger from 'src/utils/Logger'
import { getConnectedAccount } from 'src/web3/saga'

const REFRESH_TIMEOUT = 15000
const TAG = 'home/saga'

export function withLoading<Fn extends (...args: any[]) => any>(fn: Fn, ...args: Parameters<Fn>) {
  return function* withLoadingGen() {
    yield put(setLoading(true))
    try {
      const res = yield call(fn, ...args)
      return res
    } finally {
      yield put(setLoading(false))
    }
  }
}

export function* refreshBalances() {
  Logger.debug(TAG, 'Fetching all balances')
  yield call(getConnectedAccount)
  yield put(fetchDollarBalance())
  yield put(fetchGoldBalance())
  yield put(fetchSentEscrowPayments())
}

export function* refreshBalancesWithLoadingSaga() {
  yield takeLeading(
    Actions.REFRESH_BALANCES,
    withLoading(withTimeout(REFRESH_TIMEOUT, refreshBalances))
  )
}

function* autoRefreshSaga() {
  while (true) {
    yield delay(10 * 1000) // sleep 10 seconds
    if (yield select(shouldUpdateBalance)) {
      put(refreshAllBalances())
    }
  }
}

function* autoRefreshWatcher() {
  while (yield take(Actions.START_BALANCE_AUTOREFRESH)) {
    // starts the task in the background
    const autoRefresh = yield fork(autoRefreshSaga)
    yield take(Actions.STOP_BALANCE_AUTOREFRESH)
    yield cancel(autoRefresh)
  }
}

function* watchRefreshBalances() {
  yield takeLeading(
    Actions.REFRESH_BALANCES,
    withLoading(withTimeout(REFRESH_TIMEOUT, refreshBalances))
  )
}

export function* homeSaga() {
  yield spawn(watchRefreshBalances)
  yield spawn(autoRefreshWatcher)
  // This has been disabled due to the saga interference bug
  // depending on timing, it can block the sync progress updates and
  // keep us stuck on sync screen
  // yield spawn(refreshBalancesWithLoadingSaga)
}

export const _watchRefreshBalances = watchRefreshBalances

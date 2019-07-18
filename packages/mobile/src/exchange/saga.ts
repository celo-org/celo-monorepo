import { spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import { Actions, doFetchExchangeRate, exchangeGoldAndStableTokens } from 'src/exchange/actions'

export function* watchFetchExchangeRate() {
  yield takeLatest(Actions.FETCH_EXCHANGE_RATE, doFetchExchangeRate)
}

export function* watchExchangeTokens() {
  // @ts-ignore saga doesn't seem to understand the action with multiple params?
  yield takeEvery(Actions.EXCHANGE_TOKENS, exchangeGoldAndStableTokens)
}

export function* exchangeSaga() {
  yield spawn(watchFetchExchangeRate)
  yield spawn(watchExchangeTokens)
}

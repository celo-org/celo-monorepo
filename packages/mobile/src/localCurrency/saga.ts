import gql from 'graphql-tag'
import { call, put, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { apolloClient } from 'src/apollo'
import {
  Actions,
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import Logger from 'src/utils/Logger'

const TAG = 'localCurrency/saga'

export async function fetchExchangeRate(symbol: string): Promise<number> {
  const response = await apolloClient.query({
    query: gql`
    {    
      currencyConversion(currencyCode: "${symbol}") {
        rate
      }
    }
  `,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  })

  const { data } = response
  if (typeof data !== 'object') {
    throw new Error(`Invalid response data ${data}`)
  }

  const { currencyConversion } = data
  if (typeof currencyConversion !== 'object') {
    throw new Error(`Invalid response data ${data}`)
  }

  const { rate } = currencyConversion
  if (typeof rate !== 'number') {
    throw new Error(`Invalid response data ${data}`)
  }

  return rate
}

export function* fetchLocalCurrencyRateSaga() {
  try {
    const localCurrencyCode: LocalCurrencyCode | null = yield select(getLocalCurrencyCode)
    if (!localCurrencyCode) {
      throw new Error("Can't fetch local currency rate without a currency code")
    }
    const rate = yield call(fetchExchangeRate, localCurrencyCode)
    yield put(fetchCurrentRateSuccess(localCurrencyCode, rate, Date.now()))
  } catch (error) {
    Logger.error(`${TAG}@fetchLocalCurrencyRateSaga`, error)
    yield put(fetchCurrentRateFailure())
  }
}

export function* watchFetchCurrentRate() {
  yield takeLatest(Actions.FETCH_CURRENT_RATE, fetchLocalCurrencyRateSaga)
}

export function* watchSelectPreferredCurrency() {
  while (true) {
    yield take(Actions.SELECT_PREFERRED_CURRENCY)
    yield put(fetchCurrentRate())
  }
}

export function* localCurrencySaga() {
  yield spawn(watchFetchCurrentRate)
  yield spawn(watchSelectPreferredCurrency)
}

import gql from 'graphql-tag'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { apolloClient } from 'src/apollo'
import { LOCAL_CURRENCY_SYMBOL } from 'src/config'
import {
  Actions,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
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
  if (!LOCAL_CURRENCY_SYMBOL) {
    return
  }

  try {
    const rate = yield call(fetchExchangeRate, LOCAL_CURRENCY_SYMBOL)
    yield put(fetchCurrentRateSuccess(rate, Date.now()))
  } catch (error) {
    Logger.error(`${TAG}@fetchLocalCurrencyRateSaga`, error)
    yield put(fetchCurrentRateFailure())
  }
}

export function* watchFetchCurrentRate() {
  yield takeLeading(Actions.FETCH_CURRENT_RATE, fetchLocalCurrencyRateSaga)
}

export function* localCurrencySaga() {
  yield spawn(watchFetchCurrentRate)
}

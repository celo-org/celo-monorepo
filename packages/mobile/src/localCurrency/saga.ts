import gql from 'graphql-tag'
import { call, delay, put, select, spawn, take } from 'redux-saga/effects'
import { apolloClient } from 'src/apollo'
import { waitForRehydrate } from 'src/app/saga'
import { LOCAL_CURRENCY_SYMBOL } from 'src/config'
import {
  fetchCurrentRateFailure,
  fetchCurrentRateStart,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const TAG = 'localCurrency/saga'

const MIN_UPDATE_INTERVAL = 24 * 3600 * 1000 // 24 hours

// Delay before retrying when an error is raised
const RETRY_DELAY = 10 * 1000 // 10 secs

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

export function* updateLocalCurrencyRate() {
  if (!LOCAL_CURRENCY_SYMBOL) {
    return
  }

  yield call(waitForRehydrate)

  while (true) {
    try {
      const lastSuccessfulUpdate: number | undefined = yield select(
        (state: RootState) => state.localCurrency.lastSuccessfulUpdate
      )
      if (lastSuccessfulUpdate && Date.now() - lastSuccessfulUpdate < MIN_UPDATE_INTERVAL) {
        yield take()
        continue
      }

      yield put(fetchCurrentRateStart())
      const rate = yield call(fetchExchangeRate, LOCAL_CURRENCY_SYMBOL)
      yield put(fetchCurrentRateSuccess(rate, Date.now()))
    } catch (error) {
      Logger.error(`${TAG}@updateLocalCurrencyRate`, error)
      yield put(fetchCurrentRateFailure())
      yield delay(RETRY_DELAY)
    }
  }
}

export function* localCurrencySaga() {
  yield spawn(updateLocalCurrencyRate)
}

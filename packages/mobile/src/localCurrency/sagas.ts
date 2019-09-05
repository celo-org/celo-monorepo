import gql from 'graphql-tag'
import { call, delay, put, spawn } from 'redux-saga/effects'
import { apolloClient } from 'src/apollo'
import { waitForRehydrate } from 'src/app/saga'
import { LOCAL_CURRENCY_SYMBOL } from 'src/config'
import {
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import Logger from 'src/utils/Logger'

const TAG = 'localCurrency/saga'

const POLLING_DELAY = 3600 * 1000 // 1 hour

// Delay before retrying when an error is raised
const RETRY_DELAY = 10 * 1000 // 10 secs

async function fetchExchangeRate(symbol: string): Promise<number> {
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

function* updateLocalCurrencyRate() {
  if (!LOCAL_CURRENCY_SYMBOL) {
    return
  }

  yield call(waitForRehydrate)

  while (true) {
    try {
      yield put(fetchCurrentRate())
      const rate = yield call(fetchExchangeRate, LOCAL_CURRENCY_SYMBOL)
      yield put(fetchCurrentRateSuccess(rate))
      yield delay(POLLING_DELAY)
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

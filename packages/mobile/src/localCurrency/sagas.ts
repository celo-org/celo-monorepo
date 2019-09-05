import { call, delay, put, spawn } from 'redux-saga/effects'
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
  // TODO: replace by our own endpoint once it's ready
  const response = await fetch(`https://api.exchangeratesapi.io/latest?base=USD&symbols=${symbol}`)
  if (response.status !== 200) {
    throw new Error(`Invalid response status ${response.status}`)
  }

  const json = await response.json()
  if (typeof json !== 'object') {
    throw new Error(`Invalid response ${json}`)
  }

  const { rates } = json
  if (typeof rates !== 'object') {
    throw new Error(`Invalid response ${json}`)
  }

  const rate = rates[symbol]
  if (typeof rate !== 'number') {
    throw new Error(`Invalid response ${json}`)
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

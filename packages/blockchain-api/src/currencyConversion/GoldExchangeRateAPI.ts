import { DataSource, DataSourceConfig } from 'apollo-datasource'
import BigNumber from 'bignumber.js'
import { database } from '../firebase'
import { CurrencyConversionArgs } from '../schema'
import { CUSD } from './consts'

// Firebase stored exchange rate
interface ExchangeRateObject {
  exchangeRate: string
  timestamp: number // timestamp in milliseconds
}

// Binary search in sorted array
function findClosestRate(
  rates: ExchangeRateObject[],
  timestamp: number
): ExchangeRateObject | undefined {
  let lo = 0
  let hi = rates.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const rate = rates[mid]
    if (timestamp < rate.timestamp) {
      hi = mid - 1
    } else if (timestamp > rate.timestamp) {
      lo = mid + 1
    } else {
      return rate
    }
  }

  // At this point lo = hi + 1
  const loRate = rates[lo]
  const hiRate = rates[hi]
  if (!loRate || !hiRate) {
    return loRate || hiRate
  }

  return loRate.timestamp - timestamp < timestamp - hiRate.timestamp ? loRate : hiRate
}

export default class GoldExchangeRateAPI<TContext = any> extends DataSource {
  // This memoizes results for the current request only
  // new datasources are instantiated for each new request
  memoizedResults = new Map<string, Promise<BigNumber>>()

  initialize(config: DataSourceConfig<TContext>): void {
    // TODO(jeanregisser): keep config.cache
  }

  // TODO(jeanregisser): add caching (using config.cache)
  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
  }: Omit<CurrencyConversionArgs, 'impliedCeloToCUSDExchangeRate'>): Promise<BigNumber> {
    const date = timestamp ? new Date(timestamp) : new Date()

    const pair = `${sourceCurrencyCode || CUSD}/${currencyCode}`
    const cacheKey = `${pair}-${date.getTime()}`

    let promise = this.memoizedResults.get(cacheKey)
    if (!promise) {
      promise = this.performRequest(pair, date)
      this.memoizedResults.set(cacheKey, promise)
    }

    return promise
  }

  private async performRequest(pair: string, date: Date) {
    const ref = database.ref(`exchangeRates/${pair}`)
    const snapshot = await ref
      .orderByChild('timestamp')
      .startAt(date.getTime() - 30 * 60 * 1000)
      .endAt(date.getTime() + 30 * 60 * 1000)
      .once('value')

    const rates: ExchangeRateObject[] = Object.values(snapshot.val() || {})
    const closestItem = findClosestRate(rates, date.getTime())
    if (!closestItem) {
      throw new Error(`No matching data for ${pair}`)
    }

    return new BigNumber(closestItem.exchangeRate)
  }
}

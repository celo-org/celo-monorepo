import { DataSource, DataSourceConfig } from 'apollo-datasource'
import BigNumber from 'bignumber.js'
import { database } from '../firebase'
import { CurrencyConversionArgs } from '../schema'
import { CUSD } from './consts'

// Firebase stored exchange rate
interface ExchangeRateObject {
  pair: string
  exchangeRate: string
  timestamp: number // timestamp in milliseconds
}

// Binary search in sorted array
function findClosestIndex(arr: number[], target: number) {
  if (target < arr[0]) {
    return 0
  }
  if (target > arr[arr.length - 1]) {
    return arr.length - 1
  }

  let lo = 0
  let hi = arr.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (target < arr[mid]) {
      hi = mid - 1
    } else if (target > arr[mid]) {
      lo = mid + 1
    } else {
      return mid
    }
  }
  return arr[lo] - target < target - arr[hi] ? lo : hi
}

export default class GoldExchangeRateAPI<TContext = any> extends DataSource {
  // httpCache!: HTTPCache;
  // context!: TContext;
  // memoizedResults = new Map<string, Promise<any>>();

  initialize(config: DataSourceConfig<TContext>): void {
    // this.context = config.context;
    // this.httpCache = new HTTPCache(config.cache);
  }

  // TODO(jeanregisser): add caching (using config.cache)
  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    const date = timestamp ? new Date(timestamp) : new Date()

    const filterPair = `${sourceCurrencyCode || CUSD}/${currencyCode}`

    const ref = database.ref('exchangeRates')
    const snapshot = await ref
      .orderByChild('timestamp')
      .startAt(date.getTime() - 30 * 60 * 1000)
      .endAt(date.getTime() + 30 * 60 * 1000)
      .once('value')

    const rates: ExchangeRateObject[] = Object.values(snapshot.val())
    const filteredRates = rates.filter((item) => item.pair === filterPair)
    const closestIndex = findClosestIndex(
      filteredRates.map((item) => item.timestamp),
      date.getTime()
    )
    const closestItem = filteredRates[closestIndex]
    if (!closestItem) {
      throw new Error(`No matching data for ${filterPair}`)
    }

    return new BigNumber(closestItem.exchangeRate)
  }
}

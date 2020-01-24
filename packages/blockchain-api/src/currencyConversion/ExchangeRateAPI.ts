import { RESTDataSource } from 'apollo-datasource-rest'
import BigNumber from 'bignumber.js'
import { EXCHANGE_RATES_API, EXCHANGE_RATES_API_ACCESS_KEY } from '../config'
import { CurrencyConversionArgs } from '../schema'
import { formatDateString } from '../utils'
import { USD } from './consts'

interface ExchangeRateApiResult {
  success: boolean
  quotes: { [currencyCode: string]: number }
  base: string
  date: string
}

// ttl in seconds!
const MIN_TTL = 12 * 3600 // 12 hours

export default class ExchangeRateAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = EXCHANGE_RATES_API
  }

  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    if (!currencyCode) {
      throw new Error('No currency code specified')
    }

    const date = timestamp ? new Date(timestamp) : new Date()
    const fetchedRate = await this.queryExchangeRate(sourceCurrencyCode || USD, currencyCode, date)

    return new BigNumber(fetchedRate)
  }

  private async queryExchangeRate(sourceCurrencyCode: string, currencyCode: string, date: Date) {
    const pair = `${sourceCurrencyCode}/${currencyCode}`
    const path = `/historical`
    const params = {
      access_key: EXCHANGE_RATES_API_ACCESS_KEY,
      date: formatDateString(date),
      source: sourceCurrencyCode,
    }
    const result = await this.get<ExchangeRateApiResult>(path, params, {
      cacheOptions: { ttl: this.getCacheTtl(date) },
    })
    if (result.success !== true) {
      throw new Error(`Invalid response result: ${JSON.stringify(result)}`)
    }
    const rate = result.quotes[`${sourceCurrencyCode}${currencyCode}`]
    if (rate === undefined) {
      throw new Error(`No matching data for ${pair}`)
    }

    return rate
  }

  // Returns ttl (in seconds)
  private getCacheTtl(date: Date) {
    if (Date.now() - date.getTime() >= 24 * 3600 * 1000) {
      // Cache indefinitely if requesting a date prior to the last 24 hours
      return Number.MAX_SAFE_INTEGER
    } else {
      return MIN_TTL
    }
  }
}

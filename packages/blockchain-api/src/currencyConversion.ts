import { RESTDataSource } from 'apollo-datasource-rest'
import { EXCHANGE_RATES_API, EXCHANGE_RATES_API_ACCESS_KEY } from './config'
import { CurrencyConversionArgs, ExchangeRate } from './schema'
import { formatDateString } from './utils'

interface ExchangeRateApiResult {
  success: boolean
  quotes: { [currencyCode: string]: number }
  base: string
  date: string
}

// ttl in seconds!
const MIN_TTL = 12 * 3600 // 12 hours

export class CurrencyConversionAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = EXCHANGE_RATES_API
  }

  async getExchangeRate({
    currencyCode,
    timestamp,
  }: CurrencyConversionArgs): Promise<ExchangeRate> {
    console.debug('Getting exchange rate', currencyCode, timestamp)
    try {
      if (!currencyCode) {
        throw new Error('No currency code specified')
      }

      const date = timestamp ? new Date(timestamp) : new Date()
      const fetchedRate = await this.queryExchangeRate(currencyCode, date)

      return { rate: fetchedRate }
    } catch (error) {
      console.error('Error fetching exchange rate', error)
      throw new Error('Failed to retrieve exchange rate')
    }
  }

  private async queryExchangeRate(currencyCode: string, date: Date) {
    console.debug('Querying exchange rate', currencyCode, date)
    const path = `/historical`
    const params = {
      access_key: EXCHANGE_RATES_API_ACCESS_KEY,
      date: formatDateString(date),
    }
    const result = await this.get<ExchangeRateApiResult>(path, params, {
      cacheOptions: { ttl: this.getCacheTtl(date) },
    })
    if (result.success !== true) {
      throw new Error(`Invalid response result: ${JSON.stringify(result)}`)
    }
    const rate = result.quotes[`USD${currencyCode}`]
    console.debug('Retrieved rate', currencyCode, rate)
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

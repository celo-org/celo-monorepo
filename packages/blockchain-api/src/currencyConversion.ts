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

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

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
      // base: 'USD',
      // symbols: currencyCode,
      access_key: EXCHANGE_RATES_API_ACCESS_KEY,
      date: formatDateString(date),
    }
    const result = await this.get<ExchangeRateApiResult>(path, params, {
      cacheOptions: { ttl: MIN_UPDATE_INTERVAL },
    })
    if (result.success !== true) {
      throw new Error(`Invalid response result: ${JSON.stringify(result)}`)
    }
    const rate = result.quotes[`USD${currencyCode}`]
    console.debug('Retrieved rate', currencyCode, rate)
    return rate
  }
}

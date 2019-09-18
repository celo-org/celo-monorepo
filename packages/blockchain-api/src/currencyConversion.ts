import { RESTDataSource } from 'apollo-datasource-rest'
import { EXCHANGE_RATES_API } from './config'
import { CurrencyConversionArgs, ExchangeRate } from './schema'
import { formatDateString } from './utils'

interface ExchangeRateApiResult {
  rates: { [currencyCode: string]: number }
  base: string
  date: string
}

export class CurrencyConversionAPI extends RESTDataSource {
  // TODO move this caching to FirebaseDb
  // Currency code to date string to exchange rate
  exchangeRateCache = new Map<string, Map<string, number>>()

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

      const cachedRate = this.getRateForCurrencyCode(currencyCode, date)
      if (cachedRate) {
        console.debug('Found cached exchange rate', currencyCode, cachedRate)
        return { rate: cachedRate }
      }

      const fetchedRate = await this.queryExchangeRate(currencyCode, date)
      this.setRateForCurrencyCode(currencyCode, date, fetchedRate)

      return { rate: fetchedRate }
    } catch (error) {
      console.error('Error fetching exchange rate', error)
      throw new Error('Failed to retrieve exchange rate')
    }
  }

  private async queryExchangeRate(currencyCode: string, date: Date) {
    console.debug('Querying exchange rate', currencyCode, date)
    const path = `/${formatDateString(date)}`
    const params = {
      base: 'USD',
      symbols: currencyCode,
    }
    const result = await this.get<ExchangeRateApiResult>(path, params)
    const rate = result.rates[currencyCode]
    console.debug('Retrieved rate', currencyCode, rate)
    return rate
  }

  private getRateForCurrencyCode(currencyCode: string, date: Date) {
    return (
      (this.exchangeRateCache.get(currencyCode) &&
        this.exchangeRateCache.get(currencyCode)!.get(date.toDateString())) ||
      undefined
    )
  }

  private setRateForCurrencyCode(currencyCode: string, date: Date, rate: number) {
    if (!this.exchangeRateCache.get(currencyCode)) {
      this.exchangeRateCache.set(currencyCode, new Map())
    }
    this.exchangeRateCache.get(currencyCode)!.set(date.toDateString(), rate)
  }
}

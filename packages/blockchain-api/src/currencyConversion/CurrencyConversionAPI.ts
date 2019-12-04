import { DataSource, DataSourceConfig } from 'apollo-datasource'
import BigNumber from 'bignumber.js'
import { CurrencyConversionArgs } from '../schema'
import { CGLD, CUSD, USD } from './consts'
import ExchangeRateAPI from './ExchangeRateAPI'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'

function insertIf<T>(condition: boolean, element: T) {
  return condition ? [element] : []
}

export default class CurrencyConversionAPI<TContext = any> extends DataSource {
  // httpCache!: HTTPCache;
  // context!: TContext;
  // memoizedResults = new Map<string, Promise<any>>();

  exchangeRateAPI = new ExchangeRateAPI()
  goldExchangeRateAPI = new GoldExchangeRateAPI()

  initialize(config: DataSourceConfig<TContext>): void {
    // this.context = config.context;
    // this.httpCache = new HTTPCache(config.cache);
    this.exchangeRateAPI.initialize(config)
    this.goldExchangeRateAPI.initialize(config)
  }

  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    const fromCode = sourceCurrencyCode || USD
    const toCode = currencyCode

    const steps = this.getConversionSteps(fromCode, toCode)

    const ratesPromises = []
    for (let i = 1; i < steps.length; i++) {
      const prevCode = steps[i - 1]
      const code = steps[i]
      ratesPromises.push(this.getSupportedExchangeRate(prevCode, code, timestamp))
    }

    const rates = await Promise.all(ratesPromises)

    // Multiply all rates
    return rates.reduce((acc, rate) => acc.multipliedBy(rate), new BigNumber(1))
  }

  private getConversionSteps(fromCode: string, toCode: string) {
    if (fromCode === toCode) {
      // Same code, nothing to do
      return []
    } else if (fromCode === CGLD || toCode === CGLD) {
      // cGLD -> X (where X !== cUSD)
      if (fromCode === CGLD && toCode !== CUSD) {
        return [CGLD, CUSD, ...insertIf(toCode !== USD, USD), toCode]
      }
      // X -> cGLD (where X !== cUSD)
      else if (fromCode !== CUSD && toCode === CGLD) {
        return [fromCode, ...insertIf(fromCode !== USD, USD), CUSD, CGLD]
      }
    } else {
      // cUSD -> X (where X !== USD)
      if (fromCode === CUSD && toCode !== USD) {
        return [CUSD, USD, toCode]
      }
      // X -> cUSD (where X !== USD)
      else if (fromCode !== USD && toCode === CUSD) {
        return [fromCode, USD, CUSD]
      }
    }

    return [fromCode, toCode]
  }

  private getSupportedExchangeRate(
    fromCode: string,
    toCode: string,
    timestamp?: number
  ): Promise<BigNumber> {
    const pair = `${fromCode}/${toCode}`

    if (pair === 'cUSD/USD' || pair === 'USD/cUSD') {
      return Promise.resolve(new BigNumber(1))
    } else if (pair === 'cGLD/cUSD' || pair === 'cUSD/cGLD') {
      return this.goldExchangeRateAPI.getExchangeRate({
        sourceCurrencyCode: fromCode,
        currencyCode: toCode,
        timestamp,
      })
    } else {
      return this.exchangeRateAPI.getExchangeRate({
        sourceCurrencyCode: fromCode,
        currencyCode: toCode,
        timestamp,
      })
    }
  }
}

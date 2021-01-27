import { DataSource, DataSourceConfig } from 'apollo-datasource'
import BigNumber from 'bignumber.js'
import { CurrencyConversionArgs, MoneyAmount } from '../schema'
import { CGLD, CUSD, USD } from './consts'
import ExchangeRateAPI from './ExchangeRateAPI'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'

function insertIf<T>(condition: boolean, element: T) {
  return condition ? [element] : []
}

export default class CurrencyConversionAPI<TContext = any> extends DataSource {
  exchangeRateAPI = new ExchangeRateAPI()
  goldExchangeRateAPI = new GoldExchangeRateAPI()

  initialize(config: DataSourceConfig<TContext>): void {
    this.exchangeRateAPI.initialize(config)
    this.goldExchangeRateAPI.initialize(config)
  }

  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
    impliedExchangeRates,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    const fromCode = sourceCurrencyCode || USD
    const toCode = currencyCode

    const steps = this.getConversionSteps(fromCode, toCode)

    const ratesPromises = []
    for (let i = 1; i < steps.length; i++) {
      const prevCode = steps[i - 1]
      const code = steps[i]
      ratesPromises.push(
        this.getSupportedExchangeRate(prevCode, code, timestamp, impliedExchangeRates)
      )
    }

    const rates = await Promise.all(ratesPromises)

    // Multiply all rates
    return rates.reduce((acc, rate) => acc.multipliedBy(rate), new BigNumber(1))
  }

  // Get conversion steps given the data we have today
  // Going from cGLD to local currency (or vice versa) is currently assumed to be the same as cGLD -> cUSD -> USD -> local currency.
  // And similar to cUSD to local currency, but with one less step.
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
    timestamp?: number,
    impliedExchangeRates?: MoneyAmount['impliedExchangeRates']
  ): BigNumber | Promise<BigNumber> {
    const pair = `${fromCode}/${toCode}`

    if (impliedExchangeRates && impliedExchangeRates[pair]) {
      return new BigNumber(impliedExchangeRates[pair])
    }

    if (pair === 'cUSD/USD' || pair === 'USD/cUSD') {
      // TODO: use real rates once we have the data
      return new BigNumber(1)
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

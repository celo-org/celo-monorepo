import BigNumber from 'bignumber.js'
import { Exchange } from '../generated/Exchange'
import {
  BaseWrapper,
  CeloTransactionObject,
  fixidityValueToBigNumber,
  identity,
  proxyCall,
  proxySend,
  secondsToDurationString,
  tupleParser,
  unixSecondsTimestampToDateString,
  valueToBigNumber,
  valueToFrac,
  valueToString,
} from './BaseWrapper'

export interface ExchangeConfig {
  spread: BigNumber
  reserveFraction: BigNumber
  updateFrequency: BigNumber
  minimumReports: BigNumber
  lastBucketUpdate: BigNumber
}

/**
 * Contract that allows to exchange StableToken for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
export class ExchangeWrapper extends BaseWrapper<Exchange> {
  /**
   * Query spread parameter
   * @returns Current spread charged on exchanges
   */
  spread = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)
  /**
   * Query reserve fraction parameter
   * @returns Current fraction to commit to the gold bucket
   */
  reserveFraction = proxyCall(
    this.contract.methods.reserveFraction,
    undefined,
    fixidityValueToBigNumber
  )
  /**
   * Query update frequency parameter
   * @returns The time period that needs to elapse between bucket
   * updates
   */
  updateFrequency = proxyCall(this.contract.methods.updateFrequency, undefined, valueToBigNumber)
  /**
   * Query minimum reports parameter
   * @returns The minimum number of fresh reports that need to be
   * present in the oracle to update buckets
   * commit to the gold bucket
   */
  minimumReports = proxyCall(this.contract.methods.minimumReports, undefined, valueToBigNumber)
  /**
   * Query last bucket update
   * @returns The timestamp of the last time exchange buckets were updated.
   */
  lastBucketUpdate = proxyCall(this.contract.methods.lastBucketUpdate, undefined, valueToBigNumber)

  /**
   * DEPRECATED: use function sell
   * Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
   * Requires the sellAmount to have been approved to the exchange
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param minBuyAmount The minimum amount of buyToken the user has to receive for this
   * transaction to succeed
   * @param sellGold `true` if gold is the sell token
   * @return The amount of buyToken that was transfered
   */
  exchange: (
    sellAmount: BigNumber.Value,
    minBuyAmount: BigNumber.Value,
    sellGold: boolean
  ) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.exchange,
    tupleParser(valueToString, valueToString, identity)
  )

  /**
   * Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
   * Requires the sellAmount to have been approved to the exchange
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param minBuyAmount The minimum amount of buyToken the user has to receive for this
   * transaction to succeed
   * @param sellGold `true` if gold is the sell token
   * @return The amount of buyToken that was transfered
   */
  sell: (
    sellAmount: BigNumber.Value,
    minBuyAmount: BigNumber.Value,
    sellGold: boolean
  ) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.sell,
    tupleParser(valueToString, valueToString, identity)
  )

  /**
   * Sells sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
   * Requires the sellAmount to have been approved to the exchange
   * @param buyAmount The amount of sellToken the user is selling to the exchange
   * @param maxSellAmount The maximum amount of sellToken the user will sell for this
   * transaction to succeed
   * @param buyGold `true` if gold is the buy token
   * @return The amount of buyToken that was transfered
   */
  buy: (
    buyAmount: BigNumber.Value,
    maxSellAmount: BigNumber.Value,
    buyGold: boolean
  ) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.buy,
    tupleParser(valueToString, valueToString, identity)
  )

  /**
   * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding buyToken amount.
   */
  async getBuyTokenAmount(sellAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber> {
    const sell = valueToString(sellAmount)
    if (new BigNumber(sell).eq(0)) {
      return new BigNumber(0)
    }
    const res = await this.contract.methods.getBuyTokenAmount(sell, sellGold).call()
    return valueToBigNumber(res)
  }

  /**
   * Returns the amount of sellToken a user would need to exchange to receive buyAmount of
   * buyToken.
   * @param buyAmount The amount of buyToken the user would like to purchase.
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding sellToken amount.
   */
  async getSellTokenAmount(buyAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber> {
    const buy = valueToString(buyAmount)
    if (new BigNumber(buy).eq(0)) {
      return new BigNumber(0)
    }
    const res = await this.contract.methods.getSellTokenAmount(buy, sellGold).call()
    return valueToBigNumber(res)
  }

  /**
   * Returns the buy token and sell token bucket sizes, in order. The ratio of
   * the two also represents the exchange rate between the two.
   * @param sellGold `true` if gold is the sell token
   * @return [buyTokenBucket, sellTokenBucket]
   */
  getBuyAndSellBuckets: (sellGold: boolean) => Promise<[BigNumber, BigNumber]> = proxyCall(
    this.contract.methods.getBuyAndSellBuckets,
    undefined,
    (callRes: { 0: string; 1: string }) =>
      [valueToBigNumber(callRes[0]), valueToBigNumber(callRes[1])] as [BigNumber, BigNumber]
  )

  /**
   * Sell amount of CELO in exchange for at least minUsdAmount of cUsd
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of CELO the user is selling to the exchange
   * @param minUsdAmount The minimum amount of cUsd the user has to receive for this
   * transaction to succeed
   */
  sellGold = (amount: BigNumber.Value, minUSDAmount: BigNumber.Value) =>
    this.sell(amount, minUSDAmount, true)

  /**
   * Sell amount of cUsd in exchange for at least minGoldAmount of CELO
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cUsd the user is selling to the exchange
   * @param minGoldAmount The minimum amount of CELO the user has to receive for this
   * transaction to succeed
   */
  sellDollar = (amount: BigNumber.Value, minGoldAmount: BigNumber.Value) =>
    this.sell(amount, minGoldAmount, false)

  /**
   * Buy amount of CELO in exchange for at most maxUsdAmount of cUsd
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of CELO the user is buying from the exchange
   * @param maxUsdAmount The maximum amount of cUsd the user will pay for this
   * transaction to succeed
   */
  buyGold = (amount: BigNumber.Value, maxUSDAmount: BigNumber.Value) =>
    this.buy(amount, maxUSDAmount, true)

  /**
   * Buy amount of cUsd in exchange for at least minGoldAmount of CELO
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cUsd the user is selling to the exchange
   * @param maxGoldAmount The maximum amount of CELO the user will pay for this
   * transaction to succeed
   */
  buyDollar = (amount: BigNumber.Value, maxGoldAmount: BigNumber.Value) =>
    this.buy(amount, maxGoldAmount, false)

  /**
   * Returns the amount of CELO a user would get for sellAmount of cUsd
   * @param sellAmount The amount of cUsd the user is selling to the exchange
   * @return The corresponding CELO amount.
   */
  quoteUsdSell = (sellAmount: BigNumber.Value) => this.getBuyTokenAmount(sellAmount, false)

  /**
   * Returns the amount of cUsd a user would get for sellAmount of CELO
   * @param sellAmount The amount of CELO the user is selling to the exchange
   * @return The corresponding cUsd amount.
   */
  quoteGoldSell = (sellAmount: BigNumber.Value) => this.getBuyTokenAmount(sellAmount, true)

  /**
   * Returns the amount of CELO a user would need to exchange to receive buyAmount of
   * cUsd.
   * @param buyAmount The amount of cUsd the user would like to purchase.
   * @return The corresponding CELO amount.
   */
  quoteUsdBuy = (buyAmount: BigNumber.Value) => this.getSellTokenAmount(buyAmount, false)

  /**
   * Returns the amount of cUsd a user would need to exchange to receive buyAmount of
   * CELO.
   * @param buyAmount The amount of CELO the user would like to purchase.
   * @return The corresponding cUsd amount.
   */
  quoteGoldBuy = (buyAmount: BigNumber.Value) => this.getSellTokenAmount(buyAmount, true)

  /**
   * @dev Returns the current configuration of the exchange contract
   * @return ExchangeConfig object
   */
  async getConfig(): Promise<ExchangeConfig> {
    const res = await Promise.all([
      this.spread(),
      this.reserveFraction(),
      this.updateFrequency(),
      this.minimumReports(),
      this.lastBucketUpdate(),
    ])
    return {
      spread: res[0],
      reserveFraction: res[1],
      updateFrequency: res[2],
      minimumReports: res[3],
      lastBucketUpdate: res[4],
    }
  }

  /**
   * @dev Returns human readable configuration of the exchange contract
   * @return ExchangeConfig object
   */
  async getHumanReadableConfig() {
    const config = await this.getConfig()
    return {
      ...config,
      updateFrequency: secondsToDurationString(config.updateFrequency),
      lastBucketUpdate: unixSecondsTimestampToDateString(config.lastBucketUpdate),
    }
  }

  /**
   * Returns the exchange rate estimated at buyAmount.
   * @param buyAmount The amount of buyToken in wei to estimate the exchange rate at
   * @param sellGold `true` if gold is the sell token
   * @return The exchange rate (number of sellTokens received for one buyToken).
   */
  async getExchangeRate(buyAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber> {
    const takerAmount = await this.getBuyTokenAmount(buyAmount, sellGold)
    return valueToFrac(buyAmount, takerAmount) // Number of sellTokens received for one buyToken
  }

  /**
   * Returns the exchange rate for cUsd estimated at the buyAmount
   * @param buyAmount The amount of cUsd in wei to estimate the exchange rate at
   * @return The exchange rate (number of CELO received for one cUsd)
   */
  getUsdExchangeRate = (buyAmount: BigNumber.Value) => this.getExchangeRate(buyAmount, false)

  /**
   * Returns the exchange rate for CELO estimated at the buyAmount
   * @param buyAmount The amount of CELO in wei to estimate the exchange rate at
   * @return The exchange rate (number of cUsd received for one CELO)
   */
  getGoldExchangeRate = (buyAmount: BigNumber.Value) => this.getExchangeRate(buyAmount, true)
}

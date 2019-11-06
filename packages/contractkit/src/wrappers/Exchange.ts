import BigNumber from 'bignumber.js'
import { Exchange } from '../generated/types/Exchange'
import {
  BaseWrapper,
  CeloTransactionObject,
  identity,
  NumberLike,
  parseNumber,
  proxyCall,
  proxySend,
  toBigNumber,
  tupleParser,
} from './BaseWrapper'

export interface ExchangeConfig {
  spread: BigNumber
  reserveFraction: BigNumber
  updateFrequency: BigNumber
  minimumReports: BigNumber
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
  spread = proxyCall(this.contract.methods.spread, undefined, toBigNumber)
  /**
   * Query reserve fraction parameter
   * @returns Current fraction to commit to the gold bucket
   */
  reserveFraction = proxyCall(this.contract.methods.reserveFraction, undefined, toBigNumber)
  /**
   * Query update frequency parameter
   * @returns The time period that needs to elapse between bucket
   * updates
   */
  updateFrequency = proxyCall(this.contract.methods.updateFrequency, undefined, toBigNumber)
  /**
   * Query minimum reports parameter
   * @returns The minimum number of fresh reports that need to be
   * present in the oracle to update buckets
   * commit to the gold bucket
   */
  minimumReports = proxyCall(this.contract.methods.minimumReports, undefined, toBigNumber)

  /**
   * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding buyToken amount.
   */
  getBuyTokenAmount: (sellAmount: NumberLike, sellGold: boolean) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getBuyTokenAmount,
    tupleParser(parseNumber, identity),
    toBigNumber
  )

  /**
   * Returns the amount of sellToken a user would need to exchange to receive buyAmount of
   * buyToken.
   * @param buyAmount The amount of buyToken the user would like to purchase.
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding sellToken amount.
   */
  getSellTokenAmount: (buyAmount: NumberLike, sellGold: boolean) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getSellTokenAmount,
    tupleParser(parseNumber, identity),
    toBigNumber
  )

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
      [toBigNumber(callRes[0]), toBigNumber(callRes[1])] as [BigNumber, BigNumber]
  )

  /**
   * Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
   * Requires the sellAmount to have been approved to the exchange
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param minBuyAmount The minimum amount of buyToken the user has to receive for this
   * transaction to succeed
   * @param sellGold `true` if gold is the sell token
   * @return The amount of buyToken that was transfered
   */
  exchange: (
    sellAmount: NumberLike,
    minBuyAmount: NumberLike,
    sellGold: boolean
  ) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.exchange,
    tupleParser(parseNumber, parseNumber, identity)
  )

  /**
   * Exchanges amount of cGold in exchange for at least minUsdAmount of cUsd
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cGold the user is selling to the exchange
   * @param minUsdAmount The minimum amount of cUsd the user has to receive for this
   * transaction to succeed
   */
  sellGold = (amount: NumberLike, minUSDAmount: NumberLike) =>
    this.exchange(amount, minUSDAmount, true)

  /**
   * Exchanges amount of cUsd in exchange for at least minGoldAmount of cGold
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cUsd the user is selling to the exchange
   * @param minGoldAmount The minimum amount of cGold the user has to receive for this
   * transaction to succeed
   */
  sellDollar = (amount: NumberLike, minGoldAmount: NumberLike) =>
    this.exchange(amount, minGoldAmount, false)

  /**
   * Returns the amount of cGold a user would get for sellAmount of cUsd
   * @param sellAmount The amount of cUsd the user is selling to the exchange
   * @return The corresponding cGold amount.
   */
  quoteUsdSell = (sellAmount: NumberLike) => this.getBuyTokenAmount(sellAmount, false)

  /**
   * Returns the amount of cUsd a user would get for sellAmount of cGold
   * @param sellAmount The amount of cGold the user is selling to the exchange
   * @return The corresponding cUsd amount.
   */
  quoteGoldSell = (sellAmount: NumberLike) => this.getBuyTokenAmount(sellAmount, true)

  /**
   * Returns the amount of cGold a user would need to exchange to receive buyAmount of
   * cUsd.
   * @param buyAmount The amount of cUsd the user would like to purchase.
   * @return The corresponding cGold amount.
   */
  quoteUsdBuy = (buyAmount: NumberLike) => this.getSellTokenAmount(buyAmount, false)

  /**
   * Returns the amount of cUsd a user would need to exchange to receive buyAmount of
   * cGold.
   * @param buyAmount The amount of cGold the user would like to purchase.
   * @return The corresponding cUsd amount.
   */
  quoteGoldBuy = (buyAmount: NumberLike) => this.getSellTokenAmount(buyAmount, true)

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
    ])
    return {
      spread: res[0],
      reserveFraction: res[1],
      updateFrequency: res[2],
      minimumReports: res[3],
    }
  }
  /**
   * Returns the exchange rate estimated at buyAmount.
   * @param buyAmount The amount of buyToken in wei to estimate the exchange rate at
   * @param sellGold `true` if gold is the sell token
   * @return The exchange rate (number of sellTokens received for one buyToken).
   */
  async getExchangeRate(buyAmount: NumberLike, sellGold: boolean): Promise<BigNumber> {
    const takerAmount = await this.getBuyTokenAmount(buyAmount, sellGold)
    return new BigNumber(buyAmount).dividedBy(takerAmount) // Number of sellTokens received for one buyToken
  }

  /**
   * Returns the exchange rate for cUsd estimated at the buyAmount
   * @param buyAmount The amount of cUsd in wei to estimate the exchange rate at
   * @return The exchange rate (number of cGold received for one cUsd)
   */
  getUsdExchangeRate = (buyAmount: NumberLike) => this.getExchangeRate(buyAmount, false)

  /**
   * Returns the exchange rate for cGold estimated at the buyAmount
   * @param buyAmount The amount of cGold in wei to estimate the exchange rate at
   * @return The exchange rate (number of cUsd received for one cGold)
   */
  getGoldExchangeRate = (buyAmount: NumberLike) => this.getExchangeRate(buyAmount, true)
}

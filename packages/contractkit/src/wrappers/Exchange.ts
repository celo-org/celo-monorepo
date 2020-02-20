import BigNumber from 'bignumber.js'
import { Exchange } from '../generated/types/Exchange'
import {
  BaseWrapper,
  CeloTransactionObject,
  identity,
  proxyCall,
  proxySend,
  tupleParser,
  valueToBigNumber,
  valueToFrac,
  valueToString,
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
  spread = proxyCall(this.contract.methods.spread, undefined, valueToBigNumber)
  /**
   * Query reserve fraction parameter
   * @returns Current fraction to commit to the gold bucket
   */
  reserveFraction = proxyCall(this.contract.methods.reserveFraction, undefined, valueToBigNumber)
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
   * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
   * @param sellAmount The amount of sellToken the user is selling to the exchange
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding buyToken amount.
   */
  getBuyTokenAmount: (
    sellAmount: BigNumber.Value,
    sellGold: boolean
  ) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getBuyTokenAmount,
    tupleParser(valueToString, identity),
    valueToBigNumber
  )

  /**
   * Returns the amount of sellToken a user would need to exchange to receive buyAmount of
   * buyToken.
   * @param buyAmount The amount of buyToken the user would like to purchase.
   * @param sellGold `true` if gold is the sell token
   * @return The corresponding sellToken amount.
   */
  getSellTokenAmount: (
    buyAmount: BigNumber.Value,
    sellGold: boolean
  ) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getSellTokenAmount,
    tupleParser(valueToString, identity),
    valueToBigNumber
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
      [valueToBigNumber(callRes[0]), valueToBigNumber(callRes[1])] as [BigNumber, BigNumber]
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
    sellAmount: BigNumber.Value,
    minBuyAmount: BigNumber.Value,
    sellGold: boolean
  ) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.exchange,
    tupleParser(valueToString, valueToString, identity)
  )

  /**
   * Exchanges amount of cGLD in exchange for at least minUsdAmount of cUsd
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cGLD the user is selling to the exchange
   * @param minUsdAmount The minimum amount of cUsd the user has to receive for this
   * transaction to succeed
   */
  sellGold = (amount: BigNumber.Value, minUSDAmount: BigNumber.Value) =>
    this.exchange(amount, minUSDAmount, true)

  /**
   * Exchanges amount of cUsd in exchange for at least minGoldAmount of cGLD
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cUsd the user is selling to the exchange
   * @param minGoldAmount The minimum amount of cGLD the user has to receive for this
   * transaction to succeed
   */
  sellDollar = (amount: BigNumber.Value, minGoldAmount: BigNumber.Value) =>
    this.exchange(amount, minGoldAmount, false)

  /**
   * Returns the amount of cGLD a user would get for sellAmount of cUsd
   * @param sellAmount The amount of cUsd the user is selling to the exchange
   * @return The corresponding cGLD amount.
   */
  quoteUsdSell = (sellAmount: BigNumber.Value) => this.getBuyTokenAmount(sellAmount, false)

  /**
   * Returns the amount of cUsd a user would get for sellAmount of cGLD
   * @param sellAmount The amount of cGLD the user is selling to the exchange
   * @return The corresponding cUsd amount.
   */
  quoteGoldSell = (sellAmount: BigNumber.Value) => this.getBuyTokenAmount(sellAmount, true)

  /**
   * Returns the amount of cGLD a user would need to exchange to receive buyAmount of
   * cUsd.
   * @param buyAmount The amount of cUsd the user would like to purchase.
   * @return The corresponding cGLD amount.
   */
  quoteUsdBuy = (buyAmount: BigNumber.Value) => this.getSellTokenAmount(buyAmount, false)

  /**
   * Returns the amount of cUsd a user would need to exchange to receive buyAmount of
   * cGLD.
   * @param buyAmount The amount of cGLD the user would like to purchase.
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
  async getExchangeRate(buyAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber> {
    const takerAmount = await this.getBuyTokenAmount(buyAmount, sellGold)
    return valueToFrac(buyAmount, takerAmount) // Number of sellTokens received for one buyToken
  }

  /**
   * Returns the exchange rate for cUsd estimated at the buyAmount
   * @param buyAmount The amount of cUsd in wei to estimate the exchange rate at
   * @return The exchange rate (number of cGLD received for one cUsd)
   */
  getUsdExchangeRate = (buyAmount: BigNumber.Value) => this.getExchangeRate(buyAmount, false)

  /**
   * Returns the exchange rate for cGLD estimated at the buyAmount
   * @param buyAmount The amount of cGLD in wei to estimate the exchange rate at
   * @return The exchange rate (number of cUsd received for one cGLD)
   */
  getGoldExchangeRate = (buyAmount: BigNumber.Value) => this.getExchangeRate(buyAmount, true)
}

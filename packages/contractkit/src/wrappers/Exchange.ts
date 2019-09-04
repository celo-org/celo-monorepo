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

/**
 * Contract that allows to exchange StableToken for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
export class ExchangeWrapper extends BaseWrapper<Exchange> {
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
}

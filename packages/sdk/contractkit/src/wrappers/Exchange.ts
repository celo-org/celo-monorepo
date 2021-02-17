import { BaseExchangeWrapper } from './BaseExchange'
import { Exchange } from '../generated/Exchange'

/**
 * Contract that allows to exchange StableToken (cUSD) for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
export class ExchangeWrapper extends BaseExchangeWrapper<Exchange> {
  /* Aliases for backward compatibility */

  /**
   * Sell amount of cUsd in exchange for at least minGoldAmount of CELO
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cUsd the user is selling to the exchange
   * @param minGoldAmount The minimum amount of CELO the user has to receive for this
   * transaction to succeed
   */
  sellDollar = this.sellStable

  /**
   * Buy amount of cUsd in exchange for at least minGoldAmount of CELO
   * Requires the amount to have been approved to the exchange
   * @param amount The amount of cUsd the user is selling to the exchange
   * @param maxGoldAmount The maximum amount of CELO the user will pay for this
   * transaction to succeed
   */
  buyDollar = this.buyStable

  /**
   * Returns the amount of CELO a user would get for sellAmount of cUsd
   * @param sellAmount The amount of cUsd the user is selling to the exchange
   * @return The corresponding CELO amount.
   */
  quoteUsdSell = this.quoteStableSell

  /**
   * Returns the amount of CELO a user would need to exchange to receive buyAmount of
   * cUsd.
   * @param buyAmount The amount of cUsd the user would like to purchase.
   * @return The corresponding CELO amount.
   */
  quoteUsdBuy = this.quoteStableBuy

  /**
   * Returns the exchange rate for cUsd estimated at the buyAmount
   * @param buyAmount The amount of cUsd in wei to estimate the exchange rate at
   * @return The exchange rate (number of CELO received for one cUsd)
   */
  getUsdExchangeRate = this.getStableExchangeRate
}

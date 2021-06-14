import BigNumber from 'bignumber.js';
import { Exchange } from '../generated/Exchange';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export interface ExchangeConfig {
    spread: BigNumber;
    reserveFraction: BigNumber;
    updateFrequency: BigNumber;
    minimumReports: BigNumber;
    lastBucketUpdate: BigNumber;
}
/**
 * Contract that allows to exchange StableToken for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
export declare class ExchangeWrapper extends BaseWrapper<Exchange> {
    /**
     * Query spread parameter
     * @returns Current spread charged on exchanges
     */
    spread: () => Promise<BigNumber>;
    /**
     * Query reserve fraction parameter
     * @returns Current fraction to commit to the gold bucket
     */
    reserveFraction: () => Promise<BigNumber>;
    /**
     * Query update frequency parameter
     * @returns The time period that needs to elapse between bucket
     * updates
     */
    updateFrequency: () => Promise<BigNumber>;
    /**
     * Query minimum reports parameter
     * @returns The minimum number of fresh reports that need to be
     * present in the oracle to update buckets
     * commit to the gold bucket
     */
    minimumReports: () => Promise<BigNumber>;
    /**
     * Query last bucket update
     * @returns The timestamp of the last time exchange buckets were updated.
     */
    lastBucketUpdate: () => Promise<BigNumber>;
    /**
     * @dev Returns the amount of buyToken a user would get for sellAmount of sellToken
     * @param sellAmount The amount of sellToken the user is selling to the exchange
     * @param sellGold `true` if gold is the sell token
     * @return The corresponding buyToken amount.
     */
    getBuyTokenAmount(sellAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber>;
    /**
     * Returns the amount of sellToken a user would need to exchange to receive buyAmount of
     * buyToken.
     * @param buyAmount The amount of buyToken the user would like to purchase.
     * @param sellGold `true` if gold is the sell token
     * @return The corresponding sellToken amount.
     */
    getSellTokenAmount(buyAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber>;
    /**
     * Returns the buy token and sell token bucket sizes, in order. The ratio of
     * the two also represents the exchange rate between the two.
     * @param sellGold `true` if gold is the sell token
     * @return [buyTokenBucket, sellTokenBucket]
     */
    getBuyAndSellBuckets: (sellGold: boolean) => Promise<[BigNumber, BigNumber]>;
    /**
     * Exchanges sellAmount of sellToken in exchange for at least minBuyAmount of buyToken
     * Requires the sellAmount to have been approved to the exchange
     * @param sellAmount The amount of sellToken the user is selling to the exchange
     * @param minBuyAmount The minimum amount of buyToken the user has to receive for this
     * transaction to succeed
     * @param sellGold `true` if gold is the sell token
     * @return The amount of buyToken that was transfered
     */
    exchange: (sellAmount: BigNumber.Value, minBuyAmount: BigNumber.Value, sellGold: boolean) => CeloTransactionObject<string>;
    /**
     * Exchanges amount of cGLD in exchange for at least minUsdAmount of cUsd
     * Requires the amount to have been approved to the exchange
     * @param amount The amount of cGLD the user is selling to the exchange
     * @param minUsdAmount The minimum amount of cUsd the user has to receive for this
     * transaction to succeed
     */
    sellGold: (amount: BigNumber.Value, minUSDAmount: BigNumber.Value) => CeloTransactionObject<string>;
    /**
     * Exchanges amount of cUsd in exchange for at least minGoldAmount of cGLD
     * Requires the amount to have been approved to the exchange
     * @param amount The amount of cUsd the user is selling to the exchange
     * @param minGoldAmount The minimum amount of cGLD the user has to receive for this
     * transaction to succeed
     */
    sellDollar: (amount: BigNumber.Value, minGoldAmount: BigNumber.Value) => CeloTransactionObject<string>;
    /**
     * Returns the amount of cGLD a user would get for sellAmount of cUsd
     * @param sellAmount The amount of cUsd the user is selling to the exchange
     * @return The corresponding cGLD amount.
     */
    quoteUsdSell: (sellAmount: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Returns the amount of cUsd a user would get for sellAmount of cGLD
     * @param sellAmount The amount of cGLD the user is selling to the exchange
     * @return The corresponding cUsd amount.
     */
    quoteGoldSell: (sellAmount: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Returns the amount of cGLD a user would need to exchange to receive buyAmount of
     * cUsd.
     * @param buyAmount The amount of cUsd the user would like to purchase.
     * @return The corresponding cGLD amount.
     */
    quoteUsdBuy: (buyAmount: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Returns the amount of cUsd a user would need to exchange to receive buyAmount of
     * cGLD.
     * @param buyAmount The amount of cGLD the user would like to purchase.
     * @return The corresponding cUsd amount.
     */
    quoteGoldBuy: (buyAmount: BigNumber.Value) => Promise<BigNumber>;
    /**
     * @dev Returns the current configuration of the exchange contract
     * @return ExchangeConfig object
     */
    getConfig(): Promise<ExchangeConfig>;
    /**
     * Returns the exchange rate estimated at buyAmount.
     * @param buyAmount The amount of buyToken in wei to estimate the exchange rate at
     * @param sellGold `true` if gold is the sell token
     * @return The exchange rate (number of sellTokens received for one buyToken).
     */
    getExchangeRate(buyAmount: BigNumber.Value, sellGold: boolean): Promise<BigNumber>;
    /**
     * Returns the exchange rate for cUsd estimated at the buyAmount
     * @param buyAmount The amount of cUsd in wei to estimate the exchange rate at
     * @return The exchange rate (number of cGLD received for one cUsd)
     */
    getUsdExchangeRate: (buyAmount: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Returns the exchange rate for cGLD estimated at the buyAmount
     * @param buyAmount The amount of cGLD in wei to estimate the exchange rate at
     * @return The exchange rate (number of cUsd received for one cGLD)
     */
    getGoldExchangeRate: (buyAmount: BigNumber.Value) => Promise<BigNumber>;
}

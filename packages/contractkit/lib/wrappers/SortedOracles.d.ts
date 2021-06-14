import BigNumber from 'bignumber.js';
import { Address, CeloToken } from '../base';
import { SortedOracles } from '../generated/SortedOracles';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export declare enum MedianRelation {
    Undefined = 0,
    Lesser = 1,
    Greater = 2,
    Equal = 3
}
export interface SortedOraclesConfig {
    reportExpirySeconds: BigNumber;
}
export interface OracleRate {
    address: Address;
    rate: BigNumber;
    medianRelation: MedianRelation;
}
export interface OracleTimestamp {
    address: Address;
    timestamp: BigNumber;
    medianRelation: MedianRelation;
}
export interface OracleReport {
    address: Address;
    rate: BigNumber;
    timestamp: BigNumber;
}
export interface MedianRate {
    rate: BigNumber;
}
/**
 * Currency price oracle contract.
 */
export declare class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
    /**
     * Gets the number of rates that have been reported for the given token
     * @param token The CeloToken token for which the Celo Gold exchange rate is being reported.
     * @return The number of reported oracle rates for `token`.
     */
    numRates(token: CeloToken): Promise<number>;
    /**
     * Returns the median rate for the given token
     * @param token The CeloToken token for which the Celo Gold exchange rate is being reported.
     * @return The median exchange rate for `token`, expressed as:
     *   amount of that token / equivalent amount in Celo Gold
     */
    medianRate(token: CeloToken): Promise<MedianRate>;
    /**
     * Checks if the given address is whitelisted as an oracle for the token
     * @param token The CeloToken token
     * @param oracle The address that we're checking the oracle status of
     * @returns boolean describing whether this account is an oracle
     */
    isOracle(token: CeloToken, oracle: Address): Promise<boolean>;
    /**
     * Returns the list of whitelisted oracles for a given token.
     * @returns The list of whitelisted oracles for a given token.
     */
    getOracles(token: CeloToken): Promise<Address[]>;
    /**
     * Returns the report expiry parameter.
     * @returns Current report expiry.
     */
    reportExpirySeconds: () => Promise<BigNumber>;
    /**
     * Checks if the oldest report for a given token is expired
     * @param token The token for which to check reports
     */
    isOldestReportExpired(token: CeloToken): Promise<[boolean, Address]>;
    /**
     * Removes expired reports, if any exist
     * @param token The token to remove reports for
     * @param numReports The upper-limit of reports to remove. For example, if there
     * are 2 expired reports, and this param is 5, it will only remove the 2 that
     * are expired.
     */
    removeExpiredReports(token: CeloToken, numReports?: number): Promise<CeloTransactionObject<void>>;
    /**
     * Updates an oracle value and the median.
     * @param token The token for which the Celo Gold exchange rate is being reported.
     * @param value The amount of `token` equal to one Celo Gold.
     */
    report(token: CeloToken, value: BigNumber.Value, oracleAddress: Address): Promise<CeloTransactionObject<void>>;
    /**
     * Updates an oracle value and the median.
     * @param value The amount of US Dollars equal to one Celo Gold.
     */
    reportStableToken(value: BigNumber.Value, oracleAddress: Address): Promise<CeloTransactionObject<void>>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<SortedOraclesConfig>;
    /**
     * Helper function to get the rates for StableToken, by passing the address
     * of StableToken to `getRates`.
     */
    getStableTokenRates: () => Promise<OracleRate[]>;
    /**
     * Gets all elements from the doubly linked list.
     * @param token The CeloToken representing the token for which the Celo
     *   Gold exchange rate is being reported. Example: CeloContract.StableToken
     * @return An unpacked list of elements from largest to smallest.
     */
    getRates(token: CeloToken): Promise<OracleRate[]>;
    /**
     * Gets all elements from the doubly linked list.
     * @param token The CeloToken representing the token for which the Celo
     *   Gold exchange rate is being reported. Example: CeloContract.StableToken
     * @return An unpacked list of elements from largest to smallest.
     */
    getTimestamps(token: CeloToken): Promise<OracleTimestamp[]>;
    getReports(token: CeloToken): Promise<OracleReport[]>;
    private findLesserAndGreaterKeys;
}

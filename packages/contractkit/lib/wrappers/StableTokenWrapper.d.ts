import BigNumber from 'bignumber.js';
import { StableToken } from '../generated/StableToken';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export interface InflationParameters {
    rate: BigNumber;
    factor: BigNumber;
    updatePeriod: BigNumber;
    factorLastUpdated: BigNumber;
}
export interface StableTokenConfig {
    decimals: number;
    name: string;
    symbol: string;
    inflationParameters: InflationParameters;
}
/**
 * Stable token with variable supply (cUSD)
 */
export declare class StableTokenWrapper extends BaseWrapper<StableToken> {
    /**
     * Gets the amount of owner's StableToken allowed to be spent by spender.
     * @param accountOwner The owner of the StableToken.
     * @param spender The spender of the StableToken.
     * @return The amount of StableToken owner is allowing spender to spend.
     */
    allowance: (accountOwner: string, spender: string) => Promise<BigNumber>;
    /**
     * @return The name of the stable token.
     */
    name: () => Promise<string>;
    /**
     * @return The symbol of the stable token.
     */
    symbol: () => Promise<string>;
    /**
     * @return The number of decimal places to which StableToken is divisible.
     */
    decimals: () => Promise<number>;
    /**
     * Returns the total supply of the token, that is, the amount of tokens currently minted.
     * @returns Total supply.
     */
    totalSupply: () => Promise<BigNumber>;
    /**
     * Gets the balance of the specified address using the presently stored inflation factor.
     * @param owner The address to query the balance of.
     * @return The balance of the specified address.
     */
    balanceOf: (owner: string) => Promise<BigNumber>;
    owner: () => Promise<string>;
    /**
     * Returns the units for a given value given the current inflation factor.
     * @param value The value to convert to units.
     * @return The units corresponding to `value` given the current inflation factor.
     * @dev We don't compute the updated inflationFactor here because
     * we assume any function calling this will have updated the inflation factor.
     */
    valueToUnits: (value: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Returns the value of a given number of units given the current inflation factor.
     * @param units The units to convert to value.
     * @return The value corresponding to `units` given the current inflation factor.
     */
    unitsToValue: (units: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Increases the allowance of another user.
     * @param spender The address which is being approved to spend StableToken.
     * @param value The increment of the amount of StableToken approved to the spender.
     * @returns true if success.
     */
    increaseAllowance: (args_0: string, args_1: BigNumber.Value) => CeloTransactionObject<boolean>;
    /**
     * Decreases the allowance of another user.
     * @param spender The address which is being approved to spend StableToken.
     * @param value The decrement of the amount of StableToken approved to the spender.
     * @returns true if success.
     */
    decreaseAllowance: (spender: string, value: string | number) => CeloTransactionObject<boolean>;
    mint: (to: string, value: string | number) => CeloTransactionObject<boolean>;
    burn: (value: string | number) => CeloTransactionObject<boolean>;
    setInflationParameters: (rate: string | number, updatePeriod: string | number) => CeloTransactionObject<void>;
    /**
     * Querying the inflation parameters.
     * @returns Inflation rate, inflation factor, inflation update period and the last time factor was updated.
     */
    getInflationParameters(): Promise<InflationParameters>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<StableTokenConfig>;
    /**
     * Approve a user to transfer StableToken on behalf of another user.
     * @param spender The address which is being approved to spend StableToken.
     * @param value The amount of StableToken approved to the spender.
     * @return True if the transaction succeeds.
     */
    approve: (spender: string, value: string | number) => CeloTransactionObject<boolean>;
    /**
     * Transfer token for a specified address
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     * @param comment The transfer comment.
     * @return True if the transaction succeeds.
     */
    transferWithComment: (to: string, value: string | number, comment: string) => CeloTransactionObject<boolean>;
    /**
     * Transfers `value` from `msg.sender` to `to`
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    transfer: (to: string, value: string | number) => CeloTransactionObject<boolean>;
    /**
     * Transfers StableToken from one address to another on behalf of a user.
     * @param from The address to transfer StableToken from.
     * @param to The address to transfer StableToken to.
     * @param value The amount of StableToken to transfer.
     * @return True if the transaction succeeds.
     */
    transferFrom: (from: string, to: string, value: string | number) => CeloTransactionObject<boolean>;
}

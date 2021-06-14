import 'bignumber.js';
import { GoldToken } from '../generated/GoldToken';
import { BaseWrapper } from './BaseWrapper';
/**
 * ERC-20 contract for Celo native currency.
 */
export declare class GoldTokenWrapper extends BaseWrapper<GoldToken> {
    /**
     * Querying allowance.
     * @param from Account who has given the allowance.
     * @param to Address of account to whom the allowance was given.
     * @returns Amount of allowance.
     */
    allowance: (owner: string, spender: string) => Promise<import("bignumber.js").default>;
    /**
     * Returns the name of the token.
     * @returns Name of the token.
     */
    name: () => Promise<any>;
    /**
     * Returns the three letter symbol of the token.
     * @returns Symbol of the token.
     */
    symbol: () => Promise<any>;
    /**
     * Returns the number of decimals used in the token.
     * @returns Number of decimals.
     */
    decimals: () => Promise<number>;
    /**
     * Returns the total supply of the token, that is, the amount of tokens currently minted.
     * @returns Total supply.
     */
    totalSupply: () => Promise<import("bignumber.js").default>;
    /**
     * Approve a user to transfer Celo Gold on behalf of another user.
     * @param spender The address which is being approved to spend Celo Gold.
     * @param value The amount of Celo Gold approved to the spender.
     * @return True if the transaction succeeds.
     */
    approve: (spender: string, value: string | number) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Increases the allowance of another user.
     * @param spender The address which is being approved to spend Celo Gold.
     * @param value The increment of the amount of Celo Gold approved to the spender.
     * @returns true if success.
     */
    increaseAllowance: (args_0: string, args_1: import("bignumber.js").default.Value) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Decreases the allowance of another user.
     * @param spender The address which is being approved to spend Celo Gold.
     * @param value The decrement of the amount of Celo Gold approved to the spender.
     * @returns true if success.
     */
    decreaseAllowance: (spender: string, value: string | number) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Transfers Celo Gold from one address to another with a comment.
     * @param to The address to transfer Celo Gold to.
     * @param value The amount of Celo Gold to transfer.
     * @param comment The transfer comment
     * @return True if the transaction succeeds.
     */
    transferWithComment: (to: string, value: string | number, comment: string) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Transfers Celo Gold from one address to another.
     * @param to The address to transfer Celo Gold to.
     * @param value The amount of Celo Gold to transfer.
     * @return True if the transaction succeeds.
     */
    transfer: (to: string, value: string | number) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Transfers Celo Gold from one address to another on behalf of a user.
     * @param from The address to transfer Celo Gold from.
     * @param to The address to transfer Celo Gold to.
     * @param value The amount of Celo Gold to transfer.
     * @return True if the transaction succeeds.
     */
    transferFrom: (from: string, to: string, value: string | number) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Gets the balance of the specified address.
     * @param owner The address to query the balance of.
     * @return The balance of the specified address.
     */
    balanceOf: (account: string) => Promise<import("bignumber.js").default>;
}

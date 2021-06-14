import { AddressListItem } from '@celo/utils/lib/collections';
import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { LockedGold } from '../generated/LockedGold';
import { BaseWrapper, CeloTransactionObject } from '../wrappers/BaseWrapper';
export interface VotingDetails {
    accountAddress: Address;
    voterAddress: Address;
    /** vote's weight */
    weight: BigNumber;
}
interface AccountSummary {
    lockedGold: {
        total: BigNumber;
        nonvoting: BigNumber;
        requirement: BigNumber;
    };
    pendingWithdrawals: PendingWithdrawal[];
}
export interface AccountSlashed {
    slashed: Address;
    penalty: BigNumber;
    reporter: Address;
    reward: BigNumber;
    epochNumber: number;
}
export interface PendingWithdrawal {
    time: BigNumber;
    value: BigNumber;
}
export interface LockedGoldConfig {
    unlockingPeriod: BigNumber;
    totalLockedGold: BigNumber;
}
/**
 * Contract for handling deposits needed for voting.
 */
export declare class LockedGoldWrapper extends BaseWrapper<LockedGold> {
    /**
     * Withdraws a gold that has been unlocked after the unlocking period has passed.
     * @param index The index of the pending withdrawal to withdraw.
     */
    withdraw: (index: number) => CeloTransactionObject<void>;
    /**
     * Locks gold to be used for voting.
     * The gold to be locked, must be specified as the `tx.value`
     */
    lock: () => CeloTransactionObject<void>;
    /**
     * Unlocks gold that becomes withdrawable after the unlocking period.
     * @param value The amount of gold to unlock.
     */
    unlock: (value: BigNumber.Value) => CeloTransactionObject<void>;
    getPendingWithdrawalsTotalValue(account: Address): Promise<BigNumber>;
    /**
     * Relocks gold that has been unlocked but not withdrawn.
     * @param value The value to relock from pending withdrawals.
     */
    relock(account: Address, value: BigNumber.Value): Promise<Array<CeloTransactionObject<void>>>;
    /**
     * Relocks gold that has been unlocked but not withdrawn.
     * @param index The index of the pending withdrawal to relock from.
     * @param value The value to relock from the specified pending withdrawal.
     */
    _relock: (index: number, value: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Returns the total amount of locked gold for an account.
     * @param account The account.
     * @return The total amount of locked gold for an account.
     */
    getAccountTotalLockedGold: (account: string) => Promise<BigNumber>;
    /**
     * Returns the total amount of locked gold in the system. Note that this does not include
     *   gold that has been unlocked but not yet withdrawn.
     * @returns The total amount of locked gold in the system.
     */
    getTotalLockedGold: () => Promise<BigNumber>;
    /**
     * Returns the total amount of non-voting locked gold for an account.
     * @param account The account.
     * @return The total amount of non-voting locked gold for an account.
     */
    getAccountNonvotingLockedGold: (account: string) => Promise<BigNumber>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<LockedGoldConfig>;
    getAccountSummary(account: string): Promise<AccountSummary>;
    /**
     * Returns the pending withdrawals from unlocked gold for an account.
     * @param account The address of the account.
     * @return The value and timestamp for each pending withdrawal.
     */
    getPendingWithdrawals(account: string): Promise<PendingWithdrawal[]>;
    /**
     * Retrieves AccountSlashed for epochNumber.
     * @param epochNumber The epoch to retrieve AccountSlashed at.
     */
    getAccountsSlashed(epochNumber: number): Promise<AccountSlashed[]>;
    /**
     * Computes parameters for slashing `penalty` from `account`.
     * @param account The account to slash.
     * @param penalty The amount to slash as penalty.
     * @return List of (group, voting gold) to decrement from `account`.
     */
    computeInitialParametersForSlashing(account: string, penalty: BigNumber): Promise<{
        indices: number[];
        lessers: string[];
        greaters: string[];
        list: AddressListItem[];
    }>;
    computeParametersForSlashing(account: string, penalty: BigNumber, groups: AddressListItem[]): Promise<{
        indices: number[];
        lessers: string[];
        greaters: string[];
        list: AddressListItem[];
    }>;
    private computeDecrementsForSlashing;
}
export {};

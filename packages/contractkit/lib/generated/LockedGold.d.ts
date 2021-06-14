/// <reference types="node" />
import { EventEmitter } from 'events';
import Web3 from 'web3';
import { EventLog } from 'web3-core';
import { Callback } from 'web3-core-helpers';
import { BlockType, TransactionObject } from 'web3-eth';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
interface EventOptions {
    filter?: object;
    fromBlock?: BlockType;
    topics?: string[];
}
interface ContractEventLog<T> extends EventLog {
    returnValues: T;
}
interface ContractEventEmitter<T> extends EventEmitter {
    on(event: 'connected', listener: (subscriptionId: string) => void): this;
    on(event: 'data' | 'changed', listener: (event: ContractEventLog<T>) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
}
declare type ContractEvent<T> = (options?: EventOptions, cb?: Callback<ContractEventLog<T>>) => ContractEventEmitter<T>;
export interface LockedGold extends Contract {
    clone(): LockedGold;
    methods: {
        initialized(): TransactionObject<boolean>;
        unlockingPeriod(): TransactionObject<string>;
        slashingWhitelist(arg0: number | string): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        totalNonvoting(): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        isSlasher(slasher: string): TransactionObject<boolean>;
        initialize(registryAddress: string, _unlockingPeriod: number | string): TransactionObject<void>;
        setUnlockingPeriod(value: number | string): TransactionObject<void>;
        lock(): TransactionObject<void>;
        incrementNonvotingAccountBalance(account: string, value: number | string): TransactionObject<void>;
        decrementNonvotingAccountBalance(account: string, value: number | string): TransactionObject<void>;
        unlock(value: number | string): TransactionObject<void>;
        relock(index: number | string, value: number | string): TransactionObject<void>;
        withdraw(index: number | string): TransactionObject<void>;
        getTotalLockedGold(): TransactionObject<string>;
        getNonvotingLockedGold(): TransactionObject<string>;
        getAccountTotalLockedGold(account: string): TransactionObject<string>;
        getAccountNonvotingLockedGold(account: string): TransactionObject<string>;
        getPendingWithdrawals(account: string): TransactionObject<{
            0: string[];
            1: string[];
        }>;
        getTotalPendingWithdrawals(account: string): TransactionObject<string>;
        getSlashingWhitelist(): TransactionObject<string[]>;
        addSlasher(slasherIdentifier: string): TransactionObject<void>;
        removeSlasher(slasherIdentifier: string, index: number | string): TransactionObject<void>;
        slash(account: string, penalty: number | string, reporter: string, reward: number | string, lessers: string[], greaters: string[], indices: (number | string)[]): TransactionObject<void>;
    };
    events: {
        UnlockingPeriodSet: ContractEvent<string>;
        GoldLocked: ContractEvent<{
            account: string;
            value: string;
            0: string;
            1: string;
        }>;
        GoldUnlocked: ContractEvent<{
            account: string;
            value: string;
            available: string;
            0: string;
            1: string;
            2: string;
        }>;
        GoldRelocked: ContractEvent<{
            account: string;
            value: string;
            0: string;
            1: string;
        }>;
        GoldWithdrawn: ContractEvent<{
            account: string;
            value: string;
            0: string;
            1: string;
        }>;
        SlasherWhitelistAdded: ContractEvent<string>;
        SlasherWhitelistRemoved: ContractEvent<string>;
        AccountSlashed: ContractEvent<{
            slashed: string;
            penalty: string;
            reporter: string;
            reward: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        RegistrySet: ContractEvent<string>;
        OwnershipTransferred: ContractEvent<{
            previousOwner: string;
            newOwner: string;
            0: string;
            1: string;
        }>;
        allEvents: (options?: EventOptions, cb?: Callback<EventLog>) => EventEmitter;
    };
}
export declare const ABI: AbiItem[];
export declare function newLockedGold(web3: Web3, address: string): LockedGold;
export {};

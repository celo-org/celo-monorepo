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
export interface Exchange extends Contract {
    clone(): Exchange;
    methods: {
        initialized(): TransactionObject<boolean>;
        minimumReports(): TransactionObject<string>;
        stable(): TransactionObject<string>;
        stableBucket(): TransactionObject<string>;
        spread(): TransactionObject<string>;
        goldBucket(): TransactionObject<string>;
        updateFrequency(): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        reserveFraction(): TransactionObject<string>;
        lastBucketUpdate(): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(registryAddress: string, stableToken: string, _spread: number | string, _reserveFraction: number | string, _updateFrequency: number | string, _minimumReports: number | string): TransactionObject<void>;
        exchange(sellAmount: number | string, minBuyAmount: number | string, sellGold: boolean): TransactionObject<string>;
        getBuyTokenAmount(sellAmount: number | string, sellGold: boolean): TransactionObject<string>;
        getSellTokenAmount(buyAmount: number | string, sellGold: boolean): TransactionObject<string>;
        getBuyAndSellBuckets(sellGold: boolean): TransactionObject<{
            0: string;
            1: string;
        }>;
        setUpdateFrequency(newUpdateFrequency: number | string): TransactionObject<void>;
        setMinimumReports(newMininumReports: number | string): TransactionObject<void>;
        setStableToken(newStableToken: string): TransactionObject<void>;
        setSpread(newSpread: number | string): TransactionObject<void>;
        setReserveFraction(newReserveFraction: number | string): TransactionObject<void>;
    };
    events: {
        Exchanged: ContractEvent<{
            exchanger: string;
            sellAmount: string;
            buyAmount: string;
            soldGold: boolean;
            0: string;
            1: string;
            2: string;
            3: boolean;
        }>;
        UpdateFrequencySet: ContractEvent<string>;
        MinimumReportsSet: ContractEvent<string>;
        StableTokenSet: ContractEvent<string>;
        SpreadSet: ContractEvent<string>;
        ReserveFractionSet: ContractEvent<string>;
        BucketsUpdated: ContractEvent<{
            goldBucket: string;
            stableBucket: string;
            0: string;
            1: string;
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
export declare function newExchange(web3: Web3, address: string): Exchange;
export {};

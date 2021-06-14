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
export interface SortedOracles extends Contract {
    clone(): SortedOracles;
    methods: {
        initialized(): TransactionObject<boolean>;
        isOracle(arg0: string, arg1: string): TransactionObject<boolean>;
        reportExpirySeconds(): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        oracles(arg0: string, arg1: number | string): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(_reportExpirySeconds: number | string): TransactionObject<void>;
        setReportExpiry(_reportExpirySeconds: number | string): TransactionObject<void>;
        addOracle(token: string, oracleAddress: string): TransactionObject<void>;
        removeOracle(token: string, oracleAddress: string, index: number | string): TransactionObject<void>;
        removeExpiredReports(token: string, n: number | string): TransactionObject<void>;
        isOldestReportExpired(token: string): TransactionObject<{
            0: boolean;
            1: string;
        }>;
        report(token: string, value: number | string, lesserKey: string, greaterKey: string): TransactionObject<void>;
        numRates(token: string): TransactionObject<string>;
        medianRate(token: string): TransactionObject<{
            0: string;
            1: string;
        }>;
        getRates(token: string): TransactionObject<{
            0: string[];
            1: string[];
            2: string[];
        }>;
        numTimestamps(token: string): TransactionObject<string>;
        medianTimestamp(token: string): TransactionObject<string>;
        getTimestamps(token: string): TransactionObject<{
            0: string[];
            1: string[];
            2: string[];
        }>;
        getOracles(token: string): TransactionObject<string[]>;
    };
    events: {
        OracleAdded: ContractEvent<{
            token: string;
            oracleAddress: string;
            0: string;
            1: string;
        }>;
        OracleRemoved: ContractEvent<{
            token: string;
            oracleAddress: string;
            0: string;
            1: string;
        }>;
        OracleReported: ContractEvent<{
            token: string;
            oracle: string;
            timestamp: string;
            value: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        OracleReportRemoved: ContractEvent<{
            token: string;
            oracle: string;
            0: string;
            1: string;
        }>;
        MedianUpdated: ContractEvent<{
            token: string;
            value: string;
            0: string;
            1: string;
        }>;
        ReportExpirySet: ContractEvent<string>;
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
export declare function newSortedOracles(web3: Web3, address: string): SortedOracles;
export {};

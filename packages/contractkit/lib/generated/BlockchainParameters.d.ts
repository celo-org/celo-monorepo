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
export interface BlockchainParameters extends Contract {
    clone(): BlockchainParameters;
    methods: {
        initialized(): TransactionObject<boolean>;
        renounceOwnership(): TransactionObject<void>;
        blockGasLimit(): TransactionObject<string>;
        intrinsicGasForAlternativeFeeCurrency(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(major: number | string, minor: number | string, patch: number | string, _gasForNonGoldCurrencies: number | string, gasLimit: number | string): TransactionObject<void>;
        setMinimumClientVersion(major: number | string, minor: number | string, patch: number | string): TransactionObject<void>;
        setBlockGasLimit(gasLimit: number | string): TransactionObject<void>;
        setIntrinsicGasForAlternativeFeeCurrency(gas: number | string): TransactionObject<void>;
        getMinimumClientVersion(): TransactionObject<{
            major: string;
            minor: string;
            patch: string;
            0: string;
            1: string;
            2: string;
        }>;
    };
    events: {
        MinimumClientVersionSet: ContractEvent<{
            major: string;
            minor: string;
            patch: string;
            0: string;
            1: string;
            2: string;
        }>;
        IntrinsicGasForAlternativeFeeCurrencySet: ContractEvent<string>;
        BlockGasLimitSet: ContractEvent<string>;
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
export declare function newBlockchainParameters(web3: Web3, address: string): BlockchainParameters;
export {};

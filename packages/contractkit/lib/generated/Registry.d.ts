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
export interface Registry extends Contract {
    clone(): Registry;
    methods: {
        initialized(): TransactionObject<boolean>;
        renounceOwnership(): TransactionObject<void>;
        registry(arg0: string | number[]): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(): TransactionObject<void>;
        setAddressFor(identifier: string, addr: string): TransactionObject<void>;
        getAddressForOrDie(identifierHash: string | number[]): TransactionObject<string>;
        getAddressFor(identifierHash: string | number[]): TransactionObject<string>;
        getAddressForStringOrDie(identifier: string): TransactionObject<string>;
        getAddressForString(identifier: string): TransactionObject<string>;
        isOneOf(identifierHashes: (string | number[])[], sender: string): TransactionObject<boolean>;
    };
    events: {
        RegistryUpdated: ContractEvent<{
            identifier: string;
            identifierHash: string;
            addr: string;
            0: string;
            1: string;
            2: string;
        }>;
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
export declare function newRegistry(web3: Web3, address: string): Registry;
export {};

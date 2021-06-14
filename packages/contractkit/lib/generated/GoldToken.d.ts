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
export interface GoldToken extends Contract {
    clone(): GoldToken;
    methods: {
        initialized(): TransactionObject<boolean>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(registryAddress: string): TransactionObject<void>;
        transfer(to: string, value: number | string): TransactionObject<boolean>;
        transferWithComment(to: string, value: number | string, comment: string): TransactionObject<boolean>;
        approve(spender: string, value: number | string): TransactionObject<boolean>;
        increaseAllowance(spender: string, value: number | string): TransactionObject<boolean>;
        decreaseAllowance(spender: string, value: number | string): TransactionObject<boolean>;
        transferFrom(from: string, to: string, value: number | string): TransactionObject<boolean>;
        mint(to: string, value: number | string): TransactionObject<boolean>;
        name(): TransactionObject<string>;
        symbol(): TransactionObject<string>;
        decimals(): TransactionObject<string>;
        totalSupply(): TransactionObject<string>;
        allowance(owner: string, spender: string): TransactionObject<string>;
        increaseSupply(amount: number | string): TransactionObject<void>;
        balanceOf(owner: string): TransactionObject<string>;
    };
    events: {
        Transfer: ContractEvent<{
            from: string;
            to: string;
            value: string;
            0: string;
            1: string;
            2: string;
        }>;
        TransferComment: ContractEvent<string>;
        Approval: ContractEvent<{
            owner: string;
            spender: string;
            value: string;
            0: string;
            1: string;
            2: string;
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
export declare function newGoldToken(web3: Web3, address: string): GoldToken;
export {};

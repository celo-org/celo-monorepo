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
export interface Escrow extends Contract {
    clone(): Escrow;
    methods: {
        initialized(): TransactionObject<boolean>;
        escrowedPayments(arg0: string): TransactionObject<{
            recipientIdentifier: string;
            sender: string;
            token: string;
            value: string;
            sentIndex: string;
            receivedIndex: string;
            timestamp: string;
            expirySeconds: string;
            minAttestations: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
        }>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        receivedPaymentIds(arg0: string | number[], arg1: number | string): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        sentPaymentIds(arg0: string, arg1: number | string): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(registryAddress: string): TransactionObject<void>;
        transfer(identifier: string | number[], token: string, value: number | string, expirySeconds: number | string, paymentId: string, minAttestations: number | string): TransactionObject<boolean>;
        withdraw(paymentId: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<boolean>;
        revoke(paymentId: string): TransactionObject<boolean>;
        getReceivedPaymentIds(identifier: string | number[]): TransactionObject<string[]>;
        getSentPaymentIds(sender: string): TransactionObject<string[]>;
    };
    events: {
        Transfer: ContractEvent<{
            from: string;
            identifier: string;
            token: string;
            value: string;
            paymentId: string;
            minAttestations: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
        }>;
        Withdrawal: ContractEvent<{
            identifier: string;
            to: string;
            token: string;
            value: string;
            paymentId: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        }>;
        Revocation: ContractEvent<{
            identifier: string;
            by: string;
            token: string;
            value: string;
            paymentId: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
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
export declare function newEscrow(web3: Web3, address: string): Escrow;
export {};

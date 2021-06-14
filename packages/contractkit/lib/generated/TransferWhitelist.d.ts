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
export interface TransferWhitelist extends Contract {
    clone(): TransferWhitelist;
    methods: {
        whitelistedContractIdentifiers(arg0: number | string): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        whitelistAddress(newAddress: string): TransactionObject<void>;
        removeAddress(removedAddress: string, index: number | string): TransactionObject<void>;
        whitelistRegisteredContract(contractIdentifier: string | number[]): TransactionObject<void>;
        getNumberOfWhitelistedContractIdentifiers(): TransactionObject<string>;
        setDirectlyWhitelistedAddresses(_whitelist: string[]): TransactionObject<void>;
        setWhitelistedContractIdentifiers(_registeredContracts: (string | number[])[]): TransactionObject<void>;
        getWhitelist(): TransactionObject<string[]>;
        selfDestruct(): TransactionObject<void>;
    };
    events: {
        WhitelistedAddress: ContractEvent<string>;
        WhitelistedAddressRemoved: ContractEvent<string>;
        WhitelistedContractIdentifier: ContractEvent<string>;
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
export declare function newTransferWhitelist(web3: Web3, address: string): TransferWhitelist;
export {};

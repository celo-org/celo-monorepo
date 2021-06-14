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
export interface Accounts extends Contract {
    clone(): Accounts;
    methods: {
        initialized(): TransactionObject<boolean>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        authorizedBy(arg0: string): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(registryAddress: string): TransactionObject<void>;
        setAccount(name: string, dataEncryptionKey: string | number[], walletAddress: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        createAccount(): TransactionObject<boolean>;
        setName(name: string): TransactionObject<void>;
        setWalletAddress(walletAddress: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        setAccountDataEncryptionKey(dataEncryptionKey: string | number[]): TransactionObject<void>;
        setMetadataURL(metadataURL: string): TransactionObject<void>;
        authorizeVoteSigner(signer: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        authorizeValidatorSigner(signer: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        authorizeValidatorSignerWithPublicKey(signer: string, v: number | string, r: string | number[], s: string | number[], ecdsaPublicKey: string | number[]): TransactionObject<void>;
        authorizeValidatorSignerWithKeys(signer: string, v: number | string, r: string | number[], s: string | number[], ecdsaPublicKey: string | number[], blsPublicKey: string | number[], blsPop: string | number[]): TransactionObject<void>;
        authorizeAttestationSigner(signer: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        removeVoteSigner(): TransactionObject<void>;
        removeValidatorSigner(): TransactionObject<void>;
        removeAttestationSigner(): TransactionObject<void>;
        attestationSignerToAccount(signer: string): TransactionObject<string>;
        validatorSignerToAccount(signer: string): TransactionObject<string>;
        voteSignerToAccount(signer: string): TransactionObject<string>;
        signerToAccount(signer: string): TransactionObject<string>;
        getVoteSigner(account: string): TransactionObject<string>;
        getValidatorSigner(account: string): TransactionObject<string>;
        getAttestationSigner(account: string): TransactionObject<string>;
        hasAuthorizedVoteSigner(account: string): TransactionObject<boolean>;
        hasAuthorizedValidatorSigner(account: string): TransactionObject<boolean>;
        hasAuthorizedAttestationSigner(account: string): TransactionObject<boolean>;
        getName(account: string): TransactionObject<string>;
        getMetadataURL(account: string): TransactionObject<string>;
        batchGetMetadataURL(accountsToQuery: string[]): TransactionObject<{
            0: string[];
            1: string;
        }>;
        getDataEncryptionKey(account: string): TransactionObject<string>;
        getWalletAddress(account: string): TransactionObject<string>;
        isAccount(account: string): TransactionObject<boolean>;
        isAuthorizedSigner(signer: string): TransactionObject<boolean>;
    };
    events: {
        AttestationSignerAuthorized: ContractEvent<{
            account: string;
            signer: string;
            0: string;
            1: string;
        }>;
        VoteSignerAuthorized: ContractEvent<{
            account: string;
            signer: string;
            0: string;
            1: string;
        }>;
        ValidatorSignerAuthorized: ContractEvent<{
            account: string;
            signer: string;
            0: string;
            1: string;
        }>;
        AttestationSignerRemoved: ContractEvent<{
            account: string;
            oldSigner: string;
            0: string;
            1: string;
        }>;
        VoteSignerRemoved: ContractEvent<{
            account: string;
            oldSigner: string;
            0: string;
            1: string;
        }>;
        ValidatorSignerRemoved: ContractEvent<{
            account: string;
            oldSigner: string;
            0: string;
            1: string;
        }>;
        AccountDataEncryptionKeySet: ContractEvent<{
            account: string;
            dataEncryptionKey: string;
            0: string;
            1: string;
        }>;
        AccountNameSet: ContractEvent<{
            account: string;
            name: string;
            0: string;
            1: string;
        }>;
        AccountMetadataURLSet: ContractEvent<{
            account: string;
            metadataURL: string;
            0: string;
            1: string;
        }>;
        AccountWalletAddressSet: ContractEvent<{
            account: string;
            walletAddress: string;
            0: string;
            1: string;
        }>;
        AccountCreated: ContractEvent<string>;
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
export declare function newAccounts(web3: Web3, address: string): Accounts;
export {};

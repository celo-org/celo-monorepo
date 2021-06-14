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
export interface Attestations extends Contract {
    clone(): Attestations;
    methods: {
        validatorSignerAddressFromCurrentSet(index: number | string): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        checkProofOfPossession(sender: string, blsKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        getEpochNumberOfBlock(blockNumber: number | string): TransactionObject<string>;
        getVerifiedSealBitmapFromHeader(header: string | number[]): TransactionObject<string>;
        validatorSignerAddressFromSet(index: number | string, blockNumber: number | string): TransactionObject<string>;
        hashHeader(header: string | number[]): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        minQuorumSizeInCurrentSet(): TransactionObject<string>;
        registry(): TransactionObject<string>;
        maxAttestations(): TransactionObject<string>;
        numberValidatorsInCurrentSet(): TransactionObject<string>;
        selectIssuersWaitBlocks(): TransactionObject<string>;
        getBlockNumberFromHeader(header: string | number[]): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        getEpochNumber(): TransactionObject<string>;
        numberValidatorsInSet(blockNumber: number | string): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        attestationExpiryBlocks(): TransactionObject<string>;
        attestationRequestFees(arg0: string): TransactionObject<string>;
        getEpochSize(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        pendingWithdrawals(arg0: string, arg1: string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(registryAddress: string, _attestationExpiryBlocks: number | string, _selectIssuersWaitBlocks: number | string, _maxAttestations: number | string, attestationRequestFeeTokens: string[], attestationRequestFeeValues: (number | string)[]): TransactionObject<void>;
        request(identifier: string | number[], attestationsRequested: number | string, attestationRequestFeeToken: string): TransactionObject<void>;
        selectIssuers(identifier: string | number[]): TransactionObject<void>;
        complete(identifier: string | number[], v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        revoke(identifier: string | number[], index: number | string): TransactionObject<void>;
        withdraw(token: string): TransactionObject<void>;
        getUnselectedRequest(identifier: string | number[], account: string): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        getAttestationIssuers(identifier: string | number[], account: string): TransactionObject<string[]>;
        getAttestationStats(identifier: string | number[], account: string): TransactionObject<{
            0: string;
            1: string;
        }>;
        batchGetAttestationStats(identifiersToLookup: (string | number[])[]): TransactionObject<{
            0: string[];
            1: string[];
            2: string[];
            3: string[];
        }>;
        getAttestationState(identifier: string | number[], account: string, issuer: string): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        getCompletableAttestations(identifier: string | number[], account: string): TransactionObject<{
            0: string[];
            1: string[];
            2: string[];
            3: string;
        }>;
        getAttestationRequestFee(token: string): TransactionObject<string>;
        setAttestationRequestFee(token: string, fee: number | string): TransactionObject<void>;
        setAttestationExpiryBlocks(_attestationExpiryBlocks: number | string): TransactionObject<void>;
        setSelectIssuersWaitBlocks(_selectIssuersWaitBlocks: number | string): TransactionObject<void>;
        setMaxAttestations(_maxAttestations: number | string): TransactionObject<void>;
        getMaxAttestations(): TransactionObject<string>;
        validateAttestationCode(identifier: string | number[], account: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<string>;
        lookupAccountsForIdentifier(identifier: string | number[]): TransactionObject<string[]>;
    };
    events: {
        AttestationsRequested: ContractEvent<{
            identifier: string;
            account: string;
            attestationsRequested: string;
            attestationRequestFeeToken: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        AttestationIssuerSelected: ContractEvent<{
            identifier: string;
            account: string;
            issuer: string;
            attestationRequestFeeToken: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        AttestationCompleted: ContractEvent<{
            identifier: string;
            account: string;
            issuer: string;
            0: string;
            1: string;
            2: string;
        }>;
        Withdrawal: ContractEvent<{
            account: string;
            token: string;
            amount: string;
            0: string;
            1: string;
            2: string;
        }>;
        AttestationExpiryBlocksSet: ContractEvent<string>;
        AttestationRequestFeeSet: ContractEvent<{
            token: string;
            value: string;
            0: string;
            1: string;
        }>;
        SelectIssuersWaitBlocksSet: ContractEvent<string>;
        MaxAttestationsSet: ContractEvent<string>;
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
export declare function newAttestations(web3: Web3, address: string): Attestations;
export {};

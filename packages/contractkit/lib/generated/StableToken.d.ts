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
export interface StableToken extends Contract {
    clone(): StableToken;
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
        numberValidatorsInCurrentSet(): TransactionObject<string>;
        getBlockNumberFromHeader(header: string | number[]): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        getEpochNumber(): TransactionObject<string>;
        numberValidatorsInSet(blockNumber: number | string): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        getEpochSize(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(_name: string, _symbol: string, _decimals: number | string, registryAddress: string, inflationRate: number | string, inflationFactorUpdatePeriod: number | string, initialBalanceAddresses: string[], initialBalanceValues: (number | string)[]): TransactionObject<void>;
        setInflationParameters(rate: number | string, updatePeriod: number | string): TransactionObject<void>;
        increaseAllowance(spender: string, value: number | string): TransactionObject<boolean>;
        decreaseAllowance(spender: string, value: number | string): TransactionObject<boolean>;
        approve(spender: string, value: number | string): TransactionObject<boolean>;
        mint(to: string, value: number | string): TransactionObject<boolean>;
        transferWithComment(to: string, value: number | string, comment: string): TransactionObject<boolean>;
        burn(value: number | string): TransactionObject<boolean>;
        transferFrom(from: string, to: string, value: number | string): TransactionObject<boolean>;
        name(): TransactionObject<string>;
        symbol(): TransactionObject<string>;
        decimals(): TransactionObject<string>;
        allowance(accountOwner: string, spender: string): TransactionObject<string>;
        balanceOf(accountOwner: string): TransactionObject<string>;
        totalSupply(): TransactionObject<string>;
        getInflationParameters(): TransactionObject<{
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        valueToUnits(value: number | string): TransactionObject<string>;
        unitsToValue(units: number | string): TransactionObject<string>;
        transfer(to: string, value: number | string): TransactionObject<boolean>;
        debitGasFees(from: string, value: number | string): TransactionObject<void>;
        creditGasFees(from: string, feeRecipient: string, gatewayFeeRecipient: string, communityFund: string, refund: number | string, tipTxFee: number | string, gatewayFee: number | string, baseTxFee: number | string): TransactionObject<void>;
    };
    events: {
        InflationFactorUpdated: ContractEvent<{
            factor: string;
            lastUpdated: string;
            0: string;
            1: string;
        }>;
        InflationParametersUpdated: ContractEvent<{
            rate: string;
            updatePeriod: string;
            lastUpdated: string;
            0: string;
            1: string;
            2: string;
        }>;
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
export declare function newStableToken(web3: Web3, address: string): StableToken;
export {};

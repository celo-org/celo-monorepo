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
export interface GasPriceMinimum extends Contract {
    clone(): GasPriceMinimum;
    methods: {
        initialized(): TransactionObject<boolean>;
        gasPriceMinimum(): TransactionObject<string>;
        targetDensity(): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        adjustmentSpeed(): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        gasPriceMinimumFloor(): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        initialize(_registryAddress: string, _gasPriceMinimumFloor: number | string, _targetDensity: number | string, _adjustmentSpeed: number | string): TransactionObject<void>;
        setAdjustmentSpeed(_adjustmentSpeed: number | string): TransactionObject<void>;
        setTargetDensity(_targetDensity: number | string): TransactionObject<void>;
        setGasPriceMinimumFloor(_gasPriceMinimumFloor: number | string): TransactionObject<void>;
        getGasPriceMinimum(tokenAddress: string): TransactionObject<string>;
        updateGasPriceMinimum(blockGasTotal: number | string, blockGasLimit: number | string): TransactionObject<string>;
        getUpdatedGasPriceMinimum(blockGasTotal: number | string, blockGasLimit: number | string): TransactionObject<string>;
    };
    events: {
        TargetDensitySet: ContractEvent<string>;
        GasPriceMinimumFloorSet: ContractEvent<string>;
        AdjustmentSpeedSet: ContractEvent<string>;
        GasPriceMinimumUpdated: ContractEvent<string>;
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
export declare function newGasPriceMinimum(web3: Web3, address: string): GasPriceMinimum;
export {};

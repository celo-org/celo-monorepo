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
export interface Reserve extends Contract {
    clone(): Reserve;
    methods: {
        frozenReserveGoldStartBalance(): TransactionObject<string>;
        assetAllocationSymbols(arg0: number | string): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        isToken(arg0: string): TransactionObject<boolean>;
        tobinTaxCache(): TransactionObject<{
            numerator: string;
            timestamp: string;
            0: string;
            1: string;
        }>;
        spendingLimit(): TransactionObject<string>;
        otherReserveAddresses(arg0: number | string): TransactionObject<string>;
        frozenReserveGoldDays(): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        tobinTaxReserveRatio(): TransactionObject<string>;
        registry(): TransactionObject<string>;
        isOtherReserveAddress(arg0: string): TransactionObject<boolean>;
        frozenReserveGoldStartDay(): TransactionObject<string>;
        tobinTax(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        isSpender(arg0: string): TransactionObject<boolean>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        tobinTaxStalenessThreshold(): TransactionObject<string>;
        assetAllocationWeights(arg0: string | number[]): TransactionObject<string>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        lastSpendingDay(): TransactionObject<string>;
        initialize(registryAddress: string, _tobinTaxStalenessThreshold: number | string, _spendingRatio: number | string, _frozenGold: number | string, _frozenDays: number | string, _assetAllocationSymbols: (string | number[])[], _assetAllocationWeights: (number | string)[], _tobinTax: number | string, _tobinTaxReserveRatio: number | string): TransactionObject<void>;
        setTobinTaxStalenessThreshold(value: number | string): TransactionObject<void>;
        setTobinTax(value: number | string): TransactionObject<void>;
        setTobinTaxReserveRatio(value: number | string): TransactionObject<void>;
        setDailySpendingRatio(ratio: number | string): TransactionObject<void>;
        getDailySpendingRatio(): TransactionObject<string>;
        setFrozenGold(frozenGold: number | string, frozenDays: number | string): TransactionObject<void>;
        setAssetAllocations(symbols: (string | number[])[], weights: (number | string)[]): TransactionObject<void>;
        addToken(token: string): TransactionObject<boolean>;
        removeToken(token: string, index: number | string): TransactionObject<boolean>;
        addOtherReserveAddress(reserveAddress: string): TransactionObject<boolean>;
        removeOtherReserveAddress(reserveAddress: string, index: number | string): TransactionObject<boolean>;
        addSpender(spender: string): TransactionObject<void>;
        removeSpender(spender: string): TransactionObject<void>;
        transferGold(to: string, value: number | string): TransactionObject<boolean>;
        transferExchangeGold(to: string, value: number | string): TransactionObject<boolean>;
        getOrComputeTobinTax(): TransactionObject<{
            0: string;
            1: string;
        }>;
        getTokens(): TransactionObject<string[]>;
        getOtherReserveAddresses(): TransactionObject<string[]>;
        getAssetAllocationSymbols(): TransactionObject<string[]>;
        getAssetAllocationWeights(): TransactionObject<string[]>;
        getUnfrozenBalance(): TransactionObject<string>;
        getReserveGoldBalance(): TransactionObject<string>;
        getOtherReserveAddressesGoldBalance(): TransactionObject<string>;
        getUnfrozenReserveGoldBalance(): TransactionObject<string>;
        getFrozenReserveGoldBalance(): TransactionObject<string>;
        getReserveRatio(): TransactionObject<string>;
    };
    events: {
        TobinTaxStalenessThresholdSet: ContractEvent<string>;
        DailySpendingRatioSet: ContractEvent<string>;
        TokenAdded: ContractEvent<string>;
        TokenRemoved: ContractEvent<{
            token: string;
            index: string;
            0: string;
            1: string;
        }>;
        SpenderAdded: ContractEvent<string>;
        SpenderRemoved: ContractEvent<string>;
        OtherReserveAddressAdded: ContractEvent<string>;
        OtherReserveAddressRemoved: ContractEvent<{
            otherReserveAddress: string;
            index: string;
            0: string;
            1: string;
        }>;
        AssetAllocationSet: ContractEvent<{
            symbols: string[];
            weights: string[];
            0: string[];
            1: string[];
        }>;
        ReserveGoldTransferred: ContractEvent<{
            spender: string;
            to: string;
            value: string;
            0: string;
            1: string;
            2: string;
        }>;
        TobinTaxSet: ContractEvent<string>;
        TobinTaxReserveRatioSet: ContractEvent<string>;
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
export declare function newReserve(web3: Web3, address: string): Reserve;
export {};

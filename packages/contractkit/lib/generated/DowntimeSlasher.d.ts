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
export interface DowntimeSlasher extends Contract {
    clone(): DowntimeSlasher;
    methods: {
        slashingIncentives(): TransactionObject<{
            penalty: string;
            reward: string;
            0: string;
            1: string;
        }>;
        validatorSignerAddressFromCurrentSet(index: number | string): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        checkProofOfPossession(sender: string, blsKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        getEpochNumberOfBlock(blockNumber: number | string): TransactionObject<string>;
        slashableDowntime(): TransactionObject<string>;
        getVerifiedSealBitmapFromHeader(header: string | number[]): TransactionObject<string>;
        validatorSignerAddressFromSet(index: number | string, blockNumber: number | string): TransactionObject<string>;
        hashHeader(header: string | number[]): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        minQuorumSizeInCurrentSet(): TransactionObject<string>;
        registry(): TransactionObject<string>;
        numberValidatorsInCurrentSet(): TransactionObject<string>;
        groupMembershipAtBlock(validator: string, blockNumber: number | string, groupMembershipHistoryIndex: number | string): TransactionObject<string>;
        getBlockNumberFromHeader(header: string | number[]): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        getEpochNumber(): TransactionObject<string>;
        numberValidatorsInSet(blockNumber: number | string): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        setSlashingIncentives(penalty: number | string, reward: number | string): TransactionObject<void>;
        getEpochSize(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(registryAddress: string, _penalty: number | string, _reward: number | string, _slashableDowntime: number | string): TransactionObject<void>;
        setSlashableDowntime(interval: number | string): TransactionObject<void>;
        isDown(startBlock: number | string, startSignerIndex: number | string, endSignerIndex: number | string): TransactionObject<boolean>;
        slash(startBlock: number | string, startSignerIndex: number | string, endSignerIndex: number | string, groupMembershipHistoryIndex: number | string, validatorElectionLessers: string[], validatorElectionGreaters: string[], validatorElectionIndices: (number | string)[], groupElectionLessers: string[], groupElectionGreaters: string[], groupElectionIndices: (number | string)[]): TransactionObject<void>;
    };
    events: {
        SlashableDowntimeSet: ContractEvent<string>;
        DowntimeSlashPerformed: ContractEvent<{
            validator: string;
            startBlock: string;
            0: string;
            1: string;
        }>;
        SlashingIncentivesSet: ContractEvent<{
            penalty: string;
            reward: string;
            0: string;
            1: string;
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
export declare function newDowntimeSlasher(web3: Web3, address: string): DowntimeSlasher;
export {};

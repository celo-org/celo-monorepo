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
export interface Election extends Contract {
    clone(): Election;
    methods: {
        validatorSignerAddressFromCurrentSet(index: number | string): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        checkProofOfPossession(sender: string, blsKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        getEpochNumberOfBlock(blockNumber: number | string): TransactionObject<string>;
        getVerifiedSealBitmapFromHeader(header: string | number[]): TransactionObject<string>;
        electabilityThreshold(): TransactionObject<string>;
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
        maxNumGroupsVotedFor(): TransactionObject<string>;
        getEpochSize(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        electableValidators(): TransactionObject<{
            min: string;
            max: string;
            0: string;
            1: string;
        }>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(registryAddress: string, minElectableValidators: number | string, maxElectableValidators: number | string, _maxNumGroupsVotedFor: number | string, _electabilityThreshold: number | string): TransactionObject<void>;
        setElectableValidators(min: number | string, max: number | string): TransactionObject<boolean>;
        getElectableValidators(): TransactionObject<{
            0: string;
            1: string;
        }>;
        setMaxNumGroupsVotedFor(_maxNumGroupsVotedFor: number | string): TransactionObject<boolean>;
        setElectabilityThreshold(threshold: number | string): TransactionObject<boolean>;
        getElectabilityThreshold(): TransactionObject<string>;
        vote(group: string, value: number | string, lesser: string, greater: string): TransactionObject<boolean>;
        activate(group: string): TransactionObject<boolean>;
        hasActivatablePendingVotes(account: string, group: string): TransactionObject<boolean>;
        revokePending(group: string, value: number | string, lesser: string, greater: string, index: number | string): TransactionObject<boolean>;
        revokeAllActive(group: string, lesser: string, greater: string, index: number | string): TransactionObject<boolean>;
        revokeActive(group: string, value: number | string, lesser: string, greater: string, index: number | string): TransactionObject<boolean>;
        getTotalVotesByAccount(account: string): TransactionObject<string>;
        getPendingVotesForGroupByAccount(group: string, account: string): TransactionObject<string>;
        getActiveVotesForGroupByAccount(group: string, account: string): TransactionObject<string>;
        getTotalVotesForGroupByAccount(group: string, account: string): TransactionObject<string>;
        getActiveVoteUnitsForGroupByAccount(group: string, account: string): TransactionObject<string>;
        getActiveVoteUnitsForGroup(group: string): TransactionObject<string>;
        getTotalVotesForGroup(group: string): TransactionObject<string>;
        getActiveVotesForGroup(group: string): TransactionObject<string>;
        getPendingVotesForGroup(group: string): TransactionObject<string>;
        getGroupEligibility(group: string): TransactionObject<boolean>;
        getGroupEpochRewards(group: string, totalEpochRewards: number | string, uptimes: (number | string)[]): TransactionObject<string>;
        distributeEpochRewards(group: string, value: number | string, lesser: string, greater: string): TransactionObject<void>;
        markGroupIneligible(group: string): TransactionObject<void>;
        markGroupEligible(group: string, lesser: string, greater: string): TransactionObject<void>;
        getGroupsVotedForByAccount(account: string): TransactionObject<string[]>;
        canReceiveVotes(group: string, value: number | string): TransactionObject<boolean>;
        getNumVotesReceivable(group: string): TransactionObject<string>;
        getTotalVotes(): TransactionObject<string>;
        getActiveVotes(): TransactionObject<string>;
        getEligibleValidatorGroups(): TransactionObject<string[]>;
        getTotalVotesForEligibleValidatorGroups(): TransactionObject<{
            groups: string[];
            values: string[];
            0: string[];
            1: string[];
        }>;
        electValidatorSigners(): TransactionObject<string[]>;
        electNValidatorSigners(minElectableValidators: number | string, maxElectableValidators: number | string): TransactionObject<string[]>;
        getCurrentValidatorSigners(): TransactionObject<string[]>;
        forceDecrementVotes(account: string, value: number | string, lessers: string[], greaters: string[], indices: (number | string)[]): TransactionObject<string>;
    };
    events: {
        ElectableValidatorsSet: ContractEvent<{
            min: string;
            max: string;
            0: string;
            1: string;
        }>;
        MaxNumGroupsVotedForSet: ContractEvent<string>;
        ElectabilityThresholdSet: ContractEvent<string>;
        ValidatorGroupMarkedEligible: ContractEvent<string>;
        ValidatorGroupMarkedIneligible: ContractEvent<string>;
        ValidatorGroupVoteCast: ContractEvent<{
            account: string;
            group: string;
            value: string;
            0: string;
            1: string;
            2: string;
        }>;
        ValidatorGroupVoteActivated: ContractEvent<{
            account: string;
            group: string;
            value: string;
            units: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        ValidatorGroupPendingVoteRevoked: ContractEvent<{
            account: string;
            group: string;
            value: string;
            0: string;
            1: string;
            2: string;
        }>;
        ValidatorGroupActiveVoteRevoked: ContractEvent<{
            account: string;
            group: string;
            value: string;
            units: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        EpochRewardsDistributedToVoters: ContractEvent<{
            group: string;
            value: string;
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
export declare function newElection(web3: Web3, address: string): Election;
export {};

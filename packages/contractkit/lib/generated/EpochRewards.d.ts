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
export interface EpochRewards extends Contract {
    clone(): EpochRewards;
    methods: {
        validatorSignerAddressFromCurrentSet(index: number | string): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        carbonOffsettingPartner(): TransactionObject<string>;
        checkProofOfPossession(sender: string, blsKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        getEpochNumberOfBlock(blockNumber: number | string): TransactionObject<string>;
        getVerifiedSealBitmapFromHeader(header: string | number[]): TransactionObject<string>;
        validatorSignerAddressFromSet(index: number | string, blockNumber: number | string): TransactionObject<string>;
        hashHeader(header: string | number[]): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        minQuorumSizeInCurrentSet(): TransactionObject<string>;
        startTime(): TransactionObject<string>;
        registry(): TransactionObject<string>;
        numberValidatorsInCurrentSet(): TransactionObject<string>;
        getBlockNumberFromHeader(header: string | number[]): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        getEpochNumber(): TransactionObject<string>;
        numberValidatorsInSet(blockNumber: number | string): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        getEpochSize(): TransactionObject<string>;
        targetValidatorEpochPayment(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(registryAddress: string, targetVotingYieldInitial: number | string, targetVotingYieldMax: number | string, targetVotingYieldAdjustmentFactor: number | string, rewardsMultiplierMax: number | string, rewardsMultiplierUnderspendAdjustmentFactor: number | string, rewardsMultiplierOverspendAdjustmentFactor: number | string, _targetVotingGoldFraction: number | string, _targetValidatorEpochPayment: number | string, _communityRewardFraction: number | string, _carbonOffsettingPartner: string, _carbonOffsettingFraction: number | string): TransactionObject<void>;
        getTargetVotingYieldParameters(): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        getRewardsMultiplierParameters(): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        setCommunityRewardFraction(value: number | string): TransactionObject<boolean>;
        getCommunityRewardFraction(): TransactionObject<string>;
        setCarbonOffsettingFund(partner: string, value: number | string): TransactionObject<boolean>;
        getCarbonOffsettingFraction(): TransactionObject<string>;
        setTargetVotingGoldFraction(value: number | string): TransactionObject<boolean>;
        getTargetVotingGoldFraction(): TransactionObject<string>;
        setTargetValidatorEpochPayment(value: number | string): TransactionObject<boolean>;
        setRewardsMultiplierParameters(max: number | string, underspendAdjustmentFactor: number | string, overspendAdjustmentFactor: number | string): TransactionObject<boolean>;
        setTargetVotingYieldParameters(max: number | string, adjustmentFactor: number | string): TransactionObject<boolean>;
        setTargetVotingYield(targetVotingYield: number | string): TransactionObject<boolean>;
        getTargetGoldTotalSupply(): TransactionObject<string>;
        getTargetVoterRewards(): TransactionObject<string>;
        getTargetTotalEpochPaymentsInGold(): TransactionObject<string>;
        getRewardsMultiplier(): TransactionObject<string>;
        getVotingGoldFraction(): TransactionObject<string>;
        updateTargetVotingYield(): TransactionObject<void>;
        isReserveLow(): TransactionObject<boolean>;
        calculateTargetEpochRewards(): TransactionObject<{
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
    };
    events: {
        TargetVotingGoldFractionSet: ContractEvent<string>;
        CommunityRewardFractionSet: ContractEvent<string>;
        CarbonOffsettingFundSet: ContractEvent<{
            partner: string;
            fraction: string;
            0: string;
            1: string;
        }>;
        TargetValidatorEpochPaymentSet: ContractEvent<string>;
        TargetVotingYieldParametersSet: ContractEvent<{
            max: string;
            adjustmentFactor: string;
            0: string;
            1: string;
        }>;
        TargetVotingYieldSet: ContractEvent<string>;
        RewardsMultiplierParametersSet: ContractEvent<{
            max: string;
            underspendAdjustmentFactor: string;
            overspendAdjustmentFactor: string;
            0: string;
            1: string;
            2: string;
        }>;
        TargetVotingYieldUpdated: ContractEvent<string>;
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
export declare function newEpochRewards(web3: Web3, address: string): EpochRewards;
export {};

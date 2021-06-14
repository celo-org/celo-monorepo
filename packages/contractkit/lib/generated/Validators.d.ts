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
export interface Validators extends Contract {
    clone(): Validators;
    methods: {
        validatorSignerAddressFromCurrentSet(index: number | string): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        checkProofOfPossession(sender: string, blsKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        slashingMultiplierResetPeriod(): TransactionObject<string>;
        getEpochNumberOfBlock(blockNumber: number | string): TransactionObject<string>;
        getVerifiedSealBitmapFromHeader(header: string | number[]): TransactionObject<string>;
        membershipHistoryLength(): TransactionObject<string>;
        maxGroupSize(): TransactionObject<string>;
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
        validatorLockedGoldRequirements(): TransactionObject<{
            value: string;
            duration: string;
            0: string;
            1: string;
        }>;
        groupLockedGoldRequirements(): TransactionObject<{
            value: string;
            duration: string;
            0: string;
            1: string;
        }>;
        getEpochSize(): TransactionObject<string>;
        commissionUpdateDelay(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(registryAddress: string, groupRequirementValue: number | string, groupRequirementDuration: number | string, validatorRequirementValue: number | string, validatorRequirementDuration: number | string, validatorScoreExponent: number | string, validatorScoreAdjustmentSpeed: number | string, _membershipHistoryLength: number | string, _slashingMultiplierResetPeriod: number | string, _maxGroupSize: number | string, _commissionUpdateDelay: number | string): TransactionObject<void>;
        setCommissionUpdateDelay(delay: number | string): TransactionObject<void>;
        setMaxGroupSize(size: number | string): TransactionObject<boolean>;
        setMembershipHistoryLength(length: number | string): TransactionObject<boolean>;
        setValidatorScoreParameters(exponent: number | string, adjustmentSpeed: number | string): TransactionObject<boolean>;
        getMaxGroupSize(): TransactionObject<string>;
        getCommissionUpdateDelay(): TransactionObject<string>;
        setGroupLockedGoldRequirements(value: number | string, duration: number | string): TransactionObject<boolean>;
        setValidatorLockedGoldRequirements(value: number | string, duration: number | string): TransactionObject<boolean>;
        registerValidator(ecdsaPublicKey: string | number[], blsPublicKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        getValidatorScoreParameters(): TransactionObject<{
            0: string;
            1: string;
        }>;
        getMembershipHistory(account: string): TransactionObject<{
            0: string[];
            1: string[];
            2: string;
            3: string;
        }>;
        calculateEpochScore(uptime: number | string): TransactionObject<string>;
        calculateGroupEpochScore(uptimes: (number | string)[]): TransactionObject<string>;
        updateValidatorScoreFromSigner(signer: string, uptime: number | string): TransactionObject<void>;
        distributeEpochPaymentsFromSigner(signer: string, maxPayment: number | string): TransactionObject<string>;
        deregisterValidator(index: number | string): TransactionObject<boolean>;
        affiliate(group: string): TransactionObject<boolean>;
        deaffiliate(): TransactionObject<boolean>;
        updateBlsPublicKey(blsPublicKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        updateEcdsaPublicKey(account: string, signer: string, ecdsaPublicKey: string | number[]): TransactionObject<boolean>;
        updatePublicKeys(account: string, signer: string, ecdsaPublicKey: string | number[], blsPublicKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        registerValidatorGroup(commission: number | string): TransactionObject<boolean>;
        deregisterValidatorGroup(index: number | string): TransactionObject<boolean>;
        addMember(validator: string): TransactionObject<boolean>;
        addFirstMember(validator: string, lesser: string, greater: string): TransactionObject<boolean>;
        removeMember(validator: string): TransactionObject<boolean>;
        reorderMember(validator: string, lesserMember: string, greaterMember: string): TransactionObject<boolean>;
        setNextCommissionUpdate(commission: number | string): TransactionObject<void>;
        updateCommission(): TransactionObject<void>;
        getAccountLockedGoldRequirement(account: string): TransactionObject<string>;
        meetsAccountLockedGoldRequirements(account: string): TransactionObject<boolean>;
        getValidatorBlsPublicKeyFromSigner(signer: string): TransactionObject<string>;
        getValidator(account: string): TransactionObject<{
            ecdsaPublicKey: string;
            blsPublicKey: string;
            affiliation: string;
            score: string;
            signer: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        }>;
        getValidatorGroup(account: string): TransactionObject<{
            0: string[];
            1: string;
            2: string;
            3: string;
            4: string[];
            5: string;
            6: string;
        }>;
        getGroupNumMembers(account: string): TransactionObject<string>;
        getTopGroupValidators(account: string, n: number | string): TransactionObject<string[]>;
        getGroupsNumMembers(accounts: string[]): TransactionObject<string[]>;
        getNumRegisteredValidators(): TransactionObject<string>;
        getValidatorLockedGoldRequirements(): TransactionObject<{
            0: string;
            1: string;
        }>;
        getGroupLockedGoldRequirements(): TransactionObject<{
            0: string;
            1: string;
        }>;
        getRegisteredValidators(): TransactionObject<string[]>;
        getRegisteredValidatorSigners(): TransactionObject<string[]>;
        getRegisteredValidatorGroups(): TransactionObject<string[]>;
        isValidatorGroup(account: string): TransactionObject<boolean>;
        isValidator(account: string): TransactionObject<boolean>;
        getMembershipInLastEpochFromSigner(signer: string): TransactionObject<string>;
        getMembershipInLastEpoch(account: string): TransactionObject<string>;
        forceDeaffiliateIfValidator(validatorAccount: string): TransactionObject<void>;
        setSlashingMultiplierResetPeriod(value: number | string): TransactionObject<void>;
        resetSlashingMultiplier(): TransactionObject<void>;
        halveSlashingMultiplier(account: string): TransactionObject<void>;
        getValidatorGroupSlashingMultiplier(account: string): TransactionObject<string>;
        groupMembershipInEpoch(account: string, epochNumber: number | string, index: number | string): TransactionObject<string>;
    };
    events: {
        MaxGroupSizeSet: ContractEvent<string>;
        CommissionUpdateDelaySet: ContractEvent<string>;
        ValidatorScoreParametersSet: ContractEvent<{
            exponent: string;
            adjustmentSpeed: string;
            0: string;
            1: string;
        }>;
        GroupLockedGoldRequirementsSet: ContractEvent<{
            value: string;
            duration: string;
            0: string;
            1: string;
        }>;
        ValidatorLockedGoldRequirementsSet: ContractEvent<{
            value: string;
            duration: string;
            0: string;
            1: string;
        }>;
        MembershipHistoryLengthSet: ContractEvent<string>;
        ValidatorRegistered: ContractEvent<string>;
        ValidatorDeregistered: ContractEvent<string>;
        ValidatorAffiliated: ContractEvent<{
            validator: string;
            group: string;
            0: string;
            1: string;
        }>;
        ValidatorDeaffiliated: ContractEvent<{
            validator: string;
            group: string;
            0: string;
            1: string;
        }>;
        ValidatorEcdsaPublicKeyUpdated: ContractEvent<{
            validator: string;
            ecdsaPublicKey: string;
            0: string;
            1: string;
        }>;
        ValidatorBlsPublicKeyUpdated: ContractEvent<{
            validator: string;
            blsPublicKey: string;
            0: string;
            1: string;
        }>;
        ValidatorScoreUpdated: ContractEvent<{
            validator: string;
            score: string;
            epochScore: string;
            0: string;
            1: string;
            2: string;
        }>;
        ValidatorGroupRegistered: ContractEvent<{
            group: string;
            commission: string;
            0: string;
            1: string;
        }>;
        ValidatorGroupDeregistered: ContractEvent<string>;
        ValidatorGroupMemberAdded: ContractEvent<{
            group: string;
            validator: string;
            0: string;
            1: string;
        }>;
        ValidatorGroupMemberRemoved: ContractEvent<{
            group: string;
            validator: string;
            0: string;
            1: string;
        }>;
        ValidatorGroupMemberReordered: ContractEvent<{
            group: string;
            validator: string;
            0: string;
            1: string;
        }>;
        ValidatorGroupCommissionUpdateQueued: ContractEvent<{
            group: string;
            commission: string;
            activationBlock: string;
            0: string;
            1: string;
            2: string;
        }>;
        ValidatorGroupCommissionUpdated: ContractEvent<{
            group: string;
            commission: string;
            0: string;
            1: string;
        }>;
        ValidatorEpochPaymentDistributed: ContractEvent<{
            validator: string;
            validatorPayment: string;
            group: string;
            groupPayment: string;
            0: string;
            1: string;
            2: string;
            3: string;
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
export declare function newValidators(web3: Web3, address: string): Validators;
export {};

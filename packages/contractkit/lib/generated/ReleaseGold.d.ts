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
export interface ReleaseGold extends Contract {
    clone(): ReleaseGold;
    methods: {
        maxDistribution(): TransactionObject<string>;
        refundAddress(): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        canVote(): TransactionObject<boolean>;
        beneficiary(): TransactionObject<string>;
        EXPIRATION_TIME(): TransactionObject<string>;
        totalWithdrawn(): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        registry(): TransactionObject<string>;
        releaseOwner(): TransactionObject<string>;
        owner(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        revocationInfo(): TransactionObject<{
            revocable: boolean;
            canExpire: boolean;
            releasedBalanceAtRevoke: string;
            revokeTime: string;
            0: boolean;
            1: boolean;
            2: string;
            3: string;
        }>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        liquidityProvisionMet(): TransactionObject<boolean>;
        canValidate(): TransactionObject<boolean>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        releaseSchedule(): TransactionObject<{
            releaseStartTime: string;
            releaseCliff: string;
            numReleasePeriods: string;
            releasePeriod: string;
            amountReleasedPerPeriod: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        }>;
        transfer(to: string, value: number | string): TransactionObject<void>;
        initialize(releaseStartTime: number | string, releaseCliffTime: number | string, numReleasePeriods: number | string, releasePeriod: number | string, amountReleasedPerPeriod: number | string, revocable: boolean, _beneficiary: string, _releaseOwner: string, _refundAddress: string, subjectToLiquidityProvision: boolean, initialDistributionRatio: number | string, _canValidate: boolean, _canVote: boolean, registryAddress: string): TransactionObject<void>;
        isRevoked(): TransactionObject<boolean>;
        setLiquidityProvision(): TransactionObject<void>;
        setCanExpire(_canExpire: boolean): TransactionObject<void>;
        setMaxDistribution(distributionRatio: number | string): TransactionObject<void>;
        setBeneficiary(newBeneficiary: string): TransactionObject<void>;
        withdraw(amount: number | string): TransactionObject<void>;
        refundAndFinalize(): TransactionObject<void>;
        revoke(): TransactionObject<void>;
        expire(): TransactionObject<void>;
        getTotalBalance(): TransactionObject<string>;
        getRemainingTotalBalance(): TransactionObject<string>;
        getRemainingUnlockedBalance(): TransactionObject<string>;
        getRemainingLockedBalance(): TransactionObject<string>;
        getCurrentReleasedTotalAmount(): TransactionObject<string>;
        lockGold(value: number | string): TransactionObject<void>;
        unlockGold(value: number | string): TransactionObject<void>;
        relockGold(index: number | string, value: number | string): TransactionObject<void>;
        withdrawLockedGold(index: number | string): TransactionObject<void>;
        authorizeVoteSigner(signer: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        authorizeValidatorSigner(signer: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        authorizeValidatorSignerWithPublicKey(signer: string, v: number | string, r: string | number[], s: string | number[], ecdsaPublicKey: string | number[]): TransactionObject<void>;
        authorizeValidatorSignerWithKeys(signer: string, v: number | string, r: string | number[], s: string | number[], ecdsaPublicKey: string | number[], blsPublicKey: string | number[], blsPop: string | number[]): TransactionObject<void>;
        authorizeAttestationSigner(signer: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        setAccount(name: string, dataEncryptionKey: string | number[], walletAddress: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        createAccount(): TransactionObject<void>;
        setAccountName(name: string): TransactionObject<void>;
        setAccountWalletAddress(walletAddress: string, v: number | string, r: string | number[], s: string | number[]): TransactionObject<void>;
        setAccountDataEncryptionKey(dataEncryptionKey: string | number[]): TransactionObject<void>;
        setAccountMetadataURL(metadataURL: string): TransactionObject<void>;
        revokeActive(group: string, value: number | string, lesser: string, greater: string, index: number | string): TransactionObject<void>;
        revokePending(group: string, value: number | string, lesser: string, greater: string, index: number | string): TransactionObject<void>;
    };
    events: {
        ReleaseGoldInstanceCreated: ContractEvent<{
            beneficiary: string;
            atAddress: string;
            0: string;
            1: string;
        }>;
        ReleaseScheduleRevoked: ContractEvent<{
            revokeTimestamp: string;
            releasedBalanceAtRevoke: string;
            0: string;
            1: string;
        }>;
        ReleaseGoldInstanceDestroyed: ContractEvent<{
            beneficiary: string;
            atAddress: string;
            0: string;
            1: string;
        }>;
        DistributionLimitSet: ContractEvent<{
            beneficiary: string;
            maxDistribution: string;
            0: string;
            1: string;
        }>;
        LiquidityProvisionSet: ContractEvent<string>;
        CanExpireSet: ContractEvent<boolean>;
        BeneficiarySet: ContractEvent<string>;
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
export declare function newReleaseGold(web3: Web3, address: string): ReleaseGold;
export {};

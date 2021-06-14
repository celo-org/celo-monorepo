import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { Validators } from '../generated/Validators';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export interface Validator {
    name: string;
    address: Address;
    ecdsaPublicKey: string;
    blsPublicKey: string;
    affiliation: string | null;
    score: BigNumber;
    signer: Address;
}
export interface ValidatorGroup {
    name: string;
    address: Address;
    members: Address[];
    membersUpdated: number;
    affiliates: Address[];
    commission: BigNumber;
    nextCommission: BigNumber;
    nextCommissionBlock: BigNumber;
    lastSlashed: BigNumber;
    slashingMultiplier: BigNumber;
}
export interface ValidatorReward {
    validator: Validator;
    validatorPayment: BigNumber;
    group: ValidatorGroup;
    groupPayment: BigNumber;
    epochNumber: number;
}
export interface LockedGoldRequirements {
    value: BigNumber;
    duration: BigNumber;
}
export interface ValidatorsConfig {
    groupLockedGoldRequirements: LockedGoldRequirements;
    validatorLockedGoldRequirements: LockedGoldRequirements;
    maxGroupSize: BigNumber;
    membershipHistoryLength: BigNumber;
    slashingMultiplierResetPeriod: BigNumber;
    commissionUpdateDelay: BigNumber;
}
export interface GroupMembership {
    epoch: number;
    group: Address;
}
export interface MembershipHistoryExtraData {
    lastRemovedFromGroupTimestamp: number;
    tail: number;
}
/**
 * Contract for voting for validators and managing validator groups.
 */
export declare class ValidatorsWrapper extends BaseWrapper<Validators> {
    /**
     * Queues an update to a validator group's commission.
     * @param commission Fixidity representation of the commission this group receives on epoch
     *   payments made to its members. Must be in the range [0, 1.0].
     */
    setNextCommissionUpdate: (commission: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Updates a validator group's commission based on the previously queued update
     */
    updateCommission: () => CeloTransactionObject<void>;
    /**
     * Returns the Locked Gold requirements for validators.
     * @returns The Locked Gold requirements for validators.
     */
    getValidatorLockedGoldRequirements(): Promise<LockedGoldRequirements>;
    /**
     * Returns the Locked Gold requirements for validator groups.
     * @returns The Locked Gold requirements for validator groups.
     */
    getGroupLockedGoldRequirements(): Promise<LockedGoldRequirements>;
    /**
     * Returns the Locked Gold requirements for specific account.
     * @returns The Locked Gold requirements for a specific account.
     */
    getAccountLockedGoldRequirement: (account: string) => Promise<BigNumber>;
    /**
     * Returns the reset period, in seconds, for slashing multiplier.
     */
    getSlashingMultiplierResetPeriod: () => Promise<BigNumber>;
    /**
     * Returns the update delay, in blocks, for the group commission.
     */
    getCommissionUpdateDelay: () => Promise<BigNumber>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<ValidatorsConfig>;
    /**
     * Returns the account associated with `signer`.
     * @param signer The address of an account or currently authorized validator signer.
     * @dev Fails if the `signer` is not an account or currently authorized validator.
     * @return The associated account.
     */
    validatorSignerToAccount(signerAddress: Address): Promise<string>;
    /**
     * Returns the account associated with `signer`.
     * @param signer The address of the account or previously authorized signer.
     * @dev Fails if the `signer` is not an account or previously authorized signer.
     * @return The associated account.
     */
    signerToAccount(signerAddress: Address): Promise<string>;
    /**
     * Updates a validator's BLS key.
     * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
     *   of possession. 48 bytes.
     * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
     *   account address. 96 bytes.
     * @return True upon success.
     */
    updateBlsPublicKey: (blsPublicKey: string, blsPop: string) => CeloTransactionObject<boolean>;
    /**
     * Returns whether a particular account has a registered validator.
     * @param account The account.
     * @return Whether a particular address is a registered validator.
     */
    isValidator: (account: string) => Promise<boolean>;
    /**
     * Returns whether a particular account has a registered validator group.
     * @param account The account.
     * @return Whether a particular address is a registered validator group.
     */
    isValidatorGroup: (account: string) => Promise<boolean>;
    /**
     * Returns whether an account meets the requirements to register a validator.
     * @param account The account.
     * @return Whether an account meets the requirements to register a validator.
     */
    meetsValidatorBalanceRequirements: (address: string) => Promise<boolean>;
    /**
     * Returns whether an account meets the requirements to register a group.
     * @param account The account.
     * @return Whether an account meets the requirements to register a group.
     */
    meetsValidatorGroupBalanceRequirements: (address: string) => Promise<boolean>;
    /** Get Validator information */
    getValidator(address: Address, blockNumber?: number): Promise<Validator>;
    getValidatorFromSigner(address: Address, blockNumber?: number): Promise<Validator>;
    /** Get ValidatorGroup information */
    getValidatorGroup(address: Address, getAffiliates?: boolean, blockNumber?: number): Promise<ValidatorGroup>;
    /**
     * Returns the Validator's group membership history
     * @param validator The validator whose membership history to return.
     * @return The group membership history of a validator.
     */
    getValidatorMembershipHistory: (validator: Address) => Promise<GroupMembership[]>;
    /**
     * Returns extra data from the Validator's group membership history
     * @param validator The validator whose membership history to return.
     * @return The group membership history of a validator.
     */
    getValidatorMembershipHistoryExtraData: (validator: Address) => Promise<MembershipHistoryExtraData>;
    /** Get the size (amount of members) of a ValidatorGroup */
    getValidatorGroupSize: (group: Address) => Promise<number>;
    /** Get list of registered validator addresses */
    getRegisteredValidatorsAddresses(blockNumber?: number): Promise<Address[]>;
    /** Get list of registered validator group addresses */
    getRegisteredValidatorGroupsAddresses: () => Promise<Address[]>;
    /** Get list of registered validators */
    getRegisteredValidators(blockNumber?: number): Promise<Validator[]>;
    /** Get list of registered validator groups */
    getRegisteredValidatorGroups(): Promise<ValidatorGroup[]>;
    /**
     * Registers a validator unaffiliated with any validator group.
     *
     * Fails if the account is already a validator or validator group.
     *
     * @param validatorAddress The address that the validator is using for consensus, should match
     *   the validator signer.
     * @param ecdsaPublicKey The ECDSA public key that the validator is using for consensus. 64 bytes.
     * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
     *   of possession. 48 bytes.
     * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
     *   account address. 96 bytes.
     */
    getEpochNumber: () => Promise<BigNumber>;
    getEpochSize: () => Promise<BigNumber>;
    registerValidator: (ecdsaPublicKey: string, blsPublicKey: string, blsPop: string) => CeloTransactionObject<boolean>;
    /**
     * De-registers a validator, removing it from the group for which it is a member.
     * @param validatorAddress Address of the validator to deregister
     */
    deregisterValidator(validatorAddress: Address): Promise<CeloTransactionObject<boolean>>;
    /**
     * Registers a validator group with no member validators.
     * Fails if the account is already a validator or validator group.
     * Fails if the account does not have sufficient weight.
     *
     * @param commission the commission this group receives on epoch payments made to its members.
     */
    registerValidatorGroup(commission: BigNumber): Promise<CeloTransactionObject<boolean>>;
    /**
     * De-registers a validator Group
     * @param validatorGroupAddress Address of the validator group to deregister
     */
    deregisterValidatorGroup(validatorGroupAddress: Address): Promise<CeloTransactionObject<boolean>>;
    /**
     * Affiliates a validator with a group, allowing it to be added as a member.
     * De-affiliates with the previously affiliated group if present.
     * @param group The validator group with which to affiliate.
     */
    affiliate: (group: Address) => CeloTransactionObject<boolean>;
    /**
     * De-affiliates a validator, removing it from the group for which it is a member.
     * Fails if the account is not a validator with non-zero affiliation.
     */
    deaffiliate: () => CeloTransactionObject<boolean>;
    /**
     * Removes a validator from the group for which it is a member.
     * @param validatorAccount The validator to deaffiliate from their affiliated validator group.
     */
    forceDeaffiliateIfValidator: (validatorAccount: string) => CeloTransactionObject<void>;
    /**
     * Resets a group's slashing multiplier if it has been >= the reset period since
     * the last time the group was slashed.
     */
    resetSlashingMultiplier: () => CeloTransactionObject<void>;
    /**
     * Adds a member to the end of a validator group's list of members.
     * Fails if `validator` has not set their affiliation to this account.
     * @param validator The validator to add to the group
     */
    addMember(group: Address, validator: Address): Promise<CeloTransactionObject<boolean>>;
    /**
     * Removes a member from a ValidatorGroup
     * The ValidatorGroup is specified by the `from` of the tx.
     *
     * @param validator The Validator to remove from the group
     */
    removeMember: (validator: string) => CeloTransactionObject<boolean>;
    /**
     * Reorders a member within a validator group.
     * Fails if `validator` is not a member of the account's validator group.
     * @param groupAddr The validator group
     * @param validator The validator to reorder.
     * @param newIndex New position for the validator
     */
    reorderMember(groupAddr: Address, validator: Address, newIndex: number): Promise<CeloTransactionObject<boolean>>;
    /**
     * Retrieves ValidatorRewards for epochNumber.
     * @param epochNumber The epoch to retrieve ValidatorRewards at.
     */
    getValidatorRewards(epochNumber: number): Promise<ValidatorReward[]>;
    /**
     * Returns the current set of validator signer addresses
     */
    currentSignerSet(): Promise<Address[]>;
    /**
     * Returns the current set of validator signer and account addresses
     */
    currentValidatorAccountsSet(): Promise<{
        signer: string;
        account: string;
    }[]>;
    /**
     * Returns the group membership for `validator`.
     * @param validator Address of validator to retrieve group membership for.
     * @param blockNumber Block number to retrieve group membership at.
     * @return Group and membership history index for `validator`.
     */
    getValidatorMembershipHistoryIndex(validator: Validator, blockNumber?: number): Promise<{
        group: Address;
        historyIndex: number;
    }>;
    /**
     * Returns the index into `history` for `epoch`.
     * @param epoch The needle.
     * @param history The haystack.
     * @return Index for epoch or -1.
     */
    findValidatorMembershipHistoryIndex(epoch: number, history: GroupMembership[]): number;
}

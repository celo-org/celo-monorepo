import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { Election } from '../generated/Election';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
import { Validator, ValidatorGroup } from './Validators';
export interface ValidatorGroupVote {
    address: Address;
    name: string;
    votes: BigNumber;
    capacity: BigNumber;
    eligible: boolean;
}
export interface Voter {
    address: Address;
    votes: GroupVote[];
}
export interface VoterReward {
    address: Address;
    addressPayment: BigNumber;
    group: ValidatorGroup;
    epochNumber: number;
}
export interface GroupVote {
    group: Address;
    pending: BigNumber;
    active: BigNumber;
}
export interface GroupVoterReward {
    group: ValidatorGroup;
    groupVoterPayment: BigNumber;
    epochNumber: number;
}
export interface ElectableValidators {
    min: BigNumber;
    max: BigNumber;
}
export interface ElectionConfig {
    electableValidators: ElectableValidators;
    electabilityThreshold: BigNumber;
    maxNumGroupsVotedFor: BigNumber;
    totalVotes: BigNumber;
    currentThreshold: BigNumber;
}
/**
 * Contract for voting for validators and managing validator groups.
 */
export declare class ElectionWrapper extends BaseWrapper<Election> {
    /**
     * Returns the minimum and maximum number of validators that can be elected.
     * @returns The minimum and maximum number of validators that can be elected.
     */
    electableValidators(): Promise<ElectableValidators>;
    /**
     * Returns the current election threshold.
     * @returns Election threshold.
     */
    electabilityThreshold: () => Promise<BigNumber>;
    /**
     * Gets a validator address from the validator set at the given block number.
     * @param index Index of requested validator in the validator set.
     * @param blockNumber Block number to retrieve the validator set from.
     * @return Address of validator at the requested index.
     */
    validatorSignerAddressFromSet: (signerIndex: number, blockNumber: number) => Promise<Address>;
    /**
     * Gets a validator address from the current validator set.
     * @param index Index of requested validator in the validator set.
     * @return Address of validator at the requested index.
     */
    validatorSignerAddressFromCurrentSet: (index: number) => Promise<Address>;
    /**
     * Gets the size of the validator set that must sign the given block number.
     * @param blockNumber Block number to retrieve the validator set from.
     * @return Size of the validator set.
     */
    numberValidatorsInSet: (blockNumber: number) => Promise<number>;
    /**
     * Gets the size of the current elected validator set.
     * @return Size of the current elected validator set.
     */
    numberValidatorsInCurrentSet: () => Promise<number>;
    /**
     * Returns the total votes received across all groups.
     * @return The total votes received across all groups.
     */
    getTotalVotes: () => Promise<BigNumber>;
    /**
     * Returns the current validator signers using the precompiles.
     * @return List of current validator signers.
     */
    getCurrentValidatorSigners: () => Promise<Address[]>;
    /**
     * Returns the validator signers for block `blockNumber`.
     * @param blockNumber Block number to retrieve signers for.
     * @return Address of each signer in the validator set.
     */
    getValidatorSigners(blockNumber: number): Promise<Address[]>;
    /**
     * Returns a list of elected validators with seats allocated to groups via the D'Hondt method.
     * @return The list of elected validators.
     * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
     */
    electValidatorSigners(min?: number, max?: number): Promise<Address[]>;
    /**
     * Returns the total votes for `group`.
     * @param group The address of the validator group.
     * @return The total votes for `group`.
     */
    getTotalVotesForGroup(group: Address, blockNumber?: number): Promise<BigNumber>;
    /**
     * Returns the total votes for `group` made by `account`.
     * @param group The address of the validator group.
     * @param account The address of the voting account.
     * @return The total votes for `group` made by `account`.
     */
    getTotalVotesForGroupByAccount: (group: string, account: string) => Promise<BigNumber>;
    /**
     * Returns the active votes for `group`.
     * @param group The address of the validator group.
     * @return The active votes for `group`.
     */
    getActiveVotesForGroup(group: Address, blockNumber?: number): Promise<BigNumber>;
    /**
     * Returns the groups that `account` has voted for.
     * @param account The address of the account casting votes.
     * @return The groups that `account` has voted for.
     */
    getGroupsVotedForByAccount: (account: Address) => Promise<Address[]>;
    getVotesForGroupByAccount(account: Address, group: Address, blockNumber?: number): Promise<GroupVote>;
    getVoter(account: Address, blockNumber?: number): Promise<Voter>;
    /**
     * Returns whether or not the account has any pending votes.
     * @param account The address of the account casting votes.
     * @return The groups that `account` has voted for.
     */
    hasPendingVotes(account: Address): Promise<boolean>;
    hasActivatablePendingVotes(account: Address): Promise<boolean>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<ElectionConfig>;
    getValidatorGroupVotes(address: Address): Promise<ValidatorGroupVote>;
    /**
     * Returns the current registered validator groups and their total votes and eligibility.
     */
    getValidatorGroupsVotes(): Promise<ValidatorGroupVote[]>;
    private _activate;
    /**
     * Activates any activatable pending votes.
     * @param account The account with pending votes to activate.
     */
    activate(account: Address): Promise<Array<CeloTransactionObject<boolean>>>;
    revokePending(account: Address, group: Address, value: BigNumber): Promise<CeloTransactionObject<boolean>>;
    revokeActive(account: Address, group: Address, value: BigNumber): Promise<CeloTransactionObject<boolean>>;
    revoke(account: Address, group: Address, value: BigNumber): Promise<Array<CeloTransactionObject<boolean>>>;
    /**
     * Increments the number of total and pending votes for `group`.
     * @param validatorGroup The validator group to vote for.
     * @param value The amount of gold to use to vote.
     */
    vote(validatorGroup: Address, value: BigNumber): Promise<CeloTransactionObject<boolean>>;
    /**
     * Returns the current eligible validator groups and their total votes.
     */
    getEligibleValidatorGroupsVotes(): Promise<ValidatorGroupVote[]>;
    findLesserAndGreaterAfterVote(votedGroup: Address, voteWeight: BigNumber): Promise<{
        lesser: Address;
        greater: Address;
    }>;
    /**
     * Retrieves the set of validatorsparticipating in BFT at epochNumber.
     * @param epochNumber The epoch to retrieve the elected validator set at.
     */
    getElectedValidators(epochNumber: number): Promise<Validator[]>;
    /**
     * Retrieves GroupVoterRewards at epochNumber.
     * @param epochNumber The epoch to retrieve GroupVoterRewards at.
     */
    getGroupVoterRewards(epochNumber: number): Promise<GroupVoterReward[]>;
    /**
     * Retrieves VoterRewards for address at epochNumber.
     * @param address The address to retrieve VoterRewards for.
     * @param epochNumber The epoch to retrieve VoterRewards at.
     * @param voterShare Optionally address' share of group rewards.
     */
    getVoterRewards(address: Address, epochNumber: number, voterShare?: Record<Address, BigNumber>): Promise<VoterReward[]>;
    /**
     * Retrieves a voter's share of active votes.
     * @param address The voter to retrieve share for.
     * @param blockNumber The block to retrieve the voter's share at.
     */
    getVoterShare(address: Address, blockNumber?: number): Promise<Record<Address, BigNumber>>;
}

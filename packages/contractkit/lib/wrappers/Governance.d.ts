/// <reference types="node" />
import BigNumber from 'bignumber.js';
import { Transaction } from 'web3-eth';
import { Address } from '../base';
import { Governance } from '../generated/Governance';
import { BaseWrapper } from './BaseWrapper';
export declare enum ProposalStage {
    None = "None",
    Queued = "Queued",
    Approval = "Approval",
    Referendum = "Referendum",
    Execution = "Execution",
    Expiration = "Expiration"
}
export interface ProposalStageDurations {
    [ProposalStage.Approval]: BigNumber;
    [ProposalStage.Referendum]: BigNumber;
    [ProposalStage.Execution]: BigNumber;
}
export interface ParticipationParameters {
    baseline: BigNumber;
    baselineFloor: BigNumber;
    baselineUpdateFactor: BigNumber;
    baselineQuorumFactor: BigNumber;
}
export interface GovernanceConfig {
    concurrentProposals: BigNumber;
    dequeueFrequency: BigNumber;
    minDeposit: BigNumber;
    queueExpiry: BigNumber;
    stageDurations: ProposalStageDurations;
    participationParameters: ParticipationParameters;
}
export interface ProposalMetadata {
    proposer: Address;
    deposit: BigNumber;
    timestamp: BigNumber;
    transactionCount: number;
    descriptionURL: string;
}
export declare type ProposalParams = Parameters<Governance['methods']['propose']>;
export declare type ProposalTransaction = Pick<Transaction, 'to' | 'input' | 'value'>;
export declare type Proposal = ProposalTransaction[];
export declare const proposalToParams: (proposal: Proposal, descriptionURL: string) => [(string | number)[], string[], string | number[], (string | number)[], string];
export interface ProposalRecord {
    stage: ProposalStage;
    metadata: ProposalMetadata;
    upvotes: BigNumber;
    votes: Votes;
    proposal: Proposal;
    passing: boolean;
}
export interface UpvoteRecord {
    proposalID: BigNumber;
    upvotes: BigNumber;
}
export declare enum VoteValue {
    None = "NONE",
    Abstain = "Abstain",
    No = "No",
    Yes = "Yes"
}
export interface Votes {
    [VoteValue.Yes]: BigNumber;
    [VoteValue.No]: BigNumber;
    [VoteValue.Abstain]: BigNumber;
}
export declare type HotfixParams = Parameters<Governance['methods']['executeHotfix']>;
export declare const hotfixToParams: (proposal: Proposal, salt: Buffer) => [(string | number)[], string[], string | number[], (string | number)[], string | number[]];
export interface HotfixRecord {
    approved: boolean;
    executed: boolean;
    preparedEpoch: BigNumber;
}
export interface VoteRecord {
    proposalID: BigNumber;
    votes: BigNumber;
    value: VoteValue;
}
export interface Voter {
    upvote: UpvoteRecord;
    votes: VoteRecord[];
    refundedDeposits: BigNumber;
}
/**
 * Contract managing voting for governance proposals.
 */
export declare class GovernanceWrapper extends BaseWrapper<Governance> {
    /**
     * Querying number of possible concurrent proposals.
     * @returns Current number of possible concurrent proposals.
     */
    concurrentProposals: () => Promise<BigNumber>;
    /**
     * Query proposal dequeue frequency.
     * @returns Current proposal dequeue frequency in seconds.
     */
    lastDequeue: () => Promise<BigNumber>;
    /**
     * Query proposal dequeue frequency.
     * @returns Current proposal dequeue frequency in seconds.
     */
    dequeueFrequency: () => Promise<BigNumber>;
    /**
     * Query minimum deposit required to make a proposal.
     * @returns Current minimum deposit.
     */
    minDeposit: () => Promise<BigNumber>;
    /**
     * Query queue expiry parameter.
     * @return The number of seconds a proposal can stay in the queue before expiring.
     */
    queueExpiry: () => Promise<BigNumber>;
    /**
     * Query durations of different stages in proposal lifecycle.
     * @returns Durations for approval, referendum and execution stages in seconds.
     */
    stageDurations(): Promise<ProposalStageDurations>;
    /**
     * Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal transaction.
     * @param tx Transaction to determine the constitution for running.
     */
    getTransactionConstitution(tx: ProposalTransaction): Promise<BigNumber>;
    /**
     * Returns the required ratio of yes:no votes needed to exceed in order to pass the proposal.
     * @param proposal Proposal to determine the constitution for running.
     */
    getConstitution(proposal: Proposal): Promise<BigNumber>;
    /**
     * Returns the participation parameters.
     * @returns The participation parameters.
     */
    getParticipationParameters(): Promise<ParticipationParameters>;
    /**
     * Returns whether or not a particular account is voting on proposals.
     * @param account The address of the account.
     * @returns Whether or not the account is voting on proposals.
     */
    isVoting: (account: string) => Promise<boolean>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<GovernanceConfig>;
    /**
     * Returns the metadata associated with a given proposal.
     * @param proposalID Governance proposal UUID
     */
    getProposalMetadata: (proposalID: BigNumber.Value) => Promise<ProposalMetadata>;
    /**
     * Returns the transaction at the given index associated with a given proposal.
     * @param proposalID Governance proposal UUID
     * @param txIndex Transaction index
     */
    getProposalTransaction: (proposalID: BigNumber.Value, txIndex: number) => Promise<ProposalTransaction>;
    /**
     * Returns whether a given proposal is approved.
     * @param proposalID Governance proposal UUID
     */
    isApproved: (proposalID: BigNumber.Value) => Promise<boolean>;
    /**
     * Returns whether a dequeued proposal is expired.
     * @param proposalID Governance proposal UUID
     */
    isDequeuedProposalExpired: (proposalID: BigNumber.Value) => Promise<boolean>;
    /**
     * Returns whether a dequeued proposal is expired.
     * @param proposalID Governance proposal UUID
     */
    isQueuedProposalExpired: (args_0: BigNumber.Value) => Promise<boolean>;
    /**
     * Returns the approver address for proposals and hotfixes.
     */
    getApprover: () => Promise<string>;
    getProposalStage: (args_0: BigNumber.Value) => Promise<ProposalStage>;
    timeUntilStages(proposalID: BigNumber.Value): Promise<{
        referendum: BigNumber;
        execution: BigNumber;
        expiration: BigNumber;
    }>;
    /**
     * Returns the proposal associated with a given id.
     * @param proposalID Governance proposal UUID
     */
    getProposal(proposalID: BigNumber.Value): Promise<Proposal>;
    /**
     * Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.
     * @param proposalID Governance proposal UUID
     */
    getProposalRecord(proposalID: BigNumber.Value): Promise<ProposalRecord>;
    /**
     * Returns whether a given proposal is passing relative to the constitution's threshold.
     * @param proposalID Governance proposal UUID
     */
    isProposalPassing: (args_0: BigNumber.Value) => Promise<boolean>;
    /**
     * Withdraws refunded proposal deposits.
     */
    withdraw: () => import("./BaseWrapper").CeloTransactionObject<boolean>;
    /**
     * Submits a new governance proposal.
     * @param proposal Governance proposal
     * @param descriptionURL A URL where further information about the proposal can be viewed
     */
    propose: (proposal: Proposal, descriptionURL: string) => import("./BaseWrapper").CeloTransactionObject<string>;
    /**
     * Returns whether a governance proposal exists with the given ID.
     * @param proposalID Governance proposal UUID
     */
    proposalExists: (proposalID: BigNumber.Value) => Promise<boolean>;
    /**
     * Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).
     * @param upvoter Address of upvoter
     */
    getUpvoteRecord: (upvoter: Address) => Promise<UpvoteRecord>;
    /**
     * Returns the corresponding vote record
     * @param voter Address of voter
     * @param proposalID Governance proposal UUID
     */
    getVoteRecord(voter: Address, proposalID: BigNumber.Value): Promise<VoteRecord | null>;
    /**
     * Returns whether a given proposal is queued.
     * @param proposalID Governance proposal UUID
     */
    isQueued: (args_0: BigNumber.Value) => Promise<boolean>;
    /**
     * Returns the value of proposal deposits that have been refunded.
     * @param proposer Governance proposer address.
     */
    getRefundedDeposits: (args_0: string) => Promise<BigNumber>;
    getUpvotes: (args_0: BigNumber.Value) => Promise<BigNumber>;
    /**
     * Returns the yes, no, and abstain votes applied to a given proposal.
     * @param proposalID Governance proposal UUID
     */
    getVotes: (args_0: BigNumber.Value) => Promise<Votes>;
    /**
     * Returns the proposal queue as list of upvote records.
     */
    getQueue: () => Promise<UpvoteRecord[]>;
    /**
     * Returns the (existing) proposal dequeue as list of proposal IDs.
     */
    getDequeue(filterZeroes?: boolean): Promise<BigNumber[]>;
    getVoteRecords(voter: Address): Promise<VoteRecord[]>;
    getVoter(account: Address): Promise<Voter>;
    /**
     * Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue
     */
    dequeueProposalsIfReady: () => import("./BaseWrapper").CeloTransactionObject<void>;
    /**
     * Returns the number of votes that will be applied to a proposal for a given voter.
     * @param voter Address of voter
     */
    getVoteWeight(voter: Address): Promise<BigNumber>;
    private getIndex;
    private getDequeueIndex;
    private getQueueIndex;
    private lesserAndGreater;
    sortedQueue(queue: UpvoteRecord[]): UpvoteRecord[];
    private withUpvoteRevoked;
    private withUpvoteApplied;
    private lesserAndGreaterAfterRevoke;
    private lesserAndGreaterAfterUpvote;
    /**
     * Applies provided upvoter's upvote to given proposal.
     * @param proposalID Governance proposal UUID
     * @param upvoter Address of upvoter
     */
    upvote(proposalID: BigNumber.Value, upvoter: Address): Promise<import("./BaseWrapper").CeloTransactionObject<boolean>>;
    /**
     * Revokes provided upvoter's upvote.
     * @param upvoter Address of upvoter
     */
    revokeUpvote(upvoter: Address): Promise<import("./BaseWrapper").CeloTransactionObject<boolean>>;
    /**
     * Approves given proposal, allowing it to later move to `referendum`.
     * @param proposalID Governance proposal UUID
     * @notice Only the `approver` address will succeed in sending this transaction
     */
    approve(proposalID: BigNumber.Value): Promise<import("./BaseWrapper").CeloTransactionObject<boolean>>;
    /**
     * Applies `sender`'s vote choice to a given proposal.
     * @param proposalID Governance proposal UUID
     * @param vote Choice to apply (yes, no, abstain)
     */
    vote(proposalID: BigNumber.Value, vote: keyof typeof VoteValue): Promise<import("./BaseWrapper").CeloTransactionObject<boolean>>;
    /**
     * Returns `voter`'s vote choice on a given proposal.
     * @param proposalID Governance proposal UUID
     * @param voter Address of voter
     */
    getVoteValue(proposalID: BigNumber.Value, voter: Address): Promise<VoteValue>;
    /**
     * Executes a given proposal's associated transactions.
     * @param proposalID Governance proposal UUID
     */
    execute(proposalID: BigNumber.Value): Promise<import("./BaseWrapper").CeloTransactionObject<boolean>>;
    /**
     * Returns approved, executed, and prepared status associated with a given hotfix.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     */
    getHotfixRecord(hash: Buffer): Promise<HotfixRecord>;
    /**
     * Returns whether a given hotfix has been whitelisted by a given address.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     * @param whitelister address of whitelister
     */
    isHotfixWhitelistedBy: (args_0: Buffer, args_1: string) => Promise<boolean>;
    /**
     * Returns whether a given hotfix can be passed.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     */
    isHotfixPassing: (args_0: Buffer) => Promise<boolean>;
    /**
     * Returns the number of validators required to reach a Byzantine quorum
     */
    minQuorumSize: () => Promise<BigNumber>;
    /**
     * Returns the number of validators that whitelisted the hotfix
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     */
    hotfixWhitelistValidatorTally: (args_0: Buffer) => Promise<string>;
    /**
     * Marks the given hotfix whitelisted by `sender`.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     */
    whitelistHotfix: (args_0: Buffer) => import("./BaseWrapper").CeloTransactionObject<void>;
    /**
     * Marks the given hotfix approved by `sender`.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     * @notice Only the `approver` address will succeed in sending this transaction
     */
    approveHotfix: (args_0: Buffer) => import("./BaseWrapper").CeloTransactionObject<void>;
    /**
     * Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.
     * @param hash keccak256 hash of hotfix's associated abi encoded transactions
     */
    prepareHotfix: (args_0: Buffer) => import("./BaseWrapper").CeloTransactionObject<void>;
    /**
     * Executes a given sequence of transactions if the corresponding hash is prepared and approved.
     * @param hotfix Governance hotfix proposal
     * @param salt Secret which guarantees uniqueness of hash
     * @notice keccak256 hash of abi encoded transactions computed on-chain
     */
    executeHotfix: (proposal: Proposal, salt: Buffer) => import("./BaseWrapper").CeloTransactionObject<void>;
}

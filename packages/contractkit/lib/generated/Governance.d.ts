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
export interface Governance extends Contract {
    clone(): Governance;
    methods: {
        stageDurations(): TransactionObject<{
            approval: string;
            referendum: string;
            execution: string;
            0: string;
            1: string;
            2: string;
        }>;
        concurrentProposals(): TransactionObject<string>;
        validatorSignerAddressFromCurrentSet(index: number | string): TransactionObject<string>;
        approver(): TransactionObject<string>;
        initialized(): TransactionObject<boolean>;
        checkProofOfPossession(sender: string, blsKey: string | number[], blsPop: string | number[]): TransactionObject<boolean>;
        getEpochNumberOfBlock(blockNumber: number | string): TransactionObject<string>;
        minDeposit(): TransactionObject<string>;
        hotfixes(arg0: string | number[]): TransactionObject<{
            executed: boolean;
            approved: boolean;
            preparedEpoch: string;
            0: boolean;
            1: boolean;
            2: string;
        }>;
        getVerifiedSealBitmapFromHeader(header: string | number[]): TransactionObject<string>;
        validatorSignerAddressFromSet(index: number | string, blockNumber: number | string): TransactionObject<string>;
        refundedDeposits(arg0: string): TransactionObject<string>;
        hashHeader(header: string | number[]): TransactionObject<string>;
        renounceOwnership(): TransactionObject<void>;
        minQuorumSizeInCurrentSet(): TransactionObject<string>;
        dequeueFrequency(): TransactionObject<string>;
        registry(): TransactionObject<string>;
        numberValidatorsInCurrentSet(): TransactionObject<string>;
        getBlockNumberFromHeader(header: string | number[]): TransactionObject<string>;
        owner(): TransactionObject<string>;
        queueExpiry(): TransactionObject<string>;
        isOwner(): TransactionObject<boolean>;
        getEpochNumber(): TransactionObject<string>;
        numberValidatorsInSet(blockNumber: number | string): TransactionObject<string>;
        setRegistry(registryAddress: string): TransactionObject<void>;
        emptyIndices(arg0: number | string): TransactionObject<string>;
        dequeued(arg0: number | string): TransactionObject<string>;
        lastDequeue(): TransactionObject<string>;
        proposalCount(): TransactionObject<string>;
        getEpochSize(): TransactionObject<string>;
        minQuorumSize(blockNumber: number | string): TransactionObject<string>;
        fractionMulExp(aNumerator: number | string, aDenominator: number | string, bNumerator: number | string, bDenominator: number | string, exponent: number | string, _decimals: number | string): TransactionObject<{
            0: string;
            1: string;
        }>;
        transferOwnership(newOwner: string): TransactionObject<void>;
        getParentSealBitmap(blockNumber: number | string): TransactionObject<string>;
        initialize(registryAddress: string, _approver: string, _concurrentProposals: number | string, _minDeposit: number | string, _queueExpiry: number | string, _dequeueFrequency: number | string, approvalStageDuration: number | string, referendumStageDuration: number | string, executionStageDuration: number | string, participationBaseline: number | string, participationFloor: number | string, baselineUpdateFactor: number | string, baselineQuorumFactor: number | string): TransactionObject<void>;
        setApprover(_approver: string): TransactionObject<void>;
        setConcurrentProposals(_concurrentProposals: number | string): TransactionObject<void>;
        setMinDeposit(_minDeposit: number | string): TransactionObject<void>;
        setQueueExpiry(_queueExpiry: number | string): TransactionObject<void>;
        setDequeueFrequency(_dequeueFrequency: number | string): TransactionObject<void>;
        setApprovalStageDuration(approvalStageDuration: number | string): TransactionObject<void>;
        setReferendumStageDuration(referendumStageDuration: number | string): TransactionObject<void>;
        setExecutionStageDuration(executionStageDuration: number | string): TransactionObject<void>;
        setParticipationBaseline(participationBaseline: number | string): TransactionObject<void>;
        setParticipationFloor(participationFloor: number | string): TransactionObject<void>;
        setBaselineUpdateFactor(baselineUpdateFactor: number | string): TransactionObject<void>;
        setBaselineQuorumFactor(baselineQuorumFactor: number | string): TransactionObject<void>;
        setConstitution(destination: string, functionId: string | number[], threshold: number | string): TransactionObject<void>;
        propose(values: (number | string)[], destinations: string[], data: string | number[], dataLengths: (number | string)[], descriptionUrl: string): TransactionObject<string>;
        upvote(proposalId: number | string, lesser: number | string, greater: number | string): TransactionObject<boolean>;
        getProposalStage(proposalId: number | string): TransactionObject<string>;
        revokeUpvote(lesser: number | string, greater: number | string): TransactionObject<boolean>;
        approve(proposalId: number | string, index: number | string): TransactionObject<boolean>;
        vote(proposalId: number | string, index: number | string, value: number | string): TransactionObject<boolean>;
        execute(proposalId: number | string, index: number | string): TransactionObject<boolean>;
        approveHotfix(hash: string | number[]): TransactionObject<void>;
        isHotfixWhitelistedBy(hash: string | number[], whitelister: string): TransactionObject<boolean>;
        whitelistHotfix(hash: string | number[]): TransactionObject<void>;
        prepareHotfix(hash: string | number[]): TransactionObject<void>;
        executeHotfix(values: (number | string)[], destinations: string[], data: string | number[], dataLengths: (number | string)[], salt: string | number[]): TransactionObject<void>;
        withdraw(): TransactionObject<boolean>;
        isVoting(account: string): TransactionObject<boolean>;
        getApprovalStageDuration(): TransactionObject<string>;
        getReferendumStageDuration(): TransactionObject<string>;
        getExecutionStageDuration(): TransactionObject<string>;
        getParticipationParameters(): TransactionObject<{
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        proposalExists(proposalId: number | string): TransactionObject<boolean>;
        getProposal(proposalId: number | string): TransactionObject<{
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        }>;
        getProposalTransaction(proposalId: number | string, index: number | string): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        isApproved(proposalId: number | string): TransactionObject<boolean>;
        getVoteTotals(proposalId: number | string): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        getVoteRecord(account: string, index: number | string): TransactionObject<{
            0: string;
            1: string;
            2: string;
        }>;
        getQueueLength(): TransactionObject<string>;
        getUpvotes(proposalId: number | string): TransactionObject<string>;
        getQueue(): TransactionObject<{
            0: string[];
            1: string[];
        }>;
        getDequeue(): TransactionObject<string[]>;
        getUpvoteRecord(account: string): TransactionObject<{
            0: string;
            1: string;
        }>;
        getMostRecentReferendumProposal(account: string): TransactionObject<string>;
        hotfixWhitelistValidatorTally(hash: string | number[]): TransactionObject<string>;
        isHotfixPassing(hash: string | number[]): TransactionObject<boolean>;
        getHotfixRecord(hash: string | number[]): TransactionObject<{
            0: boolean;
            1: boolean;
            2: string;
        }>;
        dequeueProposalsIfReady(): TransactionObject<void>;
        isQueued(proposalId: number | string): TransactionObject<boolean>;
        isProposalPassing(proposalId: number | string): TransactionObject<boolean>;
        isDequeuedProposal(proposalId: number | string, index: number | string): TransactionObject<boolean>;
        isDequeuedProposalExpired(proposalId: number | string): TransactionObject<boolean>;
        isQueuedProposalExpired(proposalId: number | string): TransactionObject<boolean>;
        getConstitution(destination: string, functionId: string | number[]): TransactionObject<string>;
    };
    events: {
        ApproverSet: ContractEvent<string>;
        ConcurrentProposalsSet: ContractEvent<string>;
        MinDepositSet: ContractEvent<string>;
        QueueExpirySet: ContractEvent<string>;
        DequeueFrequencySet: ContractEvent<string>;
        ApprovalStageDurationSet: ContractEvent<string>;
        ReferendumStageDurationSet: ContractEvent<string>;
        ExecutionStageDurationSet: ContractEvent<string>;
        ConstitutionSet: ContractEvent<{
            destination: string;
            functionId: string;
            threshold: string;
            0: string;
            1: string;
            2: string;
        }>;
        ProposalQueued: ContractEvent<{
            proposalId: string;
            proposer: string;
            transactionCount: string;
            deposit: string;
            timestamp: string;
            0: string;
            1: string;
            2: string;
            3: string;
            4: string;
        }>;
        ProposalUpvoted: ContractEvent<{
            proposalId: string;
            account: string;
            upvotes: string;
            0: string;
            1: string;
            2: string;
        }>;
        ProposalUpvoteRevoked: ContractEvent<{
            proposalId: string;
            account: string;
            revokedUpvotes: string;
            0: string;
            1: string;
            2: string;
        }>;
        ProposalDequeued: ContractEvent<{
            proposalId: string;
            timestamp: string;
            0: string;
            1: string;
        }>;
        ProposalApproved: ContractEvent<string>;
        ProposalVoted: ContractEvent<{
            proposalId: string;
            account: string;
            value: string;
            weight: string;
            0: string;
            1: string;
            2: string;
            3: string;
        }>;
        ProposalExecuted: ContractEvent<string>;
        ProposalExpired: ContractEvent<string>;
        ParticipationBaselineUpdated: ContractEvent<string>;
        ParticipationFloorSet: ContractEvent<string>;
        ParticipationBaselineUpdateFactorSet: ContractEvent<string>;
        ParticipationBaselineQuorumFactorSet: ContractEvent<string>;
        HotfixWhitelisted: ContractEvent<{
            hash: string;
            whitelister: string;
            0: string;
            1: string;
        }>;
        HotfixApproved: ContractEvent<string>;
        HotfixPrepared: ContractEvent<{
            hash: string;
            epoch: string;
            0: string;
            1: string;
        }>;
        HotfixExecuted: ContractEvent<string>;
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
export declare function newGovernance(web3: Web3, address: string): Governance;
export {};

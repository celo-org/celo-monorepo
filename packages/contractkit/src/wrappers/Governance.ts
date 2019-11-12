import BigNumber from 'bignumber.js'
import { Transaction } from 'web3/eth/types'

import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'

import { Address } from '../base'
import { Governance } from '../generated/types/Governance'
import {
  BaseWrapper,
  bufferToString,
  fromSolidityBytes,
  identity,
  NumberLike,
  numberLikeToBigNumber,
  numberLikeToInt,
  numberLikeToString,
  proxyCall,
  proxySend,
  stringToBuffer,
  toSolidityBytes,
  toTransactionObject,
  tupleParser,
} from './BaseWrapper'

export enum ProposalStage {
  None = 'None',
  Queued = 'Queued',
  Approval = 'Approval',
  Referendum = 'Referendum',
  Execution = 'Execution',
  Expiration = 'Expiration',
}

export interface ProposalStageDurations {
  [ProposalStage.Approval]: BigNumber // seconds
  [ProposalStage.Referendum]: BigNumber // seconds
  [ProposalStage.Execution]: BigNumber // seconds
}

export interface GovernanceConfig {
  concurrentProposals: BigNumber
  dequeueFrequency: BigNumber // seconds
  minDeposit: BigNumber
  queueExpiry: BigNumber
  stageDurations: ProposalStageDurations
}

export interface ProposalMetadata {
  proposer: Address
  deposit: BigNumber
  timestamp: BigNumber
  transactionCount: number
}

export type ProposalTransaction = Pick<Transaction, 'to' | 'input' | 'value'>
export type ProposalParams = Parameters<Governance['methods']['propose']>
export class Proposal {
  constructor(public readonly transactions: ProposalTransaction[]) {}
  get params(): ProposalParams {
    return [
      this.transactions.map((tx) => tx.value),
      this.transactions.map((tx) => tx.to),
      toSolidityBytes(Buffer.concat(this.transactions.map((tx) => stringToBuffer(tx.input)))),
      this.transactions.map((tx) => tx.input.length),
    ]
  }
}

export interface ProposalRecord {
  stage: ProposalStage
  metadata: ProposalMetadata
  upvotes: BigNumber
  votes: Votes
  proposal: Proposal
}

export interface UpvoteRecord {
  proposalID: BigNumber
  upvotes: BigNumber
}

export enum VoteValue {
  None = 0,
  Abstain,
  No,
  Yes,
}
export interface Votes {
  [VoteValue.Yes]: BigNumber
  [VoteValue.No]: BigNumber
  [VoteValue.Abstain]: BigNumber
}

export interface HotfixRecord {
  hash: Buffer
  approved: boolean
  executed: boolean
  preparedEpoch: BigNumber
}

const ZERO_BN = new BigNumber(0)

/**
 * Contract managing voting for governance proposals.
 */
export class GovernanceWrapper extends BaseWrapper<Governance> {
  /**
   * Querying number of possible concurrent proposals.
   * @returns Current number of possible concurrent proposals.
   */
  concurrentProposals = proxyCall(
    this.contract.methods.concurrentProposals,
    undefined,
    numberLikeToBigNumber
  )
  /**
   * Query proposal dequeue frequency.
   * @returns Current proposal dequeue frequency in seconds.
   */
  dequeueFrequency = proxyCall(
    this.contract.methods.dequeueFrequency,
    undefined,
    numberLikeToBigNumber
  )
  /**
   * Query minimum deposit required to make a proposal.
   * @returns Current minimum deposit.
   */
  minDeposit = proxyCall(this.contract.methods.minDeposit, undefined, numberLikeToBigNumber)
  /**
   * Query queue expiry parameter.
   * @return The number of seconds a proposal can stay in the queue before expiring.
   */
  queueExpiry = proxyCall(this.contract.methods.queueExpiry, undefined, numberLikeToBigNumber)
  /**
   * Query durations of different stages in proposal lifecycle.
   * @returns Durations for approval, referendum and execution stages in seconds.
   */
  async stageDurations(): Promise<ProposalStageDurations> {
    const res = await this.contract.methods.stageDurations().call()
    return {
      [ProposalStage.Approval]: numberLikeToBigNumber(res[0]),
      [ProposalStage.Referendum]: numberLikeToBigNumber(res[1]),
      [ProposalStage.Execution]: numberLikeToBigNumber(res[2]),
    }
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<GovernanceConfig> {
    const res = await Promise.all([
      this.concurrentProposals(),
      this.dequeueFrequency(),
      this.minDeposit(),
      this.queueExpiry(),
      this.stageDurations(),
    ])
    return {
      concurrentProposals: res[0],
      dequeueFrequency: res[1],
      minDeposit: res[2],
      queueExpiry: res[3],
      stageDurations: res[4],
    }
  }

  /**
   * Returns the metadata associated with a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getProposalMetadata: (proposalID: NumberLike) => Promise<ProposalMetadata> = proxyCall(
    this.contract.methods.getProposal,
    tupleParser(numberLikeToString),
    (res) => ({
      proposer: res[0],
      deposit: numberLikeToBigNumber(res[1]),
      timestamp: numberLikeToBigNumber(res[2]),
      transactionCount: numberLikeToInt(res[3]),
    })
  )

  /**
   * Returns the transaction at the given index associated with a given proposal.
   * @param proposalID Governance proposal UUID
   * @param txIndex Transaction index
   */
  getProposalTransaction: (
    proposalID: NumberLike,
    txIndex: number
  ) => Promise<ProposalTransaction> = proxyCall(
    this.contract.methods.getProposalTransaction,
    tupleParser(numberLikeToString, numberLikeToString),
    (res) => ({
      value: res[0],
      to: res[1],
      input: fromSolidityBytes(res[2]),
    })
  )

  /**
   * Returns whether a given proposal is approved.
   * @param proposalID Governance proposal UUID
   */
  isApproved: (proposalID: NumberLike) => Promise<boolean> = proxyCall(
    this.contract.methods.isApproved,
    tupleParser(numberLikeToString)
  )

  /**
   * Returns the approver address for proposals and hotfixes.
   */
  getApprover = proxyCall(this.contract.methods.approver)

  getProposalStage = proxyCall(
    this.contract.methods.getProposalStage,
    tupleParser(numberLikeToString),
    (res) => Object.keys(ProposalStage)[numberLikeToInt(res)] as ProposalStage
  )

  /**
   * Returns the proposal associated with a given id.
   * @param proposalID Governance proposal UUID
   */
  async getProposal(proposalID: NumberLike): Promise<Proposal> {
    const metadata = await this.getProposalMetadata(proposalID)
    const txIndices = Array.from(Array(metadata.transactionCount).keys())
    const transactions = await concurrentMap(1, txIndices, (idx) =>
      this.getProposalTransaction(proposalID, idx)
    )
    return new Proposal(transactions)
  }

  /**
   * Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.
   * @param proposalID Governance proposal UUID
   */
  async getProposalRecord(proposalID: NumberLike): Promise<ProposalRecord> {
    const metadata = await this.getProposalMetadata(proposalID)
    const proposal = await this.getProposal(proposalID)
    const stage = await this.getProposalStage(proposalID)

    let upvotes = ZERO_BN
    let votes = { [VoteValue.Yes]: ZERO_BN, [VoteValue.No]: ZERO_BN, [VoteValue.Abstain]: ZERO_BN }
    if (stage === ProposalStage.Queued) {
      upvotes = await this.getUpvotes(proposalID)
    } else if (stage >= ProposalStage.Referendum && stage < ProposalStage.Expiration) {
      votes = await this.getVotes(proposalID)
    }

    return {
      proposal,
      metadata,
      stage,
      upvotes,
      votes,
    }
  }

  /**
   * Returns whether a given proposal is passing relative to the constitution's threshold.
   * @param proposalID Governance proposal UUID
   */
  isProposalPassing = proxyCall(
    this.contract.methods.isProposalPassing,
    tupleParser(numberLikeToString)
  )

  /**
   * Submits a new governance proposal.
   * @param proposal Governance proposal
   */
  propose = proxySend(
    this.kit,
    this.contract.methods.propose,
    (proposal: Proposal) => proposal.params
  )

  /**
   * Returns whether a governance proposal exists with the given ID.
   * @param proposalID Governance proposal UUID
   */
  proposalExists: (proposalID: NumberLike) => Promise<boolean> = proxyCall(
    this.contract.methods.proposalExists,
    tupleParser(numberLikeToString)
  )

  /**
   * Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).
   * @param upvoter Address of upvoter
   */
  getUpvoteRecord: (upvoter: Address) => Promise<UpvoteRecord> = proxyCall(
    this.contract.methods.getUpvoteRecord,
    tupleParser(identity),
    (o) => ({
      proposalID: numberLikeToBigNumber(o[0]),
      upvotes: numberLikeToBigNumber(o[1]),
    })
  )

  /**
   * Returns whether a given proposal is queued.
   * @param proposalID Governance proposal UUID
   */
  isQueued = proxyCall(this.contract.methods.isQueued, tupleParser(numberLikeToString))

  /**
   * Returns the upvotes applied to a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getUpvotes = proxyCall(
    this.contract.methods.getUpvotes,
    tupleParser(numberLikeToString),
    numberLikeToBigNumber
  )

  /**
   * Returns the yes, no, and abstain votes applied to a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getVotes = proxyCall(
    this.contract.methods.getVoteTotals,
    tupleParser(numberLikeToString),
    (res): Votes => ({
      [VoteValue.Yes]: numberLikeToBigNumber(res[0]),
      [VoteValue.No]: numberLikeToBigNumber(res[1]),
      [VoteValue.Abstain]: numberLikeToBigNumber(res[2]),
    })
  )

  /**
   * Returns the proposal queue as list of upvote records.
   */
  getQueue = proxyCall(this.contract.methods.getQueue, undefined, (arraysObject) =>
    zip<string, string, UpvoteRecord>(
      (_id, _upvotes) => ({
        proposalID: numberLikeToBigNumber(_id),
        upvotes: numberLikeToBigNumber(_upvotes),
      }),
      arraysObject[0],
      arraysObject[1]
    )
  )

  /**
   * Returns the proposal dequeue as list of proposal IDs.
   */
  getDequeue = proxyCall(this.contract.methods.getDequeue, undefined, (arrayObject) =>
    arrayObject.map(numberLikeToBigNumber)
  )

  /**
   * Dequeues any queued proposals if `dequeueFrequency` seconds have elapsed since the last dequeue
   */
  dequeueProposalsIfReady = proxySend(this.kit, this.contract.methods.dequeueProposalsIfReady)

  /**
   * Returns the number of votes that will be applied to a proposal for a given voter.
   * @param voter Address of voter
   */
  async getVoteWeight(voter: Address) {
    const lockedGoldContract = await this.kit.contracts.getLockedGold()
    return lockedGoldContract.getAccountTotalLockedGold(voter)
  }

  private async getDequeueIndex(proposalID: NumberLike) {
    const dequeue = await this.getDequeue()
    const index = dequeue.findIndex((d) => d.isEqualTo(proposalID))
    if (index === -1) {
      throw new Error(`Proposal ${proposalID} not in dequeue`)
    }
    return index
  }

  // TODO: merge with SortedOracles/Election findLesserAndGreater
  // proposalID is zero for revokes
  private async findLesserAndGreaterAfterUpvote(proposalID: NumberLike, upvoter: Address) {
    let queue = await this.getQueue()
    let searchID: NumberLike = ZERO_BN

    const upvoteRecord = await this.getUpvoteRecord(upvoter)
    // does upvoter have a previous upvote?
    if (upvoteRecord.proposalID.isGreaterThan(ZERO_BN)) {
      const proposalIdx = queue.findIndex((qp) => qp.proposalID.isEqualTo(upvoteRecord.proposalID))
      // is previous upvote in queue?
      if (proposalIdx !== -1) {
        queue[proposalIdx].upvotes = queue[proposalIdx].upvotes.minus(upvoteRecord.upvotes)
        searchID = upvoteRecord.proposalID
      }
    }

    // is upvoter targeting a valid proposal?
    if (ZERO_BN.isLessThan(proposalID)) {
      const proposalIdx = queue.findIndex((qp) => qp.proposalID.isEqualTo(proposalID))
      // is target proposal in queue?
      if (proposalIdx !== -1) {
        const weight = await this.getVoteWeight(upvoter)
        queue[proposalIdx].upvotes = queue[proposalIdx].upvotes.plus(weight)
        searchID = proposalID
      } else {
        throw new Error(`Proposal ${proposalID} not in queue`)
      }
    }

    queue = queue.sort((a, b) => a.upvotes.comparedTo(b.upvotes))
    const newIdx = queue.findIndex((qp) => qp.proposalID.isEqualTo(searchID))

    return {
      lesserID: newIdx === 0 ? ZERO_BN : queue[newIdx - 1].proposalID,
      greaterID: newIdx === queue.length - 1 ? ZERO_BN : queue[newIdx + 1].proposalID,
    }
  }

  /**
   * Applies provided upvoter's upvote to given proposal.
   * @param proposalID Governance proposal UUID
   * @param upvoter Address of upvoter
   */
  async upvote(proposalID: NumberLike, upvoter: Address) {
    const exists = await this.proposalExists(proposalID)
    if (!exists) {
      throw new Error(`Proposal ${proposalID} does not exist`)
    }
    const { lesserID, greaterID } = await this.findLesserAndGreaterAfterUpvote(proposalID, upvoter)
    return toTransactionObject(
      this.kit,
      this.contract.methods.upvote(
        numberLikeToString(proposalID),
        numberLikeToString(lesserID),
        numberLikeToString(greaterID)
      )
    )
  }

  /**
   * Revokes provided upvoter's upvote.
   * @param upvoter Address of upvoter
   */
  async revokeUpvote(upvoter: Address) {
    const { proposalID } = await this.getUpvoteRecord(upvoter)
    if (ZERO_BN.isEqualTo(proposalID)) {
      throw new Error(`Voter ${upvoter} has no upvote to revoke`)
    }
    const { lesserID, greaterID } = await this.findLesserAndGreaterAfterUpvote(ZERO_BN, upvoter)
    return toTransactionObject(
      this.kit,
      this.contract.methods.revokeUpvote(
        numberLikeToString(lesserID),
        numberLikeToString(greaterID)
      )
    )
  }

  /**
   * Approves given proposal, allowing it to later move to `referendum`.
   * @param proposalID Governance proposal UUID
   * @notice Only the `approver` address will succeed in sending this transaction
   */
  async approve(proposalID: NumberLike) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.approve(numberLikeToString(proposalID), proposalIndex)
    )
  }

  /**
   * Applies `sender`'s vote choice to a given proposal.
   * @param proposalID Governance proposal UUID
   * @param vote Choice to apply (yes, no, abstain)
   */
  async vote(proposalID: NumberLike, vote: VoteValue) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.vote(numberLikeToString(proposalID), proposalIndex, vote)
    )
  }

  /**
   * Returns `voter`'s vote choice on a given proposal.
   * @param proposalID Governance proposal UUID
   * @param voter Address of voter
   */
  async getVoteValue(proposalID: NumberLike, voter: Address) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    const res = await this.contract.methods.getVoteRecord(voter, proposalIndex).call()
    return numberLikeToInt(res[1]) as VoteValue
  }

  /**
   * Executes a given proposal's associated transactions.
   * @param proposalID Governance proposal UUID
   */
  async execute(proposalID: NumberLike) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.execute(numberLikeToString(proposalID), proposalIndex)
    )
  }

  /**
   * Returns approved, executed, and prepared status associated with a given hotfix.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  async getHotfixRecord(hash: Buffer): Promise<HotfixRecord> {
    const res = await this.contract.methods.getHotfixRecord(bufferToString(hash)).call()
    return {
      hash,
      approved: res[0],
      executed: res[1],
      preparedEpoch: numberLikeToBigNumber(res[2]),
    }
  }

  /**
   * Returns whether a given hotfix has been whitelisted by a given address.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   * @param whitelister address of whitelister
   */
  isHotfixWhitelistedBy = proxyCall(
    this.contract.methods.isHotfixWhitelistedBy,
    tupleParser(bufferToString, (s: Address) => identity<Address>(s))
  )

  /**
   * Marks the given hotfix whitelisted by `sender`.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  whitelistHotfix = proxySend(
    this.kit,
    this.contract.methods.whitelistHotfix,
    tupleParser(bufferToString)
  )

  /**
   * Marks the given hotfix approved by `sender`.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   * @notice Only the `approver` address will succeed in sending this transaction
   */
  approveHotfix = proxySend(
    this.kit,
    this.contract.methods.approveHotfix,
    tupleParser(bufferToString)
  )

  /**
   * Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  prepareHotfix = proxySend(
    this.kit,
    this.contract.methods.prepareHotfix,
    tupleParser(bufferToString)
  )

  /**
   * Executes a given sequence of transactions if the corresponding hash is prepared and approved.
   * @param hotfix Governance hotfix proposal
   * @notice keccak256 hash of abi encoded transactions computed on-chain
   */
  executeHotfix = proxySend(
    this.kit,
    this.contract.methods.executeHotfix,
    (hotfix: Proposal) => hotfix.params
  )
}

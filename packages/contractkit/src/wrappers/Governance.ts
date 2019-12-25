import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { Transaction } from 'web3/eth/types'
import { Address } from '../base'
import { Governance } from '../generated/types/Governance'
import {
  BaseWrapper,
  bufferToBytes,
  bufferToString,
  bytesToString,
  identity,
  proxyCall,
  proxySend,
  stringToBuffer,
  toTransactionObject,
  tupleParser,
  valueToBigNumber,
  valueToInt,
  valueToString,
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

export type ProposalParams = Parameters<Governance['methods']['propose']>
export type ProposalTransaction = Pick<Transaction, 'to' | 'input' | 'value'>
export type Proposal = ProposalTransaction[]

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
  None = 'NONE',
  Abstain = 'Abstain',
  No = 'No',
  Yes = 'Yes',
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
    valueToBigNumber
  )
  /**
   * Query proposal dequeue frequency.
   * @returns Current proposal dequeue frequency in seconds.
   */
  dequeueFrequency = proxyCall(this.contract.methods.dequeueFrequency, undefined, valueToBigNumber)
  /**
   * Query minimum deposit required to make a proposal.
   * @returns Current minimum deposit.
   */
  minDeposit = proxyCall(this.contract.methods.minDeposit, undefined, valueToBigNumber)
  /**
   * Query queue expiry parameter.
   * @return The number of seconds a proposal can stay in the queue before expiring.
   */
  queueExpiry = proxyCall(this.contract.methods.queueExpiry, undefined, valueToBigNumber)
  /**
   * Query durations of different stages in proposal lifecycle.
   * @returns Durations for approval, referendum and execution stages in seconds.
   */
  async stageDurations(): Promise<ProposalStageDurations> {
    const res = await this.contract.methods.stageDurations().call()
    return {
      [ProposalStage.Approval]: valueToBigNumber(res[0]),
      [ProposalStage.Referendum]: valueToBigNumber(res[1]),
      [ProposalStage.Execution]: valueToBigNumber(res[2]),
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
  getProposalMetadata: (proposalID: BigNumber.Value) => Promise<ProposalMetadata> = proxyCall(
    this.contract.methods.getProposal,
    tupleParser(valueToString),
    (res) => ({
      proposer: res[0],
      deposit: valueToBigNumber(res[1]),
      timestamp: valueToBigNumber(res[2]),
      transactionCount: valueToInt(res[3]),
    })
  )

  /**
   * Returns the transaction at the given index associated with a given proposal.
   * @param proposalID Governance proposal UUID
   * @param txIndex Transaction index
   */
  getProposalTransaction: (
    proposalID: BigNumber.Value,
    txIndex: number
  ) => Promise<ProposalTransaction> = proxyCall(
    this.contract.methods.getProposalTransaction,
    tupleParser(valueToString, valueToString),
    (res) => ({
      value: res[0],
      to: res[1],
      input: bytesToString(res[2]),
    })
  )

  static toParams = (proposal: Proposal): ProposalParams => {
    const data = proposal.map((tx) => stringToBuffer(tx.input))
    return [
      proposal.map((tx) => tx.value),
      proposal.map((tx) => tx.to),
      bufferToBytes(Buffer.concat(data)),
      data.map((inp) => inp.length),
    ]
  }

  /**
   * Returns whether a given proposal is approved.
   * @param proposalID Governance proposal UUID
   */
  isApproved: (proposalID: BigNumber.Value) => Promise<boolean> = proxyCall(
    this.contract.methods.isApproved,
    tupleParser(valueToString)
  )

  /**
   * Returns the approver address for proposals and hotfixes.
   */
  getApprover = proxyCall(this.contract.methods.approver)

  getProposalStage = proxyCall(
    this.contract.methods.getProposalStage,
    tupleParser(valueToString),
    (res) => Object.keys(ProposalStage)[valueToInt(res)] as ProposalStage
  )

  /**
   * Returns the proposal associated with a given id.
   * @param proposalID Governance proposal UUID
   */
  async getProposal(proposalID: BigNumber.Value): Promise<Proposal> {
    const metadata = await this.getProposalMetadata(proposalID)
    const txIndices = Array.from(Array(metadata.transactionCount).keys())
    return concurrentMap(4, txIndices, (idx) => this.getProposalTransaction(proposalID, idx))
  }

  /**
   * Returns the stage, metadata, upvotes, votes, and transactions associated with a given proposal.
   * @param proposalID Governance proposal UUID
   */
  async getProposalRecord(proposalID: BigNumber.Value): Promise<ProposalRecord> {
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
  isProposalPassing = proxyCall(this.contract.methods.isProposalPassing, tupleParser(valueToString))

  /**
   * Submits a new governance proposal.
   * @param proposal Governance proposal
   */
  propose = proxySend(this.kit, this.contract.methods.propose, GovernanceWrapper.toParams)

  /**
   * Returns whether a governance proposal exists with the given ID.
   * @param proposalID Governance proposal UUID
   */
  proposalExists: (proposalID: BigNumber.Value) => Promise<boolean> = proxyCall(
    this.contract.methods.proposalExists,
    tupleParser(valueToString)
  )

  /**
   * Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).
   * @param upvoter Address of upvoter
   */
  getUpvoteRecord: (upvoter: Address) => Promise<UpvoteRecord> = proxyCall(
    this.contract.methods.getUpvoteRecord,
    tupleParser(identity),
    (o) => ({
      proposalID: valueToBigNumber(o[0]),
      upvotes: valueToBigNumber(o[1]),
    })
  )

  /**
   * Returns whether a given proposal is queued.
   * @param proposalID Governance proposal UUID
   */
  isQueued = proxyCall(this.contract.methods.isQueued, tupleParser(valueToString))

  /**
   * Returns the upvotes applied to a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getUpvotes = proxyCall(
    this.contract.methods.getUpvotes,
    tupleParser(valueToString),
    valueToBigNumber
  )

  /**
   * Returns the yes, no, and abstain votes applied to a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getVotes = proxyCall(
    this.contract.methods.getVoteTotals,
    tupleParser(valueToString),
    (res): Votes => ({
      [VoteValue.Yes]: valueToBigNumber(res[0]),
      [VoteValue.No]: valueToBigNumber(res[1]),
      [VoteValue.Abstain]: valueToBigNumber(res[2]),
    })
  )

  /**
   * Returns the proposal queue as list of upvote records.
   */
  getQueue = proxyCall(this.contract.methods.getQueue, undefined, (arraysObject) =>
    zip<string, string, UpvoteRecord>(
      (_id, _upvotes) => ({
        proposalID: valueToBigNumber(_id),
        upvotes: valueToBigNumber(_upvotes),
      }),
      arraysObject[0],
      arraysObject[1]
    )
  )

  /**
   * Returns the proposal dequeue as list of proposal IDs.
   */
  getDequeue = proxyCall(this.contract.methods.getDequeue, undefined, (arrayObject) =>
    arrayObject.map(valueToBigNumber)
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

  private getIndex(id: BigNumber.Value, array: BigNumber[]) {
    const index = array.findIndex((bn) => bn.isEqualTo(id))
    if (index === -1) {
      throw new Error(`ID ${id} not found in array ${array}`)
    }
    return index
  }

  private async getDequeueIndex(proposalID: BigNumber.Value, dequeue?: BigNumber[]) {
    if (!dequeue) {
      dequeue = await this.getDequeue()
    }
    return this.getIndex(proposalID, dequeue)
  }

  private async getQueueIndex(proposalID: BigNumber.Value, queue?: UpvoteRecord[]) {
    if (!queue) {
      queue = await this.getQueue()
    }
    return { index: this.getIndex(proposalID, queue.map((record) => record.proposalID)), queue }
  }

  private async lesserAndGreater(proposalID: BigNumber.Value, _queue?: UpvoteRecord[]) {
    const { index, queue } = await this.getQueueIndex(proposalID, _queue)
    return {
      lesserID: index === 0 ? ZERO_BN : queue[index - 1].proposalID,
      greaterID: index === queue.length - 1 ? ZERO_BN : queue[index + 1].proposalID,
    }
  }

  private sortedQueue(queue: UpvoteRecord[]) {
    return queue.sort((a, b) => a.upvotes.comparedTo(b.upvotes))
  }

  private async withUpvoteRevoked(upvoter: Address, _queue?: UpvoteRecord[]) {
    const upvoteRecord = await this.getUpvoteRecord(upvoter)
    const { index, queue } = await this.getQueueIndex(upvoteRecord.proposalID, _queue)
    queue[index].upvotes = queue[index].upvotes.minus(upvoteRecord.upvotes)
    return {
      queue: this.sortedQueue(queue),
      upvoteRecord,
    }
  }

  private async withUpvoteApplied(
    upvoter: Address,
    proposalID: BigNumber.Value,
    _queue?: UpvoteRecord[]
  ) {
    const { index, queue } = await this.getQueueIndex(proposalID, _queue)
    const weight = await this.getVoteWeight(upvoter)
    queue[index].upvotes = queue[index].upvotes.plus(weight)
    return this.sortedQueue(queue)
  }

  private async lesserAndGreaterAfterRevoke(upvoter: Address) {
    const { queue, upvoteRecord } = await this.withUpvoteRevoked(upvoter)
    return this.lesserAndGreater(upvoteRecord.proposalID, queue)
  }

  private async lesserAndGreaterAfterUpvote(upvoter: Address, proposalID: BigNumber.Value) {
    const upvoteRecord = await this.getUpvoteRecord(upvoter)
    const queue = upvoteRecord.proposalID.isZero()
      ? await this.getQueue()
      : (await this.withUpvoteRevoked(upvoter)).queue
    const upvoteQueue = await this.withUpvoteApplied(upvoter, proposalID, queue)
    return this.lesserAndGreater(proposalID, upvoteQueue)
  }

  /**
   * Applies provided upvoter's upvote to given proposal.
   * @param proposalID Governance proposal UUID
   * @param upvoter Address of upvoter
   */
  async upvote(proposalID: BigNumber.Value, upvoter: Address) {
    const { lesserID, greaterID } = await this.lesserAndGreaterAfterUpvote(upvoter, proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.upvote(
        valueToString(proposalID),
        valueToString(lesserID),
        valueToString(greaterID)
      )
    )
  }

  /**
   * Revokes provided upvoter's upvote.
   * @param upvoter Address of upvoter
   */
  async revokeUpvote(upvoter: Address) {
    const { lesserID, greaterID } = await this.lesserAndGreaterAfterRevoke(upvoter)
    return toTransactionObject(
      this.kit,
      this.contract.methods.revokeUpvote(valueToString(lesserID), valueToString(greaterID))
    )
  }

  /**
   * Approves given proposal, allowing it to later move to `referendum`.
   * @param proposalID Governance proposal UUID
   * @notice Only the `approver` address will succeed in sending this transaction
   */
  async approve(proposalID: BigNumber.Value) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.approve(valueToString(proposalID), proposalIndex)
    )
  }

  /**
   * Applies `sender`'s vote choice to a given proposal.
   * @param proposalID Governance proposal UUID
   * @param vote Choice to apply (yes, no, abstain)
   */
  async vote(proposalID: BigNumber.Value, vote: keyof typeof VoteValue) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    const voteNum = Object.keys(VoteValue).indexOf(vote)
    return toTransactionObject(
      this.kit,
      this.contract.methods.vote(valueToString(proposalID), proposalIndex, voteNum)
    )
  }

  /**
   * Returns `voter`'s vote choice on a given proposal.
   * @param proposalID Governance proposal UUID
   * @param voter Address of voter
   */
  async getVoteValue(proposalID: BigNumber.Value, voter: Address) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    const res = await this.contract.methods.getVoteRecord(voter, proposalIndex).call()
    return Object.keys(VoteValue)[valueToInt(res[1])] as VoteValue
  }

  /**
   * Executes a given proposal's associated transactions.
   * @param proposalID Governance proposal UUID
   */
  async execute(proposalID: BigNumber.Value) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.execute(valueToString(proposalID), proposalIndex)
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
      preparedEpoch: valueToBigNumber(res[2]),
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
   * Returns whether a given hotfix can be passed.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  isHotfixPassing = proxyCall(this.contract.methods.isHotfixPassing, tupleParser(bufferToString))

  /**
   * Returns the number of validators that whitelisted the hotfix
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  hotfixWhitelistValidatorTally = proxyCall(
    this.contract.methods.hotfixWhitelistValidatorTally,
    tupleParser(bufferToString)
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
    GovernanceWrapper.toParams
  )
}

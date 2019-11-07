import BigNumber from 'bignumber.js'

import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'

import { Address } from '../base'
import { Governance } from '../generated/types/Governance'
import {
  BaseWrapper,
  CeloTransactionObject,
  identity,
  NumberLike,
  parseBuffer,
  parseBytes,
  parseNumber,
  proxyCall,
  proxySend,
  toBigNumber,
  toBuffer,
  toNumber,
  toTransactionObject,
  tupleParser,
} from './BaseWrapper'

export interface Transaction {
  value: NumberLike
  destination: Address
  data: Buffer
}

export interface StageDurations {
  approval: BigNumber // seconds
  referendum: BigNumber // seconds
  execution: BigNumber // seconds
}

export interface GovernanceConfig {
  concurrentProposals: BigNumber
  dequeueFrequency: BigNumber // seconds
  minDeposit: BigNumber
  queueExpiry: BigNumber // seconds
  stageDurations: StageDurations
}

export interface ProposalMetadata {
  proposer: Address
  deposit: BigNumber
  timestamp: BigNumber
  transactionCount: number
}

export interface Proposal {
  metadata: ProposalMetadata
  transactions: Transaction[]
}
export enum VoteValue {
  None,
  Abstain,
  No,
  Yes,
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
  concurrentProposals = proxyCall(this.contract.methods.concurrentProposals, undefined, toBigNumber)
  /**
   * Query proposal dequeue frequency.
   * @returns Current proposal dequeue frequency in seconds.
   */
  dequeueFrequency = proxyCall(this.contract.methods.dequeueFrequency, undefined, toBigNumber)
  /**
   * Query minimum deposit required to make a proposal.
   * @returns Current minimum deposit.
   */
  minDeposit = proxyCall(this.contract.methods.minDeposit, undefined, toBigNumber)
  /**
   * Query queue expiry parameter.
   * @return The number of seconds a proposal can stay in the queue before expiring.
   */
  queueExpiry = proxyCall(this.contract.methods.queueExpiry, undefined, toBigNumber)
  /**
   * Query durations of different stages in proposal lifecycle.
   * @returns Durations for approval, referendum and execution stages in seconds.
   */
  async stageDurations(): Promise<StageDurations> {
    const res = await this.contract.methods.stageDurations().call()
    return {
      approval: toBigNumber(res[0]),
      referendum: toBigNumber(res[1]),
      execution: toBigNumber(res[2]),
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

  getProposalMetadata: (proposalID: NumberLike) => Promise<ProposalMetadata> = proxyCall(
    this.contract.methods.getProposal,
    tupleParser(parseNumber),
    (res) => ({
      proposer: res[0],
      deposit: toBigNumber(res[1]),
      timestamp: toBigNumber(res[2]),
      transactionCount: toNumber(res[3]),
    })
  )

  getProposalTransaction: (
    proposalID: NumberLike,
    txIndex: number
  ) => Promise<Transaction> = proxyCall(
    this.contract.methods.getProposalTransaction,
    tupleParser(parseNumber, parseNumber),
    (res) => ({
      value: toBigNumber(res[0]),
      destination: res[1],
      data: toBuffer(res[2]),
    })
  )

  isApproved: (proposalID: NumberLike) => Promise<boolean> = proxyCall(
    this.contract.methods.isApproved,
    tupleParser(parseNumber)
  )

  getApprover = proxyCall(this.contract.methods.approver)

  async getProposal(proposalID: NumberLike): Promise<Proposal> {
    const metadata = await this.getProposalMetadata(proposalID)
    const txIndices = Array.from(Array(metadata.transactionCount).keys())
    const transactions = await concurrentMap(metadata.transactionCount, txIndices, (txIndex) =>
      this.getProposalTransaction(proposalID, txIndex)
    )

    return {
      metadata,
      transactions,
    }
  }

  propose(transactions: Transaction[]) {
    const enc = encodedTransactions(transactions)
    return toTransactionObject(
      this.kit,
      this.contract.methods.propose(enc.values, enc.destinations, enc.data, enc.dataLengths)
    )
  }

  proposalExists: (proposalID: NumberLike) => Promise<boolean> = proxyCall(
    this.contract.methods.proposalExists,
    tupleParser(parseNumber)
  )

  getUpvoteRecord: (upvoter: Address) => Promise<{ id: BigNumber; weight: BigNumber }> = proxyCall(
    this.contract.methods.getUpvoteRecord,
    tupleParser(identity),
    (o) => ({
      id: toBigNumber(o[0]),
      weight: toBigNumber(o[1]),
    })
  )

  isQueued = proxyCall(this.contract.methods.isQueued, tupleParser(parseNumber), identity)

  getUpvotes = proxyCall(this.contract.methods.getUpvotes, tupleParser(parseNumber), toBigNumber)

  getVotes = proxyCall(this.contract.methods.getVoteTotals, tupleParser(parseNumber), (o) => ({
    yes: toBigNumber(o[0]),
    no: toBigNumber(o[1]),
    abstain: toBigNumber(o[2]),
  }))

  getQueue = proxyCall(this.contract.methods.getQueue, undefined, (arraysObject) =>
    zip<string, string, { id: BigNumber; upvotes: BigNumber }>(
      (_id, _upvotes) => ({
        id: toBigNumber(_id),
        upvotes: toBigNumber(_upvotes),
      }),
      arraysObject[0],
      arraysObject[1]
    )
  )

  getDequeue = proxyCall(this.contract.methods.getDequeue, undefined, (arrayObject) =>
    arrayObject.map(toBigNumber)
  )

  dequeueProposalsIfReady = proxySend(this.kit, this.contract.methods.dequeueProposalsIfReady)

  async getVoteWeight(voter: Address) {
    const lockedGoldContract = await this.kit.contracts.getLockedGold()
    return lockedGoldContract.getAccountTotalLockedGold(voter)
  }

  private async getDequeueIndex(proposalID: NumberLike) {
    const dequeue = await this.getDequeue()
    const index = dequeue.findIndex((d) => d.isEqualTo(proposalID))
    if (index === -1) {
      throw new Error(`Proposal ${parseNumber(proposalID)} not in dequeue`)
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
    if (upvoteRecord.id.isGreaterThan(ZERO_BN)) {
      const proposalIdx = queue.findIndex((qp) => qp.id.isEqualTo(upvoteRecord.id))
      // is previous upvote in queue?
      if (proposalIdx !== -1) {
        queue[proposalIdx].upvotes = queue[proposalIdx].upvotes.minus(upvoteRecord.weight)
        searchID = upvoteRecord.id
      }
    }

    // is upvoter targeting a valid proposal?
    if (ZERO_BN.isLessThan(proposalID)) {
      const proposalIdx = queue.findIndex((qp) => qp.id.isEqualTo(proposalID))
      // is target proposal in queue?
      if (proposalIdx !== -1) {
        const weight = await this.getVoteWeight(upvoter)
        queue[proposalIdx].upvotes = queue[proposalIdx].upvotes.plus(weight)
        searchID = proposalID
      } else {
        throw new Error(`Proposal ${parseNumber(proposalID)} not in queue`)
      }
    }

    queue = queue.sort((a, b) => a.upvotes.comparedTo(b.upvotes))
    const newIdx = queue.findIndex((qp) => qp.id.isEqualTo(searchID))

    return {
      lesserID: newIdx === 0 ? ZERO_BN : queue[newIdx - 1].id,
      greaterID: newIdx === queue.length - 1 ? ZERO_BN : queue[newIdx + 1].id,
    }
  }

  async upvote(proposalID: NumberLike, upvoter: Address) {
    const exists = await this.proposalExists(proposalID)
    if (!exists) {
      throw new Error(`Proposal ${parseNumber(proposalID)} does not exist`)
    }
    const { lesserID, greaterID } = await this.findLesserAndGreaterAfterUpvote(proposalID, upvoter)
    return toTransactionObject(
      this.kit,
      this.contract.methods.upvote(
        parseNumber(proposalID),
        parseNumber(lesserID),
        parseNumber(greaterID)
      )
    )
  }

  async revokeUpvote(upvoter: Address) {
    const { id } = await this.getUpvoteRecord(upvoter)
    if (ZERO_BN.isEqualTo(id)) {
      throw new Error(`Voter ${upvoter} has no upvote to revoke`)
    }
    const { lesserID, greaterID } = await this.findLesserAndGreaterAfterUpvote(ZERO_BN, upvoter)
    return toTransactionObject(
      this.kit,
      this.contract.methods.revokeUpvote(parseNumber(lesserID), parseNumber(greaterID))
    )
  }

  async approve(proposalID: NumberLike) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.approve(parseNumber(proposalID), proposalIndex)
    )
  }

  async vote(proposalID: NumberLike, vote: VoteValue) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.vote(parseNumber(proposalID), proposalIndex, vote)
    )
  }

  async execute(proposalID: NumberLike) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.execute(parseNumber(proposalID), proposalIndex)
    )
  }

  getHotfixRecord = proxyCall(
    this.contract.methods.getHotfixRecord,
    tupleParser(parseBuffer),
    (o) => ({
      approved: o[0],
      executed: o[1],
      preparedEpoch: toBigNumber(o[2]),
    })
  )

  isHotfixWhitelistedBy = proxyCall(
    this.contract.methods.isHotfixWhitelistedBy,
    tupleParser(parseBuffer, (s: Address) => identity<Address>(s))
  )

  whitelistHotfix: (hash: Buffer) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.whitelistHotfix,
    tupleParser(parseBuffer)
  )

  approveHotfix: (hash: Buffer) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.approveHotfix,
    tupleParser(parseBuffer)
  )

  prepareHotfix: (hash: Buffer) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.prepareHotfix,
    tupleParser(parseBuffer)
  )

  executeHotfix(transactions: Transaction[]) {
    const enc = encodedTransactions(transactions)
    return toTransactionObject(
      this.kit,
      this.contract.methods.executeHotfix(enc.values, enc.destinations, enc.data, enc.dataLengths)
    )
  }
}

export function encodedTransactions(transactions: Transaction[]) {
  if (transactions.length === 0) {
    throw new Error(`No transactions provided`)
  }
  return {
    values: transactions.map((tx) => parseNumber(tx.value)),
    destinations: transactions.map((tx) => tx.destination),
    data: parseBytes(Buffer.concat(transactions.map((tx) => tx.data))),
    dataLengths: transactions.map((tx) => tx.data.length),
  }
}

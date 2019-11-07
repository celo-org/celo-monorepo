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

  /**
   * Returns the metadata associated with a given proposal.
   * @param proposalID Governance proposal UUID
   */
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

  /**
   * Returns the transaction at the given index associated with a given proposal.
   * @param proposalID Governance proposal UUID
   * @param txIndex Transaction index
   */
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

  /**
   * Returns whether a given proposal is approved.
   * @param proposalID Governance proposal UUID
   */
  isApproved: (proposalID: NumberLike) => Promise<boolean> = proxyCall(
    this.contract.methods.isApproved,
    tupleParser(parseNumber)
  )

  /**
   * Returns the approver address for proposals and hotfixes.
   */
  getApprover = proxyCall(this.contract.methods.approver)

  /**
   * Returns the metadata and transactions associated with a given proposal.
   * @param proposalID Governance proposal UUID
   */
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

  /**
   * Returns whether a given proposal is passing relative to the constitution's threshold.
   * @param proposalID Governance proposal UUID
   */
  isProposalPassing = proxyCall(this.contract.methods.isProposalPassing, tupleParser(parseNumber))

  /**
   * Submits a new governance proposal.
   * @param transactions Sequence of transactions
   */
  propose(transactions: Transaction[]) {
    const enc = encodedTransactions(transactions)
    return toTransactionObject(
      this.kit,
      this.contract.methods.propose(enc.values, enc.destinations, enc.data, enc.dataLengths)
    )
  }

  /**
   * Returns whether a governance proposal exists with the given ID. 
   * @param proposalID Governance proposal UUID
   */
  proposalExists: (proposalID: NumberLike) => Promise<boolean> = proxyCall(
    this.contract.methods.proposalExists,
    tupleParser(parseNumber)
  )

  /**
   * Returns the current upvoted governance proposal ID and applied vote weight (zeroes if none).
   * @param upvoter Address of upvoter
   */
  getUpvoteRecord: (upvoter: Address) => Promise<{ id: BigNumber; weight: BigNumber }> = proxyCall(
    this.contract.methods.getUpvoteRecord,
    tupleParser(identity),
    (o) => ({
      id: toBigNumber(o[0]),
      weight: toBigNumber(o[1]),
    })
  )

  /**
   * Returns whether a given proposal is queued.
   * @param proposalID Governance proposal UUID
   */
  isQueued = proxyCall(this.contract.methods.isQueued, tupleParser(parseNumber))

  /**
   * Returns the upvotes applied to a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getUpvotes = proxyCall(this.contract.methods.getUpvotes, tupleParser(parseNumber), toBigNumber)

  /**
   * Returns the yes, no, and abstain votes applied to a given proposal.
   * @param proposalID Governance proposal UUID
   */
  getVotes = proxyCall(this.contract.methods.getVoteTotals, tupleParser(parseNumber), (o) => ({
    yes: toBigNumber(o[0]),
    no: toBigNumber(o[1]),
    abstain: toBigNumber(o[2]),
  }))

  /**
   * Returns the proposal queue as IDs and applied upvotes.
   */
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

  /**
   * Returns the proposal dequeue as IDs
   */
  getDequeue = proxyCall(this.contract.methods.getDequeue, undefined, (arrayObject) =>
    arrayObject.map(toBigNumber)
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

  /**
   * Applies provided upvoter's upvote to given proposal.
   * @param proposalID Governance proposal UUID
   * @param upvoter Address of upvoter
   */
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

  /**
   * Revokes provided upvoter's upvote.
   * @param upvoter Address of upvoter
   */
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

  /**
   * Approves given proposal, allowing it to later move to `referendum`.
   * @param proposalID Governance proposal UUID
   * @notice Only the `approver` address will succeed in sending this transaction 
   */
  async approve(proposalID: NumberLike) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.approve(parseNumber(proposalID), proposalIndex)
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
      this.contract.methods.vote(parseNumber(proposalID), proposalIndex, vote)
    )
  }

  /**
   * Executes a given proposal's associated transactions.
   * @param proposalID Governance proposal UUID
   */
  async execute(proposalID: NumberLike) {
    const proposalIndex = await this.getDequeueIndex(proposalID)
    return toTransactionObject(
      this.kit,
      this.contract.methods.execute(parseNumber(proposalID), proposalIndex)
    )
  }

  /**
   * Returns approved, executed, and prepared status associated with a given hotfix.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  getHotfixRecord = proxyCall(
    this.contract.methods.getHotfixRecord,
    tupleParser(parseBuffer),
    (o) => ({
      approved: o[0],
      executed: o[1],
      preparedEpoch: toBigNumber(o[2]),
    })
  )

  /**
   * Returns whether a given hotfix has been whitelisted by a given address.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   * @param whitelister address of whitelister
   */
  isHotfixWhitelistedBy = proxyCall(
    this.contract.methods.isHotfixWhitelistedBy,
    tupleParser(parseBuffer, (s: Address) => identity<Address>(s))
  )

  /**
   * Marks the given hotfix whitelisted by `sender`.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  whitelistHotfix: (hash: Buffer) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.whitelistHotfix,
    tupleParser(parseBuffer)
  )

  /**
   * Marks the given hotfix approved by `sender`.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   * @notice Only the `approver` address will succeed in sending this transaction
   */
  approveHotfix: (hash: Buffer) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.approveHotfix,
    tupleParser(parseBuffer)
  )

  /**
   * Marks the given hotfix prepared for current epoch if quorum of validators have whitelisted it.
   * @param hash keccak256 hash of hotfix's associated abi encoded transactions
   */
  prepareHotfix: (hash: Buffer) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.prepareHotfix,
    tupleParser(parseBuffer)
  )

  /**
   * Executes a given sequence of transactions if the corresponding hash is prepared and approved.
   * @param transactions Sequence of transactions
   * @notice keccak256 hash of abi encoded transactions computed on-chain
   */
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

import BigNumber from 'bignumber.js';
import { keccak256 } from 'ethereumjs-util'
import { Address } from '../base';
import { Governance } from '../generated/types/Governance';
import { BaseWrapper, proxyCall, toBigNumber, toBuffer } from './BaseWrapper';

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

export interface Transaction {
  value: BigNumber
  destination: Address
  data: Buffer
}

interface TransactionsEncoded {
  values: string[],
  destinations:  string[],
  data: Buffer,
  dataLengths: number[]
}

export interface ProposalMetadata {
    proposer: Address
    deposit: BigNumber
    timestamp: BigNumber
    transactionCount: number
}

export interface Proposal {
  metadata: ProposalMetadata,
  transactions: Transaction[]
}

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

  async getProposalMetadata(proposalID: BigNumber): Promise<ProposalMetadata> {
    const res = await this.contract.methods.getProposal(proposalID.toString()).call()
    return {
      proposer: res[0],
      deposit: toBigNumber(res[1]),
      timestamp: toBigNumber(res[2]),
      transactionCount: toBigNumber(res[3]).toNumber()
    }
  }

  async getProposalTransaction(proposalID: BigNumber, txIndex: number): Promise<Transaction> {
    const res = await this.contract.methods.getProposalTransaction(
      proposalID.toString(), 
      txIndex.toString()
    ).call()
    return {
      value: toBigNumber(res[0]),
      destination: res[1],
      // @ts-ignore string[] bytes type
      data: toBuffer(res[2])
    }
  }

  async getProposal(proposalID: BigNumber): Promise<Proposal> {
    const metadata = await this.getProposalMetadata(proposalID)
    const txIndices = Array.from(Array(metadata.transactionCount).keys())
    const transactions = await Promise.all(txIndices.map(
      (txIndex) => this.getProposalTransaction(proposalID, txIndex)
    ))
    return {
      metadata,
      transactions
    }
  }

  getTransactionsEncoded(transactions: Transaction[]): TransactionsEncoded {
    return {
      values: transactions.map((tx) => tx.value.toString()),
      destinations: transactions.map((tx) => tx.destination),
      data: Buffer.concat(transactions.map((tx) => tx.data)),
      dataLengths: transactions.map((tx) => tx.data.length)
    }
  }

  getTransactionsHash(transactions: Transaction[]): Buffer {
    const encoded = this.getTransactionsEncoded(transactions)
    return keccak256(
      this.kit.web3.eth.abi.encodeParameters(
        ['uint256[]', 'address[]', 'bytes', 'uint256[]'], 
        [encoded.values, encoded.destinations, encoded.data, encoded.dataLengths]
      )
    ) as Buffer
  }
}

import BigNumber from 'bignumber.js'
import { Governance } from '../generated/types/Governance'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export interface StageDurations {
  approval: BigNumber
  referendum: BigNumber
  execution: BigNumber
}

export interface GovernanceConfig {
  concurrentProposals: BigNumber
  dequeueFrequency: BigNumber
  minDeposit: BigNumber
  queueExpiry: BigNumber
  stageDurations: StageDurations
}

/**
 * Contract managing voting for governance proposals.
 */
export class GovernanceWrapper extends BaseWrapper<Governance> {
  concurrentProposals = proxyCall(this.contract.methods.concurrentProposals, undefined, toBigNumber)
  dequeueFrequency = proxyCall(this.contract.methods.dequeueFrequency, undefined, toBigNumber)
  minDeposit = proxyCall(this.contract.methods.minDeposit, undefined, toBigNumber)
  queueExpiry = proxyCall(this.contract.methods.queueExpiry, undefined, toBigNumber)
  async stageDurations(): Promise<StageDurations> {
    const res = await this.contract.methods.stageDurations().call()
    return {
      approval: toBigNumber(res[0]),
      referendum: toBigNumber(res[1]),
      execution: toBigNumber(res[2]),
    }
  }
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
}

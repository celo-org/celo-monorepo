import { Governance } from '../generated/types/Governance'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export class GovernanceWrapper extends BaseWrapper<Governance> {
  stageDurations = proxyCall(this.contract.methods.stageDurations)
  concurrentProposals = proxyCall(this.contract.methods.concurrentProposals, undefined, toBigNumber)
  dequeueFrequency = proxyCall(this.contract.methods.dequeueFrequency, undefined, toBigNumber)
  minDeposit = proxyCall(this.contract.methods.minDeposit, undefined, toBigNumber)
  queueExpiry = proxyCall(this.contract.methods.queueExpiry, undefined, toBigNumber)
}

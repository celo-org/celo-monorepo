import { SortedOracles } from '../generated/types/SortedOracles'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
  reportExpirySeconds = proxyCall(this.contract.methods.reportExpirySeconds, undefined, toBigNumber)
}

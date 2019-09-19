import BigNumber from 'bignumber.js'
import { SortedOracles } from '../generated/types/SortedOracles'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export interface SortedOraclesConfig {
  reportExpirySeconds: BigNumber
}

/**
 * Currency price oracle contract.
 */
export class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
  reportExpirySeconds = proxyCall(this.contract.methods.reportExpirySeconds, undefined, toBigNumber)
  async getConfig(): Promise<SortedOraclesConfig> {
    return {
      reportExpirySeconds: await this.reportExpirySeconds(),
    }
  }
}

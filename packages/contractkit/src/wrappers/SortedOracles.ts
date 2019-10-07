import BigNumber from 'bignumber.js'
import { SortedOracles } from '../generated/types/SortedOracles'
import { BaseWrapper, proxyCall, proxySend, toBigNumber } from './BaseWrapper'

export interface SortedOraclesConfig {
  reportExpirySeconds: BigNumber
}

/**
 * Currency price oracle contract.
 */
export class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
  getRates = proxyCall(this.contract.methods.getRates)
  numRates = proxyCall(this.contract.methods.numRates)
  medianRate = proxyCall(this.contract.methods.medianRate)
  /**
   * Returns the report expiry parameter.
   * @returns Current report expiry.
   */
  reportExpirySeconds = proxyCall(this.contract.methods.reportExpirySeconds, undefined, toBigNumber)

  report = proxySend(this.kit, this.contract.methods.report)
  // async report(
  //   token: Address,
  //   numerator: string | number,
  //   denominator: string | number
  // ): Promise<CeloTransactionObject<boolean>> {
  //   this.contract.methods.report()
  // }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<SortedOraclesConfig> {
    return {
      reportExpirySeconds: await this.reportExpirySeconds(),
    }
  }
}

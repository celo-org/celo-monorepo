import BigNumber from 'bignumber.js'
import { Reserve } from '../generated/types/Reserve'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber } from './BaseWrapper'

export interface ReserveConfig {
  tobinTaxStalenessThreshold: BigNumber
}

/**
 * Contract for handling reserve for stable currencies
 */
export class ReserveWrapper extends BaseWrapper<Reserve> {
  /**
   * Query Tobin tax staleness threshold parameter.
   * @returns Current Tobin tax staleness threshold.
   */
  tobinTaxStalenessThreshold = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    valueToBigNumber
  )
  isSpender: (account: string) => Promise<boolean> = proxyCall(this.contract.methods.isSpender)
  transferGold = proxySend(this.kit, this.contract.methods.transferGold)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ReserveConfig> {
    return {
      tobinTaxStalenessThreshold: await this.tobinTaxStalenessThreshold(),
    }
  }
}

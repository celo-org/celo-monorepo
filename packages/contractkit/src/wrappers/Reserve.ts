import BigNumber from 'bignumber.js'
import { Reserve } from '../generated/types/Reserve'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export interface ReserveConfig {
  tobinTaxStalenessThreshold: BigNumber
}

/**
 * Contract for handling reserve for stable currencies
 */
export class ReserveWrapper extends BaseWrapper<Reserve> {
  tobinTaxStalenessThreshold = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    toBigNumber
  )
  async getConfig(): Promise<ReserveConfig> {
    return {
      tobinTaxStalenessThreshold: await this.tobinTaxStalenessThreshold(),
    }
  }
}

import { GasPriceMinimum } from '../generated/types/GasPriceMinimum'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'
import BigNumber from 'bignumber.js'

export interface GasPriceMinimumConfig {
  gasPriceMinimum: BigNumber
  targetDensity: BigNumber
  adjustmentSpeed: BigNumber
  infrastructureFraction: BigNumber
}

/**
 * Stores the gas price minimum
 */
export class GasPriceMinimumWrapper extends BaseWrapper<GasPriceMinimum> {
  gasPriceMinimum = proxyCall(this.contract.methods.gasPriceMinimum, undefined, toBigNumber)
  targetDensity = proxyCall(this.contract.methods.targetDensity, undefined, toBigNumber)
  adjustmentSpeed = proxyCall(this.contract.methods.adjustmentSpeed, undefined, toBigNumber)
  infrastructureFraction = proxyCall(
    this.contract.methods.infrastructureFraction,
    undefined,
    toBigNumber
  )
  async getConfig(): Promise<GasPriceMinimumConfig> {
    const res = await Promise.all([
      this.gasPriceMinimum(),
      this.targetDensity(),
      this.adjustmentSpeed(),
      this.infrastructureFraction(),
    ])
    return {
      gasPriceMinimum: res[0],
      targetDensity: res[1],
      adjustmentSpeed: res[2],
      infrastructureFraction: res[3],
    }
  }
}

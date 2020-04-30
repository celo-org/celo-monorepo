import BigNumber from 'bignumber.js'
import { GasPriceMinimum } from '../generated/GasPriceMinimum'
import { BaseWrapper, fixidityValueToBigNumber, proxyCall, valueToBigNumber } from './BaseWrapper'

export interface GasPriceMinimumConfig {
  gasPriceMinimum: BigNumber
  targetDensity: BigNumber
  adjustmentSpeed: BigNumber
}

/**
 * Stores the gas price minimum
 */
export class GasPriceMinimumWrapper extends BaseWrapper<GasPriceMinimum> {
  /**
   * Query current gas price minimum in gGLD.
   * @returns current gas price minimum in cGLD
   */
  gasPriceMinimum = proxyCall(this.contract.methods.gasPriceMinimum, undefined, valueToBigNumber)

  /**
   * Query current gas price minimum.
   * @returns current gas price minimum in the requested currency
   */
  getGasPriceMinimum = proxyCall(
    this.contract.methods.getGasPriceMinimum,
    undefined,
    valueToBigNumber
  )

  /**
   * Query target density parameter.
   * @returns the current block density targeted by the gas price minimum algorithm.
   */
  targetDensity = proxyCall(
    this.contract.methods.targetDensity,
    undefined,
    fixidityValueToBigNumber
  )
  /**
   * Query adjustment speed parameter
   * @returns multiplier that impacts how quickly gas price minimum is adjusted.
   */
  adjustmentSpeed = proxyCall(
    this.contract.methods.adjustmentSpeed,
    undefined,
    fixidityValueToBigNumber
  )
  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<GasPriceMinimumConfig> {
    const res = await Promise.all([
      this.gasPriceMinimum(),
      this.targetDensity(),
      this.adjustmentSpeed(),
    ])
    return {
      gasPriceMinimum: res[0],
      targetDensity: res[1],
      adjustmentSpeed: res[2],
    }
  }
}

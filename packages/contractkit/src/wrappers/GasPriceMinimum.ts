import { GasPriceMinimum } from '../generated/types/GasPriceMinimum'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export class GasPriceMinimumWrapper extends BaseWrapper<GasPriceMinimum> {
  gasPriceMinimum = proxyCall(this.contract.methods.gasPriceMinimum, undefined, toBigNumber)
  targetDensity = proxyCall(this.contract.methods.targetDensity, undefined, toBigNumber)
  adjustmentSpeed = proxyCall(this.contract.methods.adjustmentSpeed, undefined, toBigNumber)
  infrastructureFraction = proxyCall(
    this.contract.methods.infrastructureFraction,
    undefined,
    toBigNumber
  )
}

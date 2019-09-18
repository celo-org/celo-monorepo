import { Reserve } from '../generated/types/Reserve'
import { BaseWrapper, proxyCall, toBigNumber } from './BaseWrapper'

export class ReserveWrapper extends BaseWrapper<Reserve> {
  tobinTaxStalenessThreshold = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    toBigNumber
  )
}

import { Freezer } from '../generated/Freezer'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

export class FreezerWrapper extends BaseWrapper<Freezer> {
  freeze = proxySend(this.kit, this.contract.methods.freeze)
  unfreeze = proxySend(this.kit, this.contract.methods.unfreeze)
  isFrozen = proxyCall(this.contract.methods.isFrozen)
}

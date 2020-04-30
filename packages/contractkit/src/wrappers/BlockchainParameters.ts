import { BlockchainParameters } from '../generated/BlockchainParameters'
import { BaseWrapper, proxyCall, proxySend, valueToInt } from './BaseWrapper'

/**
 * Network parameters that are configurable by governance.
 */
export class BlockchainParametersWrapper extends BaseWrapper<BlockchainParameters> {
  /**
   * Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.
   */
  setIntrinsicGasForAlternativeFeeCurrency = proxySend(
    this.kit,
    this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency
  )

  /**
   * Getting the block gas limit.
   */
  getBlockGasLimit = proxyCall(this.contract.methods.blockGasLimit, undefined, valueToInt)
  /**
   * Setting the block gas limit.
   */
  setBlockGasLimit = proxySend(this.kit, this.contract.methods.setBlockGasLimit)
  /**
   * Set minimum client version.
   */
  setMinimumClientVersion = proxySend(this.kit, this.contract.methods.setMinimumClientVersion)
}

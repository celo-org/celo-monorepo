import { BlockchainParameters } from '../generated/types/BlockchainParameters'
import { BaseWrapper, proxySend } from './BaseWrapper'

/**
 * Network parameters that are configurable by governance.
 */
export class BlockchainParametersWrapper extends BaseWrapper<BlockchainParameters> {
  /**
   * Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.
   */
  setIntrinsicGasForAlternativeGasCurrency = proxySend(
    this.kit,
    this.contract.methods.setIntrinsicGasForAlternativeGasCurrency
  )
  /**
   * Setting the block gas limit.
   */
  setBlockGasLimit = proxySend(this.kit, this.contract.methods.setBlockGasLimit)
  /**
   * Set minimum client version.
   */
  setMinimumClientVersion = proxySend(this.kit, this.contract.methods.setMinimumClientVersion)
}

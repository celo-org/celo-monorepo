import { BlockchainParameters } from '../generated/types/BlockchainParameters'
import { BaseWrapper, proxySend } from './BaseWrapper'

/**
 * Network parameters that are configurable by governance.
 */
export class BlockchainParametersWrapper extends BaseWrapper<BlockchainParameters> {
  /**
   * Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.
   */
  // setGasForNonGoldCurrencies = proxySend(this.kit, this.contract.methods.setGasForNonGoldCurrencies)
  setGasForCreditToTransactions = proxySend(
    this.kit,
    this.contract.methods.setGasForCreditToTransactions
  )
  setGasForDebitFromTransactions = proxySend(
    this.kit,
    this.contract.methods.setGasForDebitFromTransactions
  )
  setGasToReadErc20Balance = proxySend(this.kit, this.contract.methods.setGasToReadErc20Balance)
}

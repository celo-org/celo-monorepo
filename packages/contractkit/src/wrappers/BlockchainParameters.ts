import { BigNumber } from 'bignumber.js'
import { BlockchainParameters } from '../generated/BlockchainParameters'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber, valueToInt } from './BaseWrapper'

export interface ClientVersion {
  major: number
  minor: number
  patch: number
}

export interface BlockchainParametersConfig {
  blockGasLimit: BigNumber
  minimumClientVersion: ClientVersion
  intrinsicGasForAlternativeFeeCurrency: BigNumber
}

/**
 * Network parameters that are configurable by governance.
 */
export class BlockchainParametersWrapper extends BaseWrapper<BlockchainParameters> {
  /**
   * Get the extra intrinsic gas for transactions, where gas is paid using non-gold currency.
   */
  getIntrinsicGasForAlternativeFeeCurrency = proxyCall(
    this.contract.methods.intrinsicGasForAlternativeFeeCurrency,
    undefined,
    valueToBigNumber
  )

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
  getBlockGasLimit = proxyCall(this.contract.methods.blockGasLimit, undefined, valueToBigNumber)

  /**
   * Setting the block gas limit.
   */
  setBlockGasLimit = proxySend(this.kit, this.contract.methods.setBlockGasLimit)

  /**
   * Get minimum client version.
   */
  async getMinimumClientVersion(): Promise<ClientVersion> {
    const v = await this.contract.methods.getMinimumClientVersion().call()
    return {
      major: valueToInt(v.major),
      minor: valueToInt(v.minor),
      patch: valueToInt(v.patch),
    }
  }

  /**
   * Set minimum client version.
   */
  setMinimumClientVersion = proxySend(this.kit, this.contract.methods.setMinimumClientVersion)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<BlockchainParametersConfig> {
    return {
      blockGasLimit: await this.getBlockGasLimit(),
      minimumClientVersion: await this.getMinimumClientVersion(),
      intrinsicGasForAlternativeFeeCurrency: await this.getIntrinsicGasForAlternativeFeeCurrency(),
    }
  }
}

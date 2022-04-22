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
    this.connection,
    this.contract.methods.setIntrinsicGasForAlternativeFeeCurrency
  )

  /**
   * Getting the block gas limit.
   */
  getBlockGasLimit = proxyCall(this.contract.methods.blockGasLimit, undefined, valueToBigNumber)

  /**
   * Setting the block gas limit.
   */
  setBlockGasLimit = proxySend(this.connection, this.contract.methods.setBlockGasLimit)

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
  setMinimumClientVersion = proxySend(
    this.connection,
    this.contract.methods.setMinimumClientVersion
  )

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

  /**
   * Getting the uptime lookback window.
   */
  getUptimeLookbackWindow = proxyCall(
    this.contract.methods.getUptimeLookbackWindow,
    undefined,
    valueToInt
  )
  /**
   * Setting the uptime lookback window.
   */
  setUptimeLookbackWindow = proxySend(
    this.connection,
    this.contract.methods.setUptimeLookbackWindow
  )

  async getEpochSizeNumber(): Promise<number> {
    const epochSize = await this.getEpochSize()

    return epochSize.toNumber()
  }

  async getFirstBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const epochSize = await this.getEpochSizeNumber()
    // Follows GetEpochFirstBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    if (epochNumber === 0) {
      // No first block for epoch 0
      return 0
    }
    return (epochNumber - 1) * epochSize + 1
  }

  async getLastBlockNumberForEpoch(epochNumber: number): Promise<number> {
    const epochSize = await this.getEpochSizeNumber()
    // Follows GetEpochLastBlockNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    if (epochNumber === 0) {
      return 0
    }
    const firstBlockNumberForEpoch = await this.getFirstBlockNumberForEpoch(epochNumber)
    return firstBlockNumberForEpoch + (epochSize - 1)
  }

  async getEpochNumberOfBlock(blockNumber: number): Promise<number> {
    const epochSize = await this.getEpochSizeNumber()
    // Follows GetEpochNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    const epochNumber = Math.floor(blockNumber / epochSize)
    if (blockNumber % epochSize === 0) {
      return epochNumber
    } else {
      return epochNumber + 1
    }
  }

  getEpochNumber = proxyCall(this.contract.methods.getEpochNumber, undefined, valueToBigNumber)

  getEpochSize = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)
}

export type BlockchainParametersWrapperType = BlockchainParametersWrapper

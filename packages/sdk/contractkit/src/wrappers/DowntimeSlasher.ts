import { Address } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { DowntimeSlasher } from '../generated/DowntimeSlasher'
import { BaseSlasher } from './BaseSlasher'
import {
  blocksToDurationString,
  proxyCall,
  proxySend,
  solidityBytesToString,
  valueToInt,
} from './BaseWrapper'

export interface DowntimeSlasherConfig {
  slashableDowntime: number
  slashingIncentives: {
    reward: BigNumber
    penalty: BigNumber
  }
}

export interface Interval {
  start: number
  end: number
}

const unpackInterval = (interval: Interval) => [interval.start, interval.end] as any

/**
 * Contract handling slashing for Validator downtime using intervals.
 */
export class DowntimeSlasherWrapper extends BaseSlasher<DowntimeSlasher> {
  /**
   * Returns slashable downtime in blocks.
   * @return The number of consecutive blocks before a Validator missing from IBFT consensus
   * can be slashed.
   */
  slashableDowntime = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<DowntimeSlasherConfig> {
    const res = await Promise.all([this.slashableDowntime(), this.slashingIncentives()])
    return {
      slashableDowntime: res[0],
      slashingIncentives: res[1],
    }
  }

  /**
   * @dev Returns human readable configuration of the downtime slasher contract
   * @return DowntimeSlasherConfig object
   */
  async getHumanReadableConfig() {
    const config = await this.getConfig()
    return {
      ...config,
      slashableDowntime: blocksToDurationString(config.slashableDowntime),
    }
  }

  /**
   * Calculates and returns the signature bitmap for the specified interval.
   * Similar to the parentSealBitmap of every block (where you have which validators were
   * able to sign the previous block), this bitmap shows for that specific interval which
   * validators signed at least one block
   * @param interval First and last block of the interval.
   * @return (string) The signature uptime bitmap for the specified interval.
   * @dev startBlock and endBlock must be in the same epoch.
   * @dev The getParentSealBitmap precompile requires that startBlock must be within 4 epochs of
   * the current block.
   */
  getBitmapForInterval = proxyCall(
    this.contract.methods.getBitmapForInterval,
    unpackInterval,
    solidityBytesToString
  )

  /**
   * Calculates and sets the signature bitmap for the specified interval.
   * @param interval First and last block of the interval.
   * @dev interval.start and interval.end must be in the same epoch.
   * @return The signature bitmap for the specified interval.
   */
  setBitmapForInterval = proxySend(
    this.connection,
    this.contract.methods.setBitmapForInterval,
    unpackInterval
  )

  /**
   * Calculates intervals which span `slashableDowntime` before provided block.
   * @param block Block number to build intervals before.
   * @param maximumLength Maximum length for any interval (limited by gas limit).
   * @dev if block is undefined, latest will be used
   * @return The signature bitmap for the specified interval.
   */
  async slashableDowntimeIntervalsBefore(
    block?: number,
    maximumLength = 4000
  ): Promise<Interval[]> {
    const [window, blockchainParamsWrapper] = await Promise.all([
      this.getSlashableDowntimeWindow(undefined, block),
      this.contracts.getBlockchainParameters(),
    ])

    let end = window.end
    const intervals: Interval[] = []
    while (end > window.start) {
      const epochNumber = await blockchainParamsWrapper.getEpochNumberOfBlock(end)
      const firstBlock = await blockchainParamsWrapper.getFirstBlockNumberForEpoch(epochNumber)
      const start = Math.max(window.start, end - maximumLength, firstBlock)
      intervals.push({ start, end })
      end = start - 1
    }
    return intervals.reverse()
  }

  /**
   * Shows if the user already called the `setBitmapForInterval` for
   * the specific interval.
   * @param interval First and last block of the interval.
   * @return True if the user already called the `setBitmapForInterval` for
   * the specific interval.
   */
  isBitmapSetForInterval = proxyCall(this.contract.methods.isBitmapSetForInterval, unpackInterval)

  /**
   * Shows if the user already called the `setBitmapForInterval` for intervals.
   * @param intervals First and last block of the interval.
   * @return True if the user already called the `setBitmapForInterval` for intervals.
   */
  async isBitmapSetForIntervals(intervals: Interval[]) {
    const setArray = await Promise.all(
      intervals.map((interval) => this.isBitmapSetForInterval(interval))
    )
    return !setArray.some((set) => !set)
  }

  lastSlashedBlock = proxyCall(this.contract.methods.lastSlashedBlock, undefined, valueToInt)

  /**
   * Tests if the given validator or signer did not sign any blocks in the interval.
   * @param address Address of the validator account or signer.
   * @param interval First and last block of the interval.
   */
  async wasValidatorDownForInterval(address: Address, interval: Interval) {
    const startSignerIndex = await this.signerIndexAtBlock(address, interval.start)
    return this.contract.methods
      .wasDownForInterval(interval.start, interval.end, startSignerIndex)
      .call()
  }

  /**
   * Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
   * intervals.
   * @param address Address of the validator account or signer.
   * @param intervals
   * @return True if the validator signature does not appear in any block within the window.
   */
  async wasValidatorDownForIntervals(address: Address, intervals: Interval[]) {
    const downArray = await Promise.all(
      intervals.map((interval) => this.wasValidatorDownForInterval(address, interval))
    )
    return downArray.every((down) => down)
  }

  /**
   * Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
   * intervals.
   * @param address Address of the validator account or signer.
   * @param intervals A list of ordered intervals for which signature bitmaps have already been set.
   */
  async slashValidator(address: Address, intervals: Interval[]) {
    if (intervals.length === 0) {
      throw new Error('intervals array should have at least one element')
    }
    const blockchainParamsWrapper = await this.contracts.getBlockchainParameters()
    const signerIndices = []
    let prevEpochNumber = -1
    for (const interval of intervals) {
      const epochNumber = await blockchainParamsWrapper.getFirstBlockNumberForEpoch(interval.start)
      if (epochNumber !== prevEpochNumber) {
        const signerIndex = await this.signerIndexAtBlock(address, interval.start)
        signerIndices.push(signerIndex)
        prevEpochNumber = epochNumber
      }
    }

    return this.slash(
      intervals.map((interval) => interval.start),
      intervals.map((interval) => interval.end),
      signerIndices,
      ...(await this.trailingSlashArgs(address, intervals[0].start))
    )
  }

  /**
   * Calculate the slashable downtime window with respect to a provided start/end block numbers and length.
   * @param startBlock First block of the downtime. Determined from endBlock if not provided.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param length Length of downtime. Determined from minimum slashable downtime if not provided.
   */
  private async getSlashableDowntimeWindow(
    startBlock?: number,
    endBlock?: number,
    length?: number
  ): Promise<Interval> {
    if (!length) {
      length = await this.slashableDowntime()
    }
    if (!endBlock) {
      endBlock = startBlock ? startBlock + length - 1 : (await this.connection.getBlockNumber()) - 2 // latest grandparent
    }

    return {
      start: startBlock ?? endBlock - length + 1,
      end: endBlock,
    }
  }
}

export type DowntimeSlasherWrapperType = DowntimeSlasherWrapper

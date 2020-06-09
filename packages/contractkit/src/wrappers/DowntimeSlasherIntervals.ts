import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasherIntervals } from '../generated/DowntimeSlasherIntervals'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator } from './Validators'

export interface DowntimeSlasherIntervalsConfig {
  slashableDowntime: number
  slashingIncentives: {
    reward: BigNumber
    penalty: BigNumber
  }
}

export interface DowntimeWindow {
  start: number
  end: number
  length: number
}

/**
 * Contract handling slashing for Validator downtime using Intervals
 */
export class DowntimeSlasherIntervalsWrapper extends BaseWrapper<DowntimeSlasherIntervals> {
  /**
   * Returns slashing incentives.
   * @return Rewards and penaltys for slashing.
   */
  slashingIncentives = proxyCall(this.contract.methods.slashingIncentives, undefined, (res): {
    reward: BigNumber
    penalty: BigNumber
  } => ({
    reward: valueToBigNumber(res.reward),
    penalty: valueToBigNumber(res.penalty),
  }))

  /**
   * Returns slashable downtime in blocks.
   * @return The number of consecutive blocks before a Validator missing from IBFT consensus
   * can be slashed.
   */
  slashableDowntime = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

  getEpochSize = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<DowntimeSlasherIntervalsConfig> {
    const res = await Promise.all([this.slashableDowntime(), this.slashingIncentives()])
    return {
      slashableDowntime: res[0],
      slashingIncentives: res[1],
    }
  }

  /**
   * Test if a validator has been down for an specific interval of blocks.
   * If the user already has called the method "setBitmapForInterval", for
   * the same Interval (startBlock, endBlock), it will use those accumulators
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the Interval.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  wasDownForInterval = proxyCall(this.contract.methods.wasDownForInterval)

  /**
   * Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Interval (startBlock, endBlock) for all the signers.
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the downtime Interval.
   * @param endBlock Last block of the downtime Interval.
   * @return up bitmap accumulator for every signer in the Interval.
   */
  getBitmapForInterval = proxyCall(
    this.contract.methods.getBitmapForInterval,
    undefined,
    valueToBigNumber
  )

  /**
   * Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Interval (startBlock, endBlock) and SAVE it to have a proof that this was already calculated.
   * If the Interval was calculated before, won't calculate anything and will return the last proof
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the downtime Interval.
   * @param endBlock Last block of the downtime Interval.
   * @return up bitmap accumulator for every signer in the Interval.
   */
  setBitmapForInterval = proxySend(this.kit, this.contract.methods.setBitmapForInterval)

  /**
   * @notice Shows if the user already called the setBitmapForInterval for
   * the specific Interval
   * @param startBlock First block of a calculated downtime Interval.
   * @param endBlock Last block of the calculated downtime Interval.
   * @return True if the user already called the setBitmapForInterval for
   * the specific Interval
   */
  intervalProofAlreadyCalculated = proxyCall(this.contract.methods.bitmapSetForInterval)

  /**
   * Tests if the given validator or signer has been down in the Interval.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the Interval.
   * @param endBlock Last block of the Interval.
   */
  async wasValidatorDownForInterval(
    validatorOrSignerAddress: Address,
    startBlock: number,
    endBlock: number
  ) {
    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      startBlock
    )
    return this.wasDownForInterval(startBlock, endBlock, startSignerIndex)
  }

  /**
   * Test if a validator has been down for an specific chain of Intervals.
   * Requires to:
   *   - previously called 'setBitmapForInterval' for every pair
   * (startIntervals(i), endIntervals(i))
   *   - startIntervals(0) is the startBlock of the SlashableDowntime
   *   - endIntervals(i) is included in the interval [startIntervals(i+1) - 1, endIntervals(i+1)]
   *   - [startBlock, startBlock+SlashableDowntime-1] be covered by
   * [startIntervals(0), endIntervals(n)]
   * @param startIntervals List of blocks that starts a previously validated Interval.
   * startIntervals[0] will be use as the startBlock of the SlashableDowntime
   * @param endIntervals List of blocks that ends a previously validated Interval.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  wasDownForIntervals = proxyCall(this.contract.methods.wasDownForIntervals)

  /**
   * Test if a validator has been down for an specific chain of Intervals.
   * Requires to:
   *   - previously called 'setBitmapForInterval' for every pair
   * (startIntervals(i), endIntervals(i))
   *   - startIntervals(0) is the startBlock of the SlashableDowntime
   *   - endIntervals(i) is included in the interval [startIntervals(i+1) - 1, endIntervals(i+1)]
   *   - [startBlock, startBlock+SlashableDowntime-1] be covered by
   * [startIntervals(0), endIntervals(n)]
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startIntervals List of blocks that starts a previously validated Interval.
   * startIntervals[0] will be use as the startBlock of the SlashableDowntime
   * @param endIntervals List of blocks that ends a previously validated Interval.
   * @return True if the validator signature does not appear in any block within the window.
   */
  async wasValidatorDown(
    validatorOrSignerAddress: Address,
    startIntervals: number[],
    endIntervals: number[]
  ) {
    if (startIntervals.length === 0 || startIntervals.length !== endIntervals.length) {
      throw new Error('Interval arrays should have at least one element and have the same length')
    }
    const window = await this.getSlashableDowntimeWindow(startIntervals[0], undefined)

    const signerIndeces = []
    signerIndeces.push(await this.getValidatorSignerIndex(validatorOrSignerAddress, window.start))
    const startEpoch = await this.kit.getEpochNumberOfBlock(window.start)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    if (startEpoch < endEpoch) {
      signerIndeces.push(await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end))
    }
    return this.wasDownForIntervals(startIntervals, endIntervals, signerIndeces)
  }

  /**
   * Determines the validator signer given an account or signer address and block number.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param blockNumber Block at which to determine the signer index.
   */
  async getValidatorSignerIndex(validatorOrSignerAddress: Address, blockNumber: number) {
    // If the provided address is the account, fetch the signer at the given block.
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    const isAccount = await accounts.isAccount(validatorOrSignerAddress)
    const signer = isAccount
      ? (await validators.getValidator(validatorOrSignerAddress, blockNumber)).signer
      : validatorOrSignerAddress

    // Determine the index of the validator signer in the elected set at the given block.
    const election = await this.kit.contracts.getElection()
    const index = findAddressIndex(signer, await election.getValidatorSigners(blockNumber))
    if (index < 0) {
      throw new Error(`Validator signer ${signer} was not elected at block ${blockNumber}`)
    }
    return index
  }

  /**
   * Execute a slashing if the validator has been down for an specific chain of Intervals.
   * Requires to:
   *   - previously called 'setBitmapForInterval' for every pair
   * (startIntervals(i), endIntervals(i))
   *   - startIntervals(0) is the startBlock of the SlashableDowntime
   *   - endIntervals(i) is included in the interval [startIntervals(i+1) - 1, endIntervals(i+1)]
   *   - [startBlock, startBlock+SlashableDowntime-1] be covered by
   * [startIntervals(0), endIntervals(n)]
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startIntervals List of blocks that starts a previously validated Interval.
   * startIntervals[0] will be use as the startBlock of the SlashableDowntime
   * @param endIntervals List of blocks that ends a previously validated Interval.
   */
  async slashValidator(
    validatorOrSignerAddress: Address,
    startIntervals: number[],
    endIntervals: number[]
  ): Promise<CeloTransactionObject<void>> {
    if (startIntervals.length === 0 || startIntervals.length !== endIntervals.length) {
      throw new Error('Interval arrays should have at least one element and have the same length')
    }
    const window = await this.getSlashableDowntimeWindow(startIntervals[0], undefined)
    return this.slashStartSignerIndex(
      await this.getValidatorSignerIndex(validatorOrSignerAddress, window.start),
      startIntervals,
      endIntervals
    )
  }

  /**
   * Execute a slashing if the validator has been down for an specific chain of Intervals.
   * Requires to:
   *   - previously called 'setBitmapForInterval' for every pair
   * (startIntervals(i), endIntervals(i))
   *   - startIntervals(0) is the startBlock of the SlashableDowntime
   *   - endIntervals(i) is included in the interval [startIntervals(i+1) - 1, endIntervals(i+1)]
   *   - [startBlock, startBlock+SlashableDowntime-1] be covered by
   * [startIntervals(0), endIntervals(n)]
   * @param startSignerIndex Validator index at the first block.
   * @param startIntervals List of blocks that starts a previously validated Interval.
   * startIntervals[0] will be use as the startBlock of the SlashableDowntime
   * @param endIntervals List of blocks that ends a previously validated Interval.
   */
  async slashStartSignerIndex(
    startSignerIndex: number,
    startIntervals: number[],
    endIntervals: number[]
  ): Promise<CeloTransactionObject<void>> {
    if (startIntervals.length === 0 || startIntervals.length !== endIntervals.length) {
      throw new Error('Interval arrays should have at least one element and have the same length')
    }
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startIntervals[0])

    const window = await this.getSlashableDowntimeWindow(startIntervals[0])
    const startEpoch = await this.kit.getEpochNumberOfBlock(window.start)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    const signerIndices = [startSignerIndex]
    if (startEpoch < endEpoch) {
      signerIndices.push(findAddressIndex(signer, await election.getValidatorSigners(window.end)))
    }
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, window, startIntervals, endIntervals, signerIndices)
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param slashableWindow Window of the blocks to slash.
   * @param startIntervals Array of the block numbers of the Interval starts
   * @param endIntervals Array of the block numbers of the Interval ends
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  private async slash(
    validator: Validator,
    slashableWindow: DowntimeWindow,
    startIntervals: number[],
    endIntervals: number[],
    signerIndeces: number[]
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const validators = await this.kit.contracts.getValidators()
    const membership = await validators.getValidatorMembershipHistoryIndex(
      validator,
      slashableWindow.start
    )
    const lockedGold = await this.kit.contracts.getLockedGold()
    const slashValidator = await lockedGold.computeInitialParametersForSlashing(
      validator.address,
      incentives.penalty
    )
    const slashGroup = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty,
      slashValidator.list
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        startIntervals,
        endIntervals,
        signerIndeces,
        membership.historyIndex,
        slashValidator.lessers,
        slashValidator.greaters,
        slashValidator.indices,
        slashGroup.lessers,
        slashGroup.greaters,
        slashGroup.indices
      )
    )
  }

  /**
   * Calculate the slashable window with respect to a provided start or end block number.
   * @param startBlock First block of the downtime. Determined from endBlock if not provided.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   */
  private async getSlashableDowntimeWindow(
    startBlock?: number,
    endBlock?: number
  ): Promise<DowntimeWindow> {
    const length = await this.slashableDowntime()
    return this.getDowntimeWindow(length, startBlock, endBlock)
  }

  /**
   * Calculate the downtime window with respect to a length and a provided start or end block number.
   * @param length Window length
   * @param startBlock First block of the Downtime window. Determined from endBlock if not provided.
   * @param endBlock Last block of the Downtime window. Determined from startBlock or grandparent of latest block if not provided.
   */
  private async getDowntimeWindow(
    length: number,
    startBlock?: number,
    endBlock?: number
  ): Promise<DowntimeWindow> {
    if (startBlock !== undefined && endBlock !== undefined) {
      if (endBlock - startBlock + 1 !== length) {
        throw new Error(`Start and end block must define a window of ${length} blocks`)
      }
      return {
        start: startBlock,
        end: endBlock,
        length,
      }
    }
    if (endBlock !== undefined) {
      return {
        start: endBlock - length + 1,
        end: endBlock,
        length,
      }
    }
    if (startBlock !== undefined) {
      return {
        start: startBlock,
        end: startBlock + length - 1,
        length,
      }
    }

    // Use the latest grandparent because that is the most recent block eligible for inclusion.
    const latest = (await this.kit.web3.eth.getBlockNumber()) - 2
    return {
      start: latest - length + 1,
      end: latest,
      length,
    }
  }
}

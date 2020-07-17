import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasher } from '../generated/DowntimeSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  solidityBytesToString,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator } from './Validators'

export interface DowntimeSlasherConfig {
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
 * Contract handling slashing for Validator downtime using intervals.
 */
export class DowntimeSlasherWrapper extends BaseWrapper<DowntimeSlasher> {
  /**
   * Returns slashing incentives.
   * @return Rewards and penalties for slashing.
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
   * Check if a validator appears down in the bitmap for the interval of blocks.
   * Both startBlock and endBlock should be part of the same epoch.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @param signerIndex Index of the signer within the validator set.
   * @return True if the validator does not appear in the bitmap of the interval.
   */
  wasDownForInterval = proxyCall(this.contract.methods.wasDownForInterval)

  /**
   * Calculates and returns the signature bitmap for the specified interval.
   * Similar to the parentSealBitmap of every block (where you have which validators were
   * able to sign the previous block), this bitmap shows for that specific interval which
   * validators signed at least one block
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @return (string) The signature uptime bitmap for the specified interval.
   * @dev startBlock and endBlock must be in the same epoch.
   * @dev The getParentSealBitmap precompile requires that startBlock must be within 4 epochs of
   * the current block.
   */
  getBitmapForInterval = proxyCall(
    this.contract.methods.getBitmapForInterval,
    undefined,
    solidityBytesToString
  )

  /**
   * Calculates and sets the signature bitmap for the specified interval.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @return The signature bitmap for the specified interval.
   * @dev startBlock and endBlock must be in the same epoch.
   */
  setBitmapForInterval = proxySend(this.kit, this.contract.methods.setBitmapForInterval)

  /**
   * Shows if the user already called the `setBitmapForInterval` for
   * the specific interval.
   * @param startBlock First block of a calculated downtime interval.
   * @param endBlock Last block of the calculated downtime interval.
   * @return True if the user already called the `setBitmapForInterval` for
   * the specific interval.
   */
  isBitmapSetForInterval = proxyCall(this.contract.methods.isBitmapSetForInterval)

  /**
   * Tests if the given validator or signer did not sign any blocks in the interval.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
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
   * Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
   * intervals.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   * @param signerIndices Indices of the signer within the validator set for every epoch change.
   * @return True if the validator signature does not appear in any block within the window.
   */
  wasDownForIntervals = proxyCall(this.contract.methods.wasDownForIntervals)

  /**
   * Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
   * intervals.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   * @return True if the validator signature does not appear in any block within the window.
   */
  async wasValidatorDown(
    validatorOrSignerAddress: Address,
    startBlocks: number[],
    endBlocks: number[]
  ) {
    if (startBlocks.length === 0 || startBlocks.length !== endBlocks.length) {
      throw new Error(
        'StartBlocks and endBlocks arrays should have at least one element and have the same length'
      )
    }
    const window = await this.getSlashableDowntimeWindow(startBlocks[0], undefined)

    const signerIndices = []
    signerIndices.push(await this.getValidatorSignerIndex(validatorOrSignerAddress, window.start))
    const startEpoch = await this.kit.getEpochNumberOfBlock(window.start)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    if (startEpoch < endEpoch) {
      signerIndices.push(await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end))
    }
    return this.wasDownForIntervals(startBlocks, endBlocks, signerIndices)
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
   * Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
   * intervals.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   */
  async slashValidator(
    validatorOrSignerAddress: Address,
    startBlocks: number[],
    endBlocks: number[]
  ): Promise<CeloTransactionObject<void>> {
    if (startBlocks.length === 0 || startBlocks.length !== endBlocks.length) {
      throw new Error(
        'StartBlocks and endBlocks arrays should have at least one element and have the same length'
      )
    }
    return this.slashStartSignerIndex(
      await this.getValidatorSignerIndex(validatorOrSignerAddress, startBlocks[0]),
      startBlocks,
      endBlocks
    )
  }

  /**
   * Returns true if the validator did not sign any blocks for the specified overlapping or adjacent
   * intervals.
   * @param startSignerIndex Validator index at the first block.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   */
  async slashStartSignerIndex(
    startSignerIndex: number,
    startBlocks: number[],
    endBlocks: number[]
  ): Promise<CeloTransactionObject<void>> {
    if (startBlocks.length === 0 || startBlocks.length !== endBlocks.length) {
      throw new Error(
        'StartBlocks and endBlocks arrays should have at least one element and have the same length'
      )
    }
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startBlocks[0])

    const window = await this.getSlashableDowntimeWindow(startBlocks[0])
    const startEpoch = await this.kit.getEpochNumberOfBlock(window.start)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    const signerIndices = [startSignerIndex]
    if (startEpoch < endEpoch) {
      signerIndices.push(findAddressIndex(signer, await election.getValidatorSigners(window.end)))
    }
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, window, startBlocks, endBlocks, signerIndices)
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param slashableWindow Window of the blocks to slash.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  private async slash(
    validator: Validator,
    slashableWindow: DowntimeWindow,
    startBlocks: number[],
    endBlocks: number[],
    signerIndices: number[]
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
        startBlocks,
        endBlocks,
        signerIndices,
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
   * @param length Window length.
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

import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasherSlots } from '../generated/DowntimeSlasherSlots'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator } from './Validators'

export interface DowntimeSlasherSlotsConfig {
  slashableDowntime: number
  slashingIncentives: {
    reward: BigNumber
    penalty: BigNumber
  }
  slotSize: number
  oncePerEpoch: boolean
}

export interface DowntimeWindow {
  start: number
  end: number
  length: number
}

/**
 * Contract handling slashing for Validator downtime using slots
 */
export class DowntimeSlasherSlotsWrapper extends BaseWrapper<DowntimeSlasherSlots> {
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

  /**
   * Returns slot size in blocks.
   * @return The number of consecutive blocks of a slot required to validate before for the
   * Validator
   */
  slotSize = proxyCall(this.contract.methods.slotSize, undefined, valueToInt)

  /**
   * Returns the oncePerEpoch configuration if it's possible to slash the same validator in
   * the same epoch.
   * @returns Boolean that shows it the configuration is enable or disable
   */
  oncePerEpoch = proxyCall(this.contract.methods.oncePerEpoch)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<DowntimeSlasherSlotsConfig> {
    const res = await Promise.all([
      this.slashableDowntime(),
      this.slashingIncentives(),
      this.slotSize(),
      this.oncePerEpoch(),
    ])
    return {
      slashableDowntime: res[0],
      slashingIncentives: res[1],
      slotSize: res[2],
      oncePerEpoch: res[3],
    }
  }

  /**
   * Tests if a validator has been down.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  isDownForSlot = proxyCall(this.contract.methods.isDownForSlot)

  /**
   * Tests if the given validator or signer has been down in the slot.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the slot, undefined if using endBlock.
   * @param endBlock Last block of the slot. Determined from startBlock or grandparent of latest block if not provided.
   */
  async isValidatorDownForSlot(
    validatorOrSignerAddress: Address,
    startBlock?: number,
    endBlock?: number
  ) {
    const window = await this.getSlotWindow(startBlock, endBlock)
    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      window.start
    )
    const endSignerIndex = await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)
    return this.isDownForSlot(window.start, startSignerIndex, endSignerIndex)
  }

  /**
   * Tests if a validator has been down.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  isDown = proxyCall(this.contract.methods.isDown)

  /**
   * Tests if the given validator or signer has been down.
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false, require to have the
   * slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the previous Slot response (this
   * would save gas if one slot was not down). Otherwise will trigger every slot at the same time (will save time).
   */
  async isValidatorDown(
    validatorOrSignerAddress: Address,
    startBlock?: number,
    endBlock?: number,
    calculateSlots: boolean = true,
    calculateSlotsAsync: boolean = true
  ) {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)
    const startSignerIndex = await this.getValidatorSignerIndex(
      validatorOrSignerAddress,
      window.start
    )
    const endSignerIndex = await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end)
    if (calculateSlots) {
      return this.calculateSlots(
        validatorOrSignerAddress,
        window,
        startSignerIndex,
        endSignerIndex,
        calculateSlotsAsync
      )
    }
    return this.isDown(window.start, startSignerIndex, endSignerIndex)
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
   * Slash a Validator for downtime.
   * @param validator Validator account or signer to slash for downtime.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashValidator(
    validatorOrSignerAddress: Address,
    startBlock?: number,
    endBlock?: number,
    calculateSlots: boolean = true,
    calculateSlotsAsync: boolean = true
  ): Promise<CeloTransactionObject<void>> {
    const window = await this.getSlashableDowntimeWindow(startBlock, endBlock)
    return this.slashEndSignerIndex(
      window.end,
      await this.getValidatorSignerIndex(validatorOrSignerAddress, window.end),
      calculateSlots,
      calculateSlotsAsync
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashStartSignerIndex(
    startBlock: number,
    startSignerIndex: number,
    calculateSlots: boolean = true,
    calculateSlotsAsync: boolean = true
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    // Follows DowntimeSlasher.getEndBlock()
    const window = await this.getSlashableDowntimeWindow(startBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(window.end)
    const endSignerIndex =
      startEpoch === endEpoch
        ? startSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(window.end))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(
      validator,
      window,
      startSignerIndex,
      endSignerIndex,
      calculateSlots,
      calculateSlotsAsync
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param endBlock The last block of the downtime to slash for.
   * @param endSignerIndex Validator index at the last block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  async slashEndSignerIndex(
    endBlock: number,
    endSignerIndex: number,
    calculateSlots: boolean = true,
    calculateSlotsAsync: boolean = true
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(endSignerIndex, endBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const slashableWindow = await this.getSlashableDowntimeWindow(undefined, endBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(slashableWindow.start)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(slashableWindow.start))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(
      validator,
      slashableWindow,
      startSignerIndex,
      endSignerIndex,
      calculateSlots,
      calculateSlotsAsync
    )
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   * @param calculateSlots Default: true. Flag to force the Slot calculations. If it's false,
   * require to have the slots precalculated, otherwise won't validate
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  private async slash(
    validator: Validator,
    slashableWindow: DowntimeWindow,
    startSignerIndex: number,
    endSignerIndex: number,
    calculateSlots: boolean = true,
    calculateSlotsAsync: boolean = true
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

    if (calculateSlots) {
      await this.calculateSlots(
        validator.address,
        slashableWindow,
        startSignerIndex,
        endSignerIndex,
        calculateSlotsAsync
      )
    }

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        slashableWindow.start,
        startSignerIndex,
        endSignerIndex,
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
   * Calculate the slashable slot window with respect to a provided start or end block number.
   * @param startBlock First block of the slot. Determined from endBlock if not provided.
   * @param endBlock Last block of the slot. Determined from startBlock or grandparent of latest block if not provided.
   */
  private async getSlotWindow(startBlock?: number, endBlock?: number): Promise<DowntimeWindow> {
    const length = await this.slotSize()
    return this.getDowntimeWindow(length, startBlock, endBlock)
  }

  /**
   * Calculate all the slots required to cover the SlashableDowntime window. This function
   * @param validatorOrSignerAddress Address of the validator account or signer.
   * @param slashableWindow Slashable Downtime Window to cover with the slots
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   * @param calculateSlotsAsync Default: true. If 'calculatedSlots' set, will wait the
   * previous Slot response (this would save gas if one slot was not down). Otherwise will
   * trigger every slot at the same time (will save time).
   */
  private async calculateSlots(
    validatorOrSignerAddress: Address,
    slashableWindow: DowntimeWindow,
    startSignerIndex: number,
    endSignerIndex: number,
    calculateSlotsAsync: boolean = true
  ): Promise<boolean> {
    const slotSize = await this.slotSize()
    const promisesForAsync = []

    // This will save some calls when the endSignerIndex and the lastEndSigner are the same and
    // will use the
    let startSignerIndexSlot = startSignerIndex
    let endSignerIndexSlot = endSignerIndex
    for (let i = slashableWindow.start; i <= slashableWindow.end; i += slotSize) {
      // We are in the last epoch of the window or in the last slot
      if (startSignerIndexSlot === endSignerIndex || slashableWindow.end < i + slotSize) {
        endSignerIndexSlot = endSignerIndex
      } else {
        endSignerIndexSlot = await this.getValidatorSignerIndex(
          validatorOrSignerAddress,
          i + slotSize - 1
        )
      }
      if (calculateSlotsAsync) {
        if (!(await this.isDownForSlot(i, startSignerIndexSlot, endSignerIndexSlot))) {
          return false
        }
      } else {
        promisesForAsync.push(this.isDownForSlot(i, startSignerIndexSlot, endSignerIndexSlot))
      }
      if (endSignerIndexSlot === endSignerIndex) {
        startSignerIndexSlot = endSignerIndexSlot
      } else {
        startSignerIndexSlot = await this.getValidatorSignerIndex(
          validatorOrSignerAddress,
          i + slotSize
        )
      }
    }
    if (calculateSlotsAsync) {
      return true
    }
    const responses = await Promise.all(promisesForAsync)

    return responses.reduce((prev, current) => prev && current, true)
  }

  /**
   * Calculate the downtime window with respect to a length and a provided start or end block number.
   * @param length Window length
   * @param startBlock First block of the slot. Determined from endBlock if not provided.
   * @param endBlock Last block of the slot. Determined from startBlock or grandparent of latest block if not provided.
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

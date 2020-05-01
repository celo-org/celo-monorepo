import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasher } from '../generated/DowntimeSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator } from './Validators'

export interface DowntimeSlasherConfig {
  slashableDowntime: number
}

/**
 * Contract handling slashing for Validator downtime
 */
export class DowntimeSlasherWrapper extends BaseWrapper<DowntimeSlasher> {
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
   * Tests if a validator has been down.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  isDown = proxyCall(this.contract.methods.isDown)

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param startBlock First block of the downtime, undefined if using endBlock.
   * @param endBlock Last block of the downtime.
   */
  async slashValidator(
    validatorAddress: Address,
    startBlock?: number,
    endBlock?: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    if (endBlock) {
      const validator = await validators.getValidator(validatorAddress, endBlock)
      return this.slashEndSignerIndex(
        endBlock,
        findAddressIndex(validator.signer, await election.getValidatorSigners(endBlock))
      )
    } else if (startBlock) {
      const validator = await validators.getValidator(validatorAddress, startBlock)
      return this.slashStartSignerIndex(
        startBlock,
        findAddressIndex(validator.signer, await election.getValidatorSigners(startBlock))
      )
    } else {
      throw new Error(`No block specified`)
    }
  }

  /**
   * Slash a Validator for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   */
  async slashStartSignerIndex(
    startBlock: number,
    startSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(startSignerIndex, startBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    // Follows DowntimeSlasher.getEndBlock()
    const endBlock = startBlock + (await this.slashableDowntime()) - 1
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    const endSignerIndex =
      startEpoch === endEpoch
        ? startSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(endBlock))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, startBlock, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param endBlock The last block of the downtime to slash for.
   * @param endSignerIndex Validator index at the last block.
   */
  async slashEndSignerIndex(
    endBlock: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signer = await election.validatorSignerAddressFromSet(endSignerIndex, endBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const startBlock = endBlock - (await this.slashableDowntime()) + 1
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : findAddressIndex(signer, await election.getValidatorSigners(startBlock))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator, startBlock, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  private async slash(
    validator: Validator,
    startBlock: number,
    startSignerIndex: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const validators = await this.kit.contracts.getValidators()
    const membership = await validators.getValidatorMembershipHistoryIndex(validator, startBlock)
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
        startBlock,
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
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<DowntimeSlasherConfig> {
    const res = await Promise.all([this.slashableDowntime()])
    return {
      slashableDowntime: res[0],
    }
  }
}

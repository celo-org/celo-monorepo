import { findAddressIndex } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { DowntimeSlasher } from '../generated/types/DowntimeSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'

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
   * @param startBlock First block of the downtime.
   */
  async slashValidator(
    validatorAddress: Address,
    startBlock: number
  ): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    return this.slashStartSignerIndex(
      startBlock,
      findAddressIndex(validator.signer, await validators.getSignersForBlock(startBlock))
    )
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
    const validators = await this.kit.contracts.getValidators()
    const signer = await validators.validatorSignerAddressFromSet(startSignerIndex, startBlock)
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    // Follows DowntimeSlasher.getEndBlock()
    const endBlock = startBlock + (await this.slashableDowntime()) - 1
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    const endSignerIndex =
      startEpoch === endEpoch
        ? startSignerIndex
        : findAddressIndex(signer, await validators.getSignersForBlock(endBlock))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator.address, startBlock, startSignerIndex, endSignerIndex)
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
    const validators = await this.kit.contracts.getValidators()
    const signer = await validators.validatorSignerAddressFromSet(endSignerIndex, endBlock)
    const endEpoch = await this.kit.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const startBlock = endBlock - (await this.slashableDowntime()) + 1
    const startEpoch = await this.kit.getEpochNumberOfBlock(startBlock)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : findAddressIndex(signer, await validators.getSignersForBlock(startBlock))
    const validator = await validators.getValidatorFromSigner(signer)
    return this.slash(validator.address, startBlock, startSignerIndex, endSignerIndex)
  }

  /**
   * Slash a Validator for downtime.
   * @param validator Validator to slash for downtime.
   * @param startBlock First block of the downtime.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
   */
  async slash(
    validator: Address,
    startBlock: number,
    startSignerIndex: number,
    endSignerIndex: number
  ): Promise<CeloTransactionObject<void>> {
    const incentives = await this.slashingIncentives()
    const validators = await this.kit.contracts.getValidators()
    const membership = await validators.getValidatorGroupMembership(validator, startBlock)
    const lockedGold = await this.kit.contracts.getLockedGold()
    const slashValidator = await lockedGold.computeParametersForSlashing(
      validator,
      incentives.penalty
    )
    const slashGroup = await lockedGold.computeParametersForSlashing(
      membership.group,
      incentives.penalty
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
}

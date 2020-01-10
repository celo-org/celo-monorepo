import { Address } from '../base'
import { DowntimeSlasher } from '../generated/types/DowntimeSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToInt,
} from './BaseWrapper'

/**
 * Contract handling slashing for Validator downtime
 */
export class DowntimeSlasherWrapper extends BaseWrapper<DowntimeSlasher> {
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
      validators.findSignerIndex(await validators.getSignersForBlock(startBlock), validator.signer)
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
        : validators.findSignerIndex(await validators.getSignersForBlock(endBlock), signer)
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
        : validators.findSignerIndex(await validators.getSignersForBlock(startBlock), signer)
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
    const validators = await this.kit.contracts.getValidators()
    const membership = await validators.getGroupMembershipAtBlock(validator, startBlock)

    const election = await this.kit.contracts.getElection()
    const eligibleGroups = await election.getEligibleValidatorGroupsVotes()
    const validatorVotes = await election.findLessersAndGreaters(
      await election.getGroupsVotedForByAccount(validator),
      eligibleGroups
    )
    const groupVotes = await election.findLessersAndGreaters(
      await election.getGroupsVotedForByAccount(membership.group),
      eligibleGroups
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        startBlock,
        startSignerIndex,
        endSignerIndex,
        membership.historyIndex,
        validatorVotes.lesser,
        validatorVotes.greater,
        validatorVotes.index,
        groupVotes.lesser,
        groupVotes.greater,
        groupVotes.index
      )
    )
  }
}

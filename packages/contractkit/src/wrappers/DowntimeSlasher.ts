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
  getEpochNumberOfBlock = proxyCall(
    this.contract.methods.getEpochNumberOfBlock,
    undefined,
    valueToInt
  )

  slashableDowntime = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

  isDown = proxyCall(this.contract.methods.isDown)

  async slashValidator(
    validatorAddress: Address,
    startBlock: number
  ): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    return this.slash(
      startBlock,
      validators.findSignerIndex(await validators.getSignersForBlock(startBlock), validator.signer)
    )
  }

  async slash(endBlock: number, endSignerIndex: number): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const signer = await this.contract.methods
      .validatorSignerAddressFromSet(endSignerIndex, endBlock)
      .call()
    const endEpoch = await this.getEpochNumberOfBlock(endBlock)
    // Reverses DowntimeSlasher.getEndBlock()
    const startBlock = endBlock - (await this.slashableDowntime()) + 1
    const startEpoch = await this.getEpochNumberOfBlock(startBlock)
    const startSignerIndex =
      startEpoch === endEpoch
        ? endSignerIndex
        : validators.findSignerIndex(await validators.getSignersForBlock(startBlock), signer)

    const validator = await validators.getValidatorFromSigner(signer)
    const history = await validators.getValidatorMembershipHistory(validator.address)
    const historyIndex = validators.findMembershipHistoryIndexForEpoch(history, startEpoch)
    const group = history[historyIndex].group

    const election = await this.kit.contracts.getElection()
    const eligibleGroups = await election.getEligibleValidatorGroupsVotes()
    const validatorVotes = await election.findLessersAndGreaters(
      await election.getGroupsVotedForByAccount(validator.address),
      eligibleGroups
    )
    const groupVotes = await election.findLessersAndGreaters(
      await election.getGroupsVotedForByAccount(group),
      eligibleGroups
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.slash(
        startBlock,
        startSignerIndex,
        endSignerIndex,
        historyIndex,
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

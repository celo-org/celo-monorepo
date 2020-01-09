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
      await validators.findSignerIndexForBlock(validator.signer, startBlock)
    )
  }

  async slash(startBlock: number, signerIndex: number): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const signer = await this.contract.methods
      .validatorSignerAddressFromSet(signerIndex, startBlock)
      .call()
    const startEpoch = await this.getEpochNumberOfBlock(startBlock)
    // DowntimeSlasher.getEndBlock()
    const endBlock = startBlock + (await this.slashableDowntime()) - 1
    const endEpoch = await this.getEpochNumberOfBlock(endBlock)
    const endIndex =
      startEpoch === endEpoch
        ? signerIndex
        : await validators.findSignerIndexForBlock(signer, endBlock)

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
        signerIndex,
        endIndex,
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

import { Address } from '../base'
import { DoubleSigningSlasher } from '../generated/types/DoubleSigningSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToInt,
} from './BaseWrapper'

/**
 * Contract handling slashing for Validator double-signing
 */
export class DoubleSigningSlasherWrapper extends BaseWrapper<DoubleSigningSlasher> {
  getEpochNumberOfBlock = proxyCall(
    this.contract.methods.getEpochNumberOfBlock,
    undefined,
    valueToInt
  )

  getBlockNumberFromHeader = proxyCall(
    this.contract.methods.getBlockNumberFromHeader,
    undefined,
    valueToInt
  )

  async slash(
    signerIndex: number,
    headerA: string,
    headerB: string
  ): Promise<CeloTransactionObject<void>> {
    const blockNumber = await this.getBlockNumberFromHeader([headerA])
    const blockEpoch = await this.getEpochNumberOfBlock(blockNumber)

    const validators = await this.kit.contracts.getValidators()
    const signer: Address = await this.contract.methods
      .validatorSignerAddressFromSet(signerIndex, blockNumber)
      .call()

    const validator = await validators.getValidatorFromSigner(signer)
    const history = await validators.getValidatorMembershipHistory(validator.address)
    const historyIndex = validators.findMembershipHistoryIndexForEpoch(history, blockEpoch)
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
        signer,
        signerIndex,
        [headerA],
        [headerB],
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

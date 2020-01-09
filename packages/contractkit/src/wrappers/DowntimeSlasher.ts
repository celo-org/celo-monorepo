import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { Address, NULL_ADDRESS } from '../base'
import { DowntimeSlasher } from '../generated/types/DowntimeSlasher'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
  valueToInt,
} from './BaseWrapper'
import { ValidatorGroupVote } from './Election'
import { GroupMembership } from './Validators'

/**
 * Contract handling slashing for Validator downtime
 */
export class DowntimeSlasherWrapper extends BaseWrapper<DowntimeSlasher> {
  getEpochNumberOfBlock = proxyCall(
    this.contract.methods.getEpochNumberOfBlock,
    undefined,
    valueToInt
  )

  numberValidatorsInSet = proxyCall(
    this.contract.methods.numberValidatorsInSet,
    undefined,
    valueToInt
  )

  validatorSignerAddressFromSet = proxyCall(this.contract.methods.validatorSignerAddressFromSet)

  slashableDowntime = proxyCall(this.contract.methods.slashableDowntime, undefined, valueToInt)

  isDown = proxyCall(this.contract.methods.isDown)

  async slashValidator(
    validatorAddress: Address,
    startBlock: number
  ): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidator(validatorAddress)
    return this.slash(startBlock, await this.findSignerIndexForBlock(validator.signer, startBlock))
  }

  async slash(startBlock: number, signerIndex: number): Promise<CeloTransactionObject<void>> {
    const signer = await this.contract.methods
      .validatorSignerAddressFromSet(signerIndex, startBlock)
      .call()
    const startEpoch = await this.getEpochNumberOfBlock(startBlock)
    // DowntimeSlasher.getEndBlock()
    const endBlock = startBlock + (await this.slashableDowntime()) - 1
    const endEpoch = await this.getEpochNumberOfBlock(endBlock)
    const endIndex =
      startEpoch === endEpoch ? signerIndex : await this.findSignerIndexForBlock(signer, endBlock)

    const validators = await this.kit.contracts.getValidators()
    const validator = await validators.getValidatorFromSigner(signer)
    const history = await validators.getValidatorMembershipHistory(validator.address)
    const historyIndex = this.findMembershipHistoryIndexForEpoch(history, startEpoch)
    const group = history[historyIndex].group

    const election = await this.kit.contracts.getElection()
    const eligibleGroups = await election.getEligibleValidatorGroupsVotes()
    const validatorVotes = await this.findLesserAndGreaterKeys(
      await election.getGroupsVotedForByAccount(validator.address),
      eligibleGroups
    )
    const groupVotes = await this.findLesserAndGreaterKeys(
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
        validatorVotes.lesserKey,
        validatorVotes.greaterKey,
        validatorVotes.indexKey,
        groupVotes.lesserKey,
        groupVotes.greaterKey,
        groupVotes.indexKey
      )
    )
  }

  private findMembershipHistoryIndexForEpoch(history: GroupMembership[], epoch: number): number {
    for (let index = history.length - 1; index >= 0; index--) {
      if (history[index].epoch <= epoch) {
        return index
      }
    }
    throw new Error(`No group membership for epoch ${epoch}`)
  }

  private async findSignerIndexForBlock(signer: Address, blockNumber: number): Promise<number> {
    const numValidators = await this.numberValidatorsInSet(blockNumber)
    const signerIndices = Array.from(Array(numValidators), (_, i) => i)
    const signers = await concurrentMap(10, signerIndices, (i) =>
      this.validatorSignerAddressFromSet(i, blockNumber)
    )
    for (let i = 0; i < numValidators; i++) {
      if (signers[i] === signer) {
        return i
      }
    }
    throw new Error(`No signer ${signer} for block ${blockNumber}`)
  }

  private findLesserAndGreaterKeys(
    groupsVotedFor: Address[],
    eligible: ValidatorGroupVote[]
  ): { indexKey: number[]; lesserKey: Address[]; greaterKey: Address[] } {
    const indexKey: number[] = []
    const lesserKey: Address[] = []
    const greaterKey: Address[] = []
    for (const votedGroup of groupsVotedFor) {
      const index = eligible.findIndex((votes) => eqAddress(votes.address, votedGroup))
      indexKey.push(index)
      lesserKey.push(index === 0 ? NULL_ADDRESS : eligible[index - 1].address)
      greaterKey.push(index === eligible.length - 1 ? NULL_ADDRESS : eligible[index + 1].address)
    }
    return { indexKey, lesserKey, greaterKey }
  }
}

import { eqAddress } from '@celo/utils/lib/address'
import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { Address, NULL_ADDRESS } from '../base'
import { Election } from '../generated/types/Election'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toBigNumber,
  toNumber,
  wrapSend,
} from './BaseWrapper'

export interface Validator {
  address: Address
  id: string
  name: string
  url: string
  publicKey: string
  affiliation: string | null
}

export interface ValidatorGroup {
  address: Address
  id: string
  name: string
  url: string
  members: Address[]
}

export interface ValidatorGroupVote {
  address: Address
  votes: BigNumber
  eligible: boolean
}

export interface ElectionConfig {
  minElectableValidators: BigNumber
  maxElectableValidators: BigNumber
  electabilityThreshold: BigNumber
  maxNumGroupsVotedFor: BigNumber
}

/**
 * Contract for voting for validators and managing validator groups.
 */
export class ElectionWrapper extends BaseWrapper<Election> {
  activate = proxySend(this.kit, this.contract.methods.activate)
  /**
   * Returns the minimum number of validators that can be elected.
   * @returns The minimum number of validators that can be elected.
   */
  minElectableValidators = proxyCall(
    this.contract.methods.minElectableValidators,
    undefined,
    toBigNumber
  )
  /**
   * Returns the maximum number of validators that can be elected.
   * @returns The maximum number of validators that can be elected.
   */
  maxElectableValidators = proxyCall(
    this.contract.methods.maxElectableValidators,
    undefined,
    toBigNumber
  )
  /**
   * Returns the current election threshold.
   * @returns Election threshold.
   */
  electabilityThreshold = proxyCall(
    this.contract.methods.getElectabilityThreshold,
    undefined,
    toBigNumber
  )
  validatorAddressFromCurrentSet = proxyCall(this.contract.methods.validatorAddressFromCurrentSet)
  numberValidatorsInCurrentSet = proxyCall(
    this.contract.methods.numberValidatorsInCurrentSet,
    undefined,
    toNumber
  )

  getGroupsVotedFor: (account: Address) => Promise<Address[]> = proxyCall(
    this.contract.methods.getGroupsVotedFor
  )

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ElectionConfig> {
    const res = await Promise.all([
      this.minElectableValidators(),
      this.maxElectableValidators(),
      this.electabilityThreshold(),
      this.contract.methods.maxNumGroupsVotedFor().call(),
    ])
    return {
      minElectableValidators: res[0],
      maxElectableValidators: res[1],
      electabilityThreshold: res[2],
      maxNumGroupsVotedFor: toBigNumber(res[3]),
    }
  }

  async getValidatorSetAddresses(): Promise<string[]> {
    const numberValidators = await this.numberValidatorsInCurrentSet()

    const validatorAddressPromises = []

    for (let i = 0; i < numberValidators; i++) {
      validatorAddressPromises.push(this.validatorAddressFromCurrentSet(i))
    }

    return Promise.all(validatorAddressPromises)
  }

  async getValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const validators = await this.kit.contracts.getValidators()
    const vgAddresses = (await validators.getRegisteredValidatorGroups()).map((g) => g.address)
    const vgVotes = await Promise.all(
      vgAddresses.map((g) => this.contract.methods.getGroupTotalVotes(g).call())
    )
    const vgEligible = await Promise.all(
      vgAddresses.map((g) => this.contract.methods.getGroupEligibility(g).call())
    )
    return vgAddresses.map((a, i) => ({
      address: a,
      votes: toBigNumber(vgVotes[i]),
      eligible: vgEligible[i],
    }))
  }

  async getEligibleValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const res = await this.contract.methods.getEligibleValidatorGroupsVoteTotals().call()
    return zip((a, b) => ({ address: a, votes: new BigNumber(b), eligible: true }), res[0], res[1])
  }

  /*
  async revokeVote(): Promise<CeloTransactionObject<boolean>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }

    const lockedGold = await this.kit.contracts.getLockedGold()
    const votingDetails = await lockedGold.getVotingDetails(this.kit.defaultAccount)
    const votedGroup = await this.getVoteFrom(votingDetails.accountAddress)

    if (votedGroup == null) {
      throw new Error(`Not current vote for ${this.kit.defaultAccount}`)
    }

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(
      votedGroup,
      votingDetails.weight.negated()
    )

    return wrapSend(this.kit, this.contract.methods.revokeVote(lesser, greater))
  }
  */

  async vote(validatorGroup: Address, value: BigNumber): Promise<CeloTransactionObject<boolean>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(validatorGroup, value)

    return wrapSend(
      this.kit,
      this.contract.methods.vote(validatorGroup, value.toString(), lesser, greater)
    )
  }

  private async findLesserAndGreaterAfterVote(
    votedGroup: Address,
    voteWeight: BigNumber
  ): Promise<{ lesser: Address; greater: Address }> {
    const currentVotes = await this.getEligibleValidatorGroupsVotes()

    const selectedGroup = currentVotes.find((cv) => eqAddress(cv.address, votedGroup))

    // modify the list
    if (selectedGroup) {
      selectedGroup.votes = selectedGroup.votes.plus(voteWeight)
    } else {
      currentVotes.push({
        address: votedGroup,
        votes: voteWeight,
        eligible: true,
      })
    }

    // re-sort
    currentVotes.sort((a, b) => a.votes.comparedTo(b.votes))

    // find new index
    const newIdx = currentVotes.findIndex((cv) => eqAddress(cv.address, votedGroup))

    return {
      lesser: newIdx === 0 ? NULL_ADDRESS : currentVotes[newIdx - 1].address,
      greater: newIdx === currentVotes.length - 1 ? NULL_ADDRESS : currentVotes[newIdx + 1].address,
    }
  }
}

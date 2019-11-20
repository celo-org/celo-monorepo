import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { Address, NULL_ADDRESS } from '../base'
import { Election } from '../generated/types/Election'
import {
  BaseWrapper,
  CeloTransactionObject,
  identity,
  proxyCall,
  proxySend,
  toBigNumber,
  toNumber,
  toTransactionObject,
  tupleParser,
} from './BaseWrapper'

export interface ValidatorGroupVote {
  address: Address
  votes: BigNumber
  capacity: BigNumber
  eligible: boolean
}

export interface ElectableValidators {
  min: BigNumber
  max: BigNumber
}

export interface ElectionConfig {
  electableValidators: ElectableValidators
  electabilityThreshold: BigNumber
  maxNumGroupsVotedFor: BigNumber
}

/**
 * Contract for voting for validators and managing validator groups.
 */
export class ElectionWrapper extends BaseWrapper<Election> {
  activate = proxySend(this.kit, this.contract.methods.activate)
  /**
   * Returns the minimum and maximum number of validators that can be elected.
   * @returns The minimum and maximum number of validators that can be elected.
   */
  async electableValidators(): Promise<ElectableValidators> {
    const { min, max } = await this.contract.methods.electableValidators().call()
    return { min: toBigNumber(min), max: toBigNumber(max) }
  }
  /**
   * Returns the current election threshold.
   * @returns Election threshold.
   */
  electabilityThreshold = proxyCall(
    this.contract.methods.getElectabilityThreshold,
    undefined,
    toBigNumber
  )
  validatorAddressFromCurrentSet: (index: number) => Promise<Address> = proxyCall(
    this.contract.methods.validatorAddressFromCurrentSet,
    tupleParser<number, number>(identity)
  )

  numberValidatorsInCurrentSet = proxyCall(
    this.contract.methods.numberValidatorsInCurrentSet,
    undefined,
    toNumber
  )

  /**
   * Returns get current validator signers using the precompiles.
   * @return List of current validator signers.
   */
  getCurrentValidatorSigners = proxyCall(this.contract.methods.getCurrentValidatorSigners)
  /**
   * Returns a list of elected validators with seats allocated to groups via the D'Hondt method.
   * @return The list of elected validators.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   */
  electValidatorSigners = proxyCall(this.contract.methods.electValidatorSigners)

  /**
   * Returns the total votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The total votes for `group` made by `account`.
   */
  getTotalVotesForGroup = proxyCall(
    this.contract.methods.getTotalVotesForGroup,
    undefined,
    toBigNumber
  )

  /**
   * Returns the groups that `account` has voted for.
   * @param account The address of the account casting votes.
   * @return The groups that `account` has voted for.
   */
  getGroupsVotedForByAccount: (account: Address) => Promise<Address[]> = proxyCall(
    this.contract.methods.getGroupsVotedForByAccount
  )

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ElectionConfig> {
    const res = await Promise.all([
      this.electableValidators(),
      this.electabilityThreshold(),
      this.contract.methods.maxNumGroupsVotedFor().call(),
    ])
    return {
      electableValidators: res[0],
      electabilityThreshold: res[1],
      maxNumGroupsVotedFor: toBigNumber(res[2]),
    }
  }

  async getValidatorGroupVotes(address: Address): Promise<ValidatorGroupVote> {
    const votes = await this.contract.methods.getTotalVotesForGroup(address).call()
    const eligible = await this.contract.methods.getGroupEligibility(address).call()
    const numVotesReceivable = await this.contract.methods.getNumVotesReceivable(address).call()
    return {
      address,
      votes: toBigNumber(votes),
      capacity: toBigNumber(numVotesReceivable).minus(votes),
      eligible,
    }
  }
  /**
   * Returns the current registered validator groups and their total votes and eligibility.
   */
  async getValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const validators = await this.kit.contracts.getValidators()
    const groups = (await validators.getRegisteredValidatorGroups()).map((g) => g.address)
    return concurrentMap(5, groups, (g) => this.getValidatorGroupVotes(g))
  }

  /**
   * Increments the number of total and pending votes for `group`.
   * @param validatorGroup The validator group to vote for.
   * @param value The amount of gold to use to vote.
   */
  async vote(validatorGroup: Address, value: BigNumber): Promise<CeloTransactionObject<boolean>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing kit.defaultAccount`)
    }

    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(validatorGroup, value)

    return toTransactionObject(
      this.kit,
      this.contract.methods.vote(validatorGroup, value.toString(), lesser, greater)
    )
  }

  /**
   * Returns the current eligible validator groups and their total votes.
   */
  private async getEligibleValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const res = await this.contract.methods.getTotalVotesForEligibleValidatorGroups().call()
    return zip(
      (a, b) => ({
        address: a,
        votes: new BigNumber(b),
        capacity: new BigNumber(0),
        eligible: true,
      }),
      res[0],
      res[1]
    )
  }

  async findLesserAndGreaterAfterVote(
    votedGroup: Address,
    voteWeight: BigNumber
  ): Promise<{ lesser: Address; greater: Address }> {
    const currentVotes = await this.getEligibleValidatorGroupsVotes()

    const selectedGroup = currentVotes.find((votes) => eqAddress(votes.address, votedGroup))

    // modify the list
    if (selectedGroup) {
      selectedGroup.votes = selectedGroup.votes.plus(voteWeight)
    } else {
      currentVotes.push({
        address: votedGroup,
        votes: voteWeight,
        // Not used for the purposes of finding lesser and greater.
        capacity: new BigNumber(0),
        eligible: true,
      })
    }

    // re-sort
    currentVotes.sort((a, b) => a.votes.comparedTo(b.votes))

    // find new index
    const newIdx = currentVotes.findIndex((votes) => eqAddress(votes.address, votedGroup))

    return {
      lesser: newIdx === 0 ? NULL_ADDRESS : currentVotes[newIdx - 1].address,
      greater: newIdx === currentVotes.length - 1 ? NULL_ADDRESS : currentVotes[newIdx + 1].address,
    }
  }
}

import { eqAddress, findAddressIndex, normalizeAddress } from '@celo/utils/lib/address'
import { concurrentMap, concurrentValuesMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import { range } from 'lodash'
import { EventLog } from 'web3-core'
import { Address, NULL_ADDRESS } from '../base'
import { Election } from '../generated/Election'
import {
  BaseWrapper,
  CeloTransactionObject,
  fixidityValueToBigNumber,
  identity,
  proxyCall,
  proxySend,
  toTransactionObject,
  tupleParser,
  valueToBigNumber,
  valueToInt,
} from './BaseWrapper'
import { Validator, ValidatorGroup } from './Validators'

export interface ValidatorGroupVote {
  address: Address
  name: string
  votes: BigNumber
  capacity: BigNumber
  eligible: boolean
}

export interface Voter {
  address: Address
  votes: GroupVote[]
}

export interface VoterReward {
  address: Address
  addressPayment: BigNumber
  group: ValidatorGroup
  epochNumber: number
}

export interface GroupVote {
  group: Address
  pending: BigNumber
  active: BigNumber
}

export interface GroupVoterReward {
  group: ValidatorGroup
  groupVoterPayment: BigNumber
  epochNumber: number
}

export interface ElectableValidators {
  min: BigNumber
  max: BigNumber
}

export interface ElectionConfig {
  electableValidators: ElectableValidators
  electabilityThreshold: BigNumber
  maxNumGroupsVotedFor: BigNumber
  totalVotes: BigNumber
  currentThreshold: BigNumber
}

/**
 * Contract for voting for validators and managing validator groups.
 */
export class ElectionWrapper extends BaseWrapper<Election> {
  /**
   * Returns the minimum and maximum number of validators that can be elected.
   * @returns The minimum and maximum number of validators that can be elected.
   */
  async electableValidators(): Promise<ElectableValidators> {
    const { min, max } = await this.contract.methods.electableValidators().call()
    return { min: valueToBigNumber(min), max: valueToBigNumber(max) }
  }

  /**
   * Returns the current election threshold.
   * @returns Election threshold.
   */
  electabilityThreshold = proxyCall(
    this.contract.methods.getElectabilityThreshold,
    undefined,
    fixidityValueToBigNumber
  )

  /**
   * Gets a validator address from the validator set at the given block number.
   * @param index Index of requested validator in the validator set.
   * @param blockNumber Block number to retrieve the validator set from.
   * @return Address of validator at the requested index.
   */
  validatorSignerAddressFromSet: (
    signerIndex: number,
    blockNumber: number
  ) => Promise<Address> = proxyCall(this.contract.methods.validatorSignerAddressFromSet)

  /**
   * Gets a validator address from the current validator set.
   * @param index Index of requested validator in the validator set.
   * @return Address of validator at the requested index.
   */
  validatorSignerAddressFromCurrentSet: (index: number) => Promise<Address> = proxyCall(
    this.contract.methods.validatorSignerAddressFromCurrentSet,
    tupleParser<number, number>(identity)
  )

  /**
   * Gets the size of the validator set that must sign the given block number.
   * @param blockNumber Block number to retrieve the validator set from.
   * @return Size of the validator set.
   */
  numberValidatorsInSet: (blockNumber: number) => Promise<number> = proxyCall(
    this.contract.methods.numberValidatorsInSet,
    undefined,
    valueToInt
  )

  /**
   * Gets the size of the current elected validator set.
   * @return Size of the current elected validator set.
   */
  numberValidatorsInCurrentSet = proxyCall(
    this.contract.methods.numberValidatorsInCurrentSet,
    undefined,
    valueToInt
  )

  /**
   * Returns the total votes received across all groups.
   * @return The total votes received across all groups.
   */
  getTotalVotes = proxyCall(this.contract.methods.getTotalVotes, undefined, valueToBigNumber)

  /**
   * Returns the current validator signers using the precompiles.
   * @return List of current validator signers.
   */
  getCurrentValidatorSigners: () => Promise<Address[]> = proxyCall(
    this.contract.methods.getCurrentValidatorSigners
  )

  /**
   * Returns the validator signers for block `blockNumber`.
   * @param blockNumber Block number to retrieve signers for.
   * @return Address of each signer in the validator set.
   */
  async getValidatorSigners(blockNumber: number): Promise<Address[]> {
    const numValidators = await this.numberValidatorsInSet(blockNumber)
    return concurrentMap(10, range(0, numValidators, 1), (i: number) =>
      this.validatorSignerAddressFromSet(i, blockNumber)
    )
  }

  /**
   * Returns a list of elected validators with seats allocated to groups via the D'Hondt method.
   * @return The list of elected validators.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   */
  async electValidatorSigners(min?: number, max?: number): Promise<Address[]> {
    if (min !== undefined || max !== undefined) {
      const config = await this.getConfig()
      const minArg = min === undefined ? config.electableValidators.min : min
      const maxArg = max === undefined ? config.electableValidators.max : max
      return this.contract.methods
        .electNValidatorSigners(minArg.toString(10), maxArg.toString(10))
        .call()
    } else {
      return this.contract.methods.electValidatorSigners().call()
    }
  }

  /**
   * Returns the total votes for `group`.
   * @param group The address of the validator group.
   * @return The total votes for `group`.
   */
  async getTotalVotesForGroup(group: Address, blockNumber?: number): Promise<BigNumber> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    const votes = await this.contract.methods.getTotalVotesForGroup(group).call({}, blockNumber)
    return valueToBigNumber(votes)
  }

  /**
   * Returns the total votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The total votes for `group` made by `account`.
   */
  getTotalVotesForGroupByAccount = proxyCall(
    this.contract.methods.getTotalVotesForGroupByAccount,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the active votes for `group`.
   * @param group The address of the validator group.
   * @return The active votes for `group`.
   */
  async getActiveVotesForGroup(group: Address, blockNumber?: number): Promise<BigNumber> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    const votes = await this.contract.methods.getActiveVotesForGroup(group).call({}, blockNumber)
    return valueToBigNumber(votes)
  }

  /**
   * Returns the groups that `account` has voted for.
   * @param account The address of the account casting votes.
   * @return The groups that `account` has voted for.
   */
  getGroupsVotedForByAccount: (account: Address) => Promise<Address[]> = proxyCall(
    this.contract.methods.getGroupsVotedForByAccount
  )

  async getVotesForGroupByAccount(
    account: Address,
    group: Address,
    blockNumber?: number
  ): Promise<GroupVote> {
    const pending = await this.contract.methods
      .getPendingVotesForGroupByAccount(group, account)
      // @ts-ignore: Expected 0-1 arguments, but got 2
      .call({}, blockNumber)

    const active = await this.contract.methods
      .getActiveVotesForGroupByAccount(group, account)
      // @ts-ignore: Expected 0-1 arguments, but got 2
      .call({}, blockNumber)

    return {
      group,
      pending: valueToBigNumber(pending),
      active: valueToBigNumber(active),
    }
  }

  async getVoter(account: Address, blockNumber?: number): Promise<Voter> {
    const groups: Address[] = await this.contract.methods
      .getGroupsVotedForByAccount(account)
      // @ts-ignore: Expected 0-1 arguments, but got 2
      .call({}, blockNumber)

    const votes = await concurrentMap(10, groups, (g) =>
      this.getVotesForGroupByAccount(account, g, blockNumber)
    )
    return { address: account, votes }
  }

  /**
   * Returns whether or not the account has any pending votes.
   * @param account The address of the account casting votes.
   * @return The groups that `account` has voted for.
   */
  async hasPendingVotes(account: Address): Promise<boolean> {
    const groups: string[] = await this.contract.methods.getGroupsVotedForByAccount(account).call()
    const isPending = await Promise.all(
      groups.map(async (g) =>
        valueToBigNumber(
          await this.contract.methods.getPendingVotesForGroupByAccount(g, account).call()
        ).isGreaterThan(0)
      )
    )
    return isPending.some((a: boolean) => a)
  }

  async hasActivatablePendingVotes(account: Address): Promise<boolean> {
    const groups = await this.contract.methods.getGroupsVotedForByAccount(account).call()
    const isActivatable = await Promise.all(
      groups.map((g: string) => this.contract.methods.hasActivatablePendingVotes(account, g).call())
    )
    return isActivatable.some((a: boolean) => a)
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ElectionConfig> {
    const res = await Promise.all([
      this.electableValidators(),
      this.electabilityThreshold(),
      this.contract.methods.maxNumGroupsVotedFor().call(),
      this.getTotalVotes(),
    ])
    return {
      electableValidators: res[0],
      electabilityThreshold: res[1],
      maxNumGroupsVotedFor: valueToBigNumber(res[2]),
      totalVotes: res[3],
      currentThreshold: res[3].multipliedBy(res[1]),
    }
  }

  async getValidatorGroupVotes(address: Address): Promise<ValidatorGroupVote> {
    const votes = await this.contract.methods.getTotalVotesForGroup(address).call()
    const eligible = await this.contract.methods.getGroupEligibility(address).call()
    const numVotesReceivable = await this.contract.methods.getNumVotesReceivable(address).call()
    const accounts = await this.kit.contracts.getAccounts()
    const name = (await accounts.getName(address)) || ''
    return {
      address,
      name,
      votes: valueToBigNumber(votes),
      capacity: valueToBigNumber(numVotesReceivable).minus(votes),
      eligible,
    }
  }
  /**
   * Returns the current registered validator groups and their total votes and eligibility.
   */
  async getValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const validators = await this.kit.contracts.getValidators()
    const groups = await validators.getRegisteredValidatorGroupsAddresses()
    return concurrentMap(5, groups, (g) => this.getValidatorGroupVotes(g))
  }

  _activate = proxySend(this.kit, this.contract.methods.activate)

  /**
   * Activates any activatable pending votes.
   * @param account The account with pending votes to activate.
   */
  async activate(account: Address): Promise<Array<CeloTransactionObject<boolean>>> {
    const groups = await this.contract.methods.getGroupsVotedForByAccount(account).call()
    const isActivatable = await Promise.all(
      groups.map((g) => this.contract.methods.hasActivatablePendingVotes(account, g).call())
    )
    const groupsActivatable = groups.filter((_, i) => isActivatable[i])
    return groupsActivatable.map((g) => this._activate(g))
  }

  async revokePending(
    account: Address,
    group: Address,
    value: BigNumber
  ): Promise<CeloTransactionObject<boolean>> {
    const groups = await this.contract.methods.getGroupsVotedForByAccount(account).call()
    const index = findAddressIndex(group, groups)
    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(group, value.times(-1))

    return toTransactionObject(
      this.kit,
      this.contract.methods.revokePending(group, value.toFixed(), lesser, greater, index)
    )
  }

  async revokeActive(
    account: Address,
    group: Address,
    value: BigNumber
  ): Promise<CeloTransactionObject<boolean>> {
    const groups = await this.contract.methods.getGroupsVotedForByAccount(account).call()
    const index = findAddressIndex(group, groups)
    const { lesser, greater } = await this.findLesserAndGreaterAfterVote(group, value.times(-1))

    return toTransactionObject(
      this.kit,
      this.contract.methods.revokeActive(group, value.toFixed(), lesser, greater, index)
    )
  }

  async revoke(
    account: Address,
    group: Address,
    value: BigNumber
  ): Promise<Array<CeloTransactionObject<boolean>>> {
    const vote = await this.getVotesForGroupByAccount(account, group)
    if (value.gt(vote.pending.plus(vote.active))) {
      throw new Error(`can't revoke more votes for ${group} than have been made by ${account}`)
    }
    const txos = []
    const pendingValue = BigNumber.minimum(vote.pending, value)
    if (!pendingValue.isZero()) {
      txos.push(await this.revokePending(account, group, pendingValue))
    }
    if (pendingValue.lt(value)) {
      const activeValue = value.minus(pendingValue)
      txos.push(await this.revokeActive(account, group, activeValue))
    }
    return txos
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
      this.contract.methods.vote(validatorGroup, value.toFixed(), lesser, greater)
    )
  }

  /**
   * Returns the current eligible validator groups and their total votes.
   */
  async getEligibleValidatorGroupsVotes(): Promise<ValidatorGroupVote[]> {
    const res = await this.contract.methods.getTotalVotesForEligibleValidatorGroups().call()
    return zip(
      (a, b) => ({
        address: a,
        name: '',
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
    const voteTotal = selectedGroup ? selectedGroup.votes.plus(voteWeight) : voteWeight
    let greaterKey = NULL_ADDRESS
    let lesserKey = NULL_ADDRESS

    // This leverages the fact that the currentVotes are already sorted from
    // greatest to lowest value
    for (const vote of currentVotes) {
      if (!eqAddress(vote.address, votedGroup)) {
        if (vote.votes.isLessThanOrEqualTo(voteTotal)) {
          lesserKey = vote.address
          break
        }
        greaterKey = vote.address
      }
    }

    return { lesser: lesserKey, greater: greaterKey }
  }

  /**
   * Retrieves the set of validatorsparticipating in BFT at epochNumber.
   * @param epochNumber The epoch to retrieve the elected validator set at.
   */
  async getElectedValidators(epochNumber: number): Promise<Validator[]> {
    const blockNumber = await this.kit.getLastBlockNumberForEpoch(epochNumber)
    const signers = await this.getValidatorSigners(blockNumber)
    const validators = await this.kit.contracts.getValidators()
    return concurrentMap(10, signers, (addr) => validators.getValidatorFromSigner(addr))
  }

  /**
   * Retrieves GroupVoterRewards at epochNumber.
   * @param epochNumber The epoch to retrieve GroupVoterRewards at.
   */
  async getGroupVoterRewards(epochNumber: number): Promise<GroupVoterReward[]> {
    const blockNumber = await this.kit.getLastBlockNumberForEpoch(epochNumber)
    const events = await this.getPastEvents('EpochRewardsDistributedToVoters', {
      fromBlock: blockNumber,
      toBlock: blockNumber,
    })
    const validators = await this.kit.contracts.getValidators()
    const validatorGroup: ValidatorGroup[] = await concurrentMap(10, events, (e: EventLog) =>
      validators.getValidatorGroup(e.returnValues.group, false)
    )
    return events.map(
      (e: EventLog, index: number): GroupVoterReward => ({
        epochNumber,
        group: validatorGroup[index],
        groupVoterPayment: valueToBigNumber(e.returnValues.value),
      })
    )
  }

  /**
   * Retrieves VoterRewards for address at epochNumber.
   * @param address The address to retrieve VoterRewards for.
   * @param epochNumber The epoch to retrieve VoterRewards at.
   * @param voterShare Optionally address' share of group rewards.
   */
  async getVoterRewards(
    address: Address,
    epochNumber: number,
    voterShare?: Record<Address, BigNumber>
  ): Promise<VoterReward[]> {
    const activeVoteShare =
      voterShare ||
      (await this.getVoterShare(address, await this.kit.getLastBlockNumberForEpoch(epochNumber)))
    const groupVoterRewards = await this.getGroupVoterRewards(epochNumber)
    const voterRewards = groupVoterRewards.filter(
      (e: GroupVoterReward) => normalizeAddress(e.group.address) in activeVoteShare
    )
    return voterRewards.map(
      (e: GroupVoterReward): VoterReward => {
        const group = normalizeAddress(e.group.address)
        return {
          address,
          addressPayment: e.groupVoterPayment.times(activeVoteShare[group]),
          group: e.group,
          epochNumber: e.epochNumber,
        }
      }
    )
  }

  /**
   * Retrieves a voter's share of active votes.
   * @param address The voter to retrieve share for.
   * @param blockNumber The block to retrieve the voter's share at.
   */
  async getVoterShare(address: Address, blockNumber?: number): Promise<Record<Address, BigNumber>> {
    const activeVoterVotes: Record<Address, BigNumber> = {}
    const voter = await this.getVoter(address, blockNumber)
    for (const vote of voter.votes) {
      const group: string = normalizeAddress(vote.group)
      activeVoterVotes[group] = vote.active
    }
    return concurrentValuesMap(
      10,
      activeVoterVotes,
      async (voterVotes: BigNumber, group: Address) =>
        voterVotes.dividedBy(await this.getActiveVotesForGroup(group, blockNumber))
    )
  }
}

import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { Address, NULL_ADDRESS } from '../base'
import { Validators } from '../generated/types/Validators'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toBigNumber,
  toTransactionObject,
} from './BaseWrapper'

export interface Validator {
  address: Address
  name: string
  publicKey: string
  affiliation: string | null
  score: BigNumber
}

export interface ValidatorGroup {
  address: Address
  name: string
  members: Address[]
  commission: BigNumber
}

export interface BalanceRequirements {
  group: BigNumber
  validator: BigNumber
}

export interface DeregistrationLockups {
  group: BigNumber
  validator: BigNumber
}

export interface ValidatorsConfig {
  balanceRequirements: BalanceRequirements
  deregistrationLockups: DeregistrationLockups
  maxGroupSize: BigNumber
}

/**
 * Contract for voting for validators and managing validator groups.
 */
// TODO(asa): Support authorized validators
export class ValidatorsWrapper extends BaseWrapper<Validators> {
  affiliate = proxySend(this.kit, this.contract.methods.affiliate)
  deaffiliate = proxySend(this.kit, this.contract.methods.deaffiliate)
  removeMember = proxySend(this.kit, this.contract.methods.removeMember)
  registerValidator = proxySend(this.kit, this.contract.methods.registerValidator)
  async registerValidatorGroup(
    name: string,
    commission: BigNumber
  ): Promise<CeloTransactionObject<boolean>> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.registerValidatorGroup(name, toFixed(commission).toFixed())
    )
  }
  async addMember(group: string, member: string): Promise<CeloTransactionObject<boolean>> {
    const numMembers = await this.getGroupNumMembers(group)
    if (numMembers.isZero()) {
      const election = await this.kit.contracts.getElection()
      const voteWeight = await election.getTotalVotesForGroup(group)
      const { lesser, greater } = await election.findLesserAndGreaterAfterVote(group, voteWeight)

      return toTransactionObject(
        this.kit,
        this.contract.methods.addFirstMember(member, lesser, greater),
        { from: group }
      )
    } else {
      return toTransactionObject(this.kit, this.contract.methods.addMember(member), { from: group })
    }
  }
  /**
   * Returns the current registration requirements.
   * @returns Group and validator registration requirements.
   */
  async getBalanceRequirements(): Promise<BalanceRequirements> {
    const res = await this.contract.methods.getBalanceRequirements().call()
    return {
      group: toBigNumber(res[0]),
      validator: toBigNumber(res[1]),
    }
  }

  /**
   * Returns the lockup periods after deregistering groups and validators.
   * @return The lockup periods after deregistering groups and validators.
   */
  async getDeregistrationLockups(): Promise<DeregistrationLockups> {
    const res = await this.contract.methods.getDeregistrationLockups().call()
    return {
      group: toBigNumber(res[0]),
      validator: toBigNumber(res[1]),
    }
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ValidatorsConfig> {
    const res = await Promise.all([
      this.getBalanceRequirements(),
      this.getDeregistrationLockups(),
      this.contract.methods.maxGroupSize().call(),
    ])
    return {
      balanceRequirements: res[0],
      deregistrationLockups: res[1],
      maxGroupSize: toBigNumber(res[2]),
    }
  }

  async getRegisteredValidators(): Promise<Validator[]> {
    const vgAddresses = await this.contract.methods.getRegisteredValidators().call()

    return Promise.all(vgAddresses.map((addr) => this.getValidator(addr)))
  }

  getGroupNumMembers: (group: Address) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getGroupNumMembers,
    undefined,
    toBigNumber
  )

  async getValidator(address: Address): Promise<Validator> {
    const res = await this.contract.methods.getValidator(address).call()
    return {
      address,
      name: res[0],
      publicKey: res[1] as any,
      affiliation: res[2],
      score: fromFixed(new BigNumber(res[3])),
    }
  }

  /**
   * Returns whether a particular account has a registered validator.
   * @param account The account.
   * @return Whether a particular address is a registered validator.
   */
  isValidator = proxyCall(this.contract.methods.isValidator)

  /**
   * Returns whether a particular account has a registered validator group.
   * @param account The account.
   * @return Whether a particular address is a registered validator group.
   */
  isValidatorGroup = proxyCall(this.contract.methods.isValidatorGroup)

  async reorderMember(groupAddr: Address, validator: Address, newIndex: number) {
    const group = await this.getValidatorGroup(groupAddr)

    if (newIndex < 0 || newIndex >= group.members.length) {
      throw new Error(`Invalid index ${newIndex}; max index is ${group.members.length - 1}`)
    }

    const currentIdx = group.members.indexOf(validator)
    if (currentIdx < 0) {
      throw new Error(`ValidatorGroup ${groupAddr} does not inclue ${validator}`)
    } else if (currentIdx === newIndex) {
      throw new Error(`Validator is already in position ${newIndex}`)
    }

    // remove the element
    group.members.splice(currentIdx, 1)
    // add it on new position
    group.members.splice(newIndex, 0, validator)

    const nextMember =
      newIndex === group.members.length - 1 ? NULL_ADDRESS : group.members[newIndex + 1]
    const prevMember = newIndex === 0 ? NULL_ADDRESS : group.members[newIndex - 1]

    return toTransactionObject(
      this.kit,
      this.contract.methods.reorderMember(validator, nextMember, prevMember),
      { from: groupAddr }
    )
  }

  async getRegisteredValidatorGroups(): Promise<ValidatorGroup[]> {
    const vgAddresses = await this.contract.methods.getRegisteredValidatorGroups().call()
    return Promise.all(vgAddresses.map((addr) => this.getValidatorGroup(addr)))
  }

  async getValidatorGroup(address: Address): Promise<ValidatorGroup> {
    const res = await this.contract.methods.getValidatorGroup(address).call()
    return {
      address,
      name: res[0],
      members: res[1],
      commission: fromFixed(new BigNumber(res[2])),
    }
  }
}

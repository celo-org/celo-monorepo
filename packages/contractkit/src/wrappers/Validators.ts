import { eqAddress } from '@celo/utils/lib/address'
import { zip } from '@celo/utils/lib/collections'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { Address, NULL_ADDRESS } from '../base'
import { Validators } from '../generated/types/Validators'
import {
  BaseWrapper,
  CeloTransactionObject,
  parseBytes,
  proxyCall,
  proxySend,
  toBigNumber,
  toNumber,
  toTransactionObject,
  tupleParser,
} from './BaseWrapper'

export interface Validator {
  address: Address
  publicKey: string
  affiliation: string | null
  score: BigNumber
}

export interface ValidatorGroup {
  address: Address
  members: Address[]
  affiliates: Address[]
  commission: BigNumber
}

export interface LockedGoldRequirements {
  value: BigNumber
  duration: BigNumber
}

export interface ValidatorsConfig {
  groupLockedGoldRequirements: LockedGoldRequirements
  validatorLockedGoldRequirements: LockedGoldRequirements
  maxGroupSize: BigNumber
}

export interface GroupMembership {
  epoch: number
  group: Address
}

/**
 * Contract for voting for validators and managing validator groups.
 */
// TODO(asa): Support validator signers
export class ValidatorsWrapper extends BaseWrapper<Validators> {
  async updateCommission(commission: BigNumber): Promise<CeloTransactionObject<boolean>> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.updateCommission(toFixed(commission).toFixed())
    )
  }
  updatePublicKeysData = proxySend(this.kit, this.contract.methods.updatePublicKeysData)
  /**
   * Returns the Locked Gold requirements for validators.
   * @returns The Locked Gold requirements for validators.
   */
  async getValidatorLockedGoldRequirements(): Promise<LockedGoldRequirements> {
    const res = await this.contract.methods.getValidatorLockedGoldRequirements().call()
    return {
      value: toBigNumber(res[0]),
      duration: toBigNumber(res[1]),
    }
  }

  /**
   * Returns the Locked Gold requirements for validator groups.
   * @returns The Locked Gold requirements for validator groups.
   */
  async getGroupLockedGoldRequirements(): Promise<LockedGoldRequirements> {
    const res = await this.contract.methods.getGroupLockedGoldRequirements().call()
    return {
      value: toBigNumber(res[0]),
      duration: toBigNumber(res[1]),
    }
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ValidatorsConfig> {
    const res = await Promise.all([
      this.getValidatorLockedGoldRequirements(),
      this.getGroupLockedGoldRequirements(),
      this.contract.methods.maxGroupSize().call(),
    ])
    return {
      validatorLockedGoldRequirements: res[0],
      groupLockedGoldRequirements: res[1],
      maxGroupSize: toBigNumber(res[2]),
    }
  }

  async signerToAccount(signerAddress: Address) {
    const accounts = await this.kit.contracts.getAccounts()
    return accounts.activeValidationSignerToAccount(signerAddress)
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

  /**
   * Returns whether an account meets the requirements to register a validator.
   * @param account The account.
   * @return Whether an account meets the requirements to register a validator.
   */
  meetsValidatorBalanceRequirements = async (address: Address) => {
    const lockedGold = await this.kit.contracts.getLockedGold()
    const total = await lockedGold.getAccountTotalLockedGold(address)
    const reqs = await this.getValidatorLockedGoldRequirements()
    return reqs.value.lte(total)
  }

  /**
   * Returns whether an account meets the requirements to register a group.
   * @param account The account.
   * @return Whether an account meets the requirements to register a group.
   */

  meetsValidatorGroupBalanceRequirements = async (address: Address) => {
    const lockedGold = await this.kit.contracts.getLockedGold()
    const total = await lockedGold.getAccountTotalLockedGold(address)
    const reqs = await this.getGroupLockedGoldRequirements()
    return reqs.value.lte(total)
  }

  /** Get Validator information */
  async getValidator(address: Address): Promise<Validator> {
    const res = await this.contract.methods.getValidator(address).call()
    return {
      address,
      publicKey: res[0] as any,
      affiliation: res[1],
      score: fromFixed(new BigNumber(res[2])),
    }
  }

  /** Get ValidatorGroup information */
  async getValidatorGroup(address: Address): Promise<ValidatorGroup> {
    const res = await this.contract.methods.getValidatorGroup(address).call()
    const validators = await this.getRegisteredValidators()
    const affiliates = validators
      .filter((v) => v.affiliation === address)
      .filter((v) => !res[0].includes(v.address))
    return {
      address,
      members: res[0],
      commission: fromFixed(new BigNumber(res[1])),
      affiliates: affiliates.map((v) => v.address),
    }
  }

  /**
   * Returns the Validator's group membership history
   * @param validator The validator whose membership history to return.
   * @return The group membership history of a validator.
   */
  getValidatorMembershipHistory: (validator: Address) => Promise<GroupMembership[]> = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) =>
      // tslint:disable-next-line: no-object-literal-type-assertion
      zip((epoch, group) => ({ epoch: toNumber(epoch), group } as GroupMembership), res[0], res[1])
  )

  /** Get the size (amount of members) of a ValidatorGroup */
  getValidatorGroupSize: (group: Address) => Promise<number> = proxyCall(
    this.contract.methods.getGroupNumMembers,
    undefined,
    toNumber
  )

  /** Get list of registered validator addresses */
  getRegisteredValidatorsAddresses: () => Promise<Address[]> = proxyCall(
    this.contract.methods.getRegisteredValidators
  )

  /** Get list of registered validator group addresses */
  getRegisteredValidatorGroupsAddresses: () => Promise<Address[]> = proxyCall(
    this.contract.methods.getRegisteredValidatorGroups
  )

  /** Get list of registered validators */
  async getRegisteredValidators(): Promise<Validator[]> {
    const vgAddresses = await this.getRegisteredValidatorsAddresses()
    return Promise.all(vgAddresses.map((addr) => this.getValidator(addr)))
  }

  /** Get list of registered validator groups */
  async getRegisteredValidatorGroups(): Promise<ValidatorGroup[]> {
    const vgAddresses = await this.getRegisteredValidatorGroupsAddresses()
    return Promise.all(vgAddresses.map((addr) => this.getValidatorGroup(addr)))
  }

  /**
   * Registers a validator unaffiliated with any validator group.
   *
   * Fails if the account is already a validator or validator group.
   * Fails if the account does not have sufficient weight.
   *
   * @param publicKeysData Comprised of three tightly-packed elements:
   *    - publicKey - The public key that the validator is using for consensus, should match
   *      msg.sender. 64 bytes.
   *    - blsPublicKey - The BLS public key that the validator is using for consensus, should pass
   *      proof of possession. 48 bytes.
   *    - blsPoP - The BLS public key proof of possession. 96 bytes.
   */

  registerValidator: (publicKeysData: string) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.registerValidator,
    tupleParser(parseBytes)
  )

  /**
   * De-registers a validator, removing it from the group for which it is a member.
   * @param validatorAddress Address of the validator to deregister
   */
  async deregisterValidator(validatorAddress: Address) {
    const allValidators = await this.getRegisteredValidatorsAddresses()
    const idx = allValidators.findIndex((addr) => eqAddress(validatorAddress, addr))

    if (idx < 0) {
      throw new Error(`${validatorAddress} is not a registered validator`)
    }
    return toTransactionObject(this.kit, this.contract.methods.deregisterValidator(idx))
  }

  /**
   * Registers a validator group with no member validators.
   * Fails if the account is already a validator or validator group.
   * Fails if the account does not have sufficient weight.
   *
   * @param commission the commission this group receives on epoch payments made to its members.
   */
  async registerValidatorGroup(commission: BigNumber): Promise<CeloTransactionObject<boolean>> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.registerValidatorGroup(toFixed(commission).toFixed())
    )
  }

  /**
   * De-registers a validator Group
   * @param validatorGroupAddress Address of the validator group to deregister
   */
  async deregisterValidatorGroup(validatorGroupAddress: Address) {
    const allGroups = await this.getRegisteredValidatorGroupsAddresses()
    const idx = allGroups.findIndex((addr) => eqAddress(validatorGroupAddress, addr))

    if (idx < 0) {
      throw new Error(`${validatorGroupAddress} is not a registered validator`)
    }
    return toTransactionObject(this.kit, this.contract.methods.deregisterValidatorGroup(idx))
  }

  /**
   * Affiliates a validator with a group, allowing it to be added as a member.
   * De-affiliates with the previously affiliated group if present.
   * @param group The validator group with which to affiliate.
   */
  affiliate: (group: Address) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.affiliate
  )

  /**
   * De-affiliates a validator, removing it from the group for which it is a member.
   * Fails if the account is not a validator with non-zero affiliation.
   */

  deaffiliate = proxySend(this.kit, this.contract.methods.deaffiliate)

  /**
   * Adds a member to the end of a validator group's list of members.
   * Fails if `validator` has not set their affiliation to this account.
   * @param validator The validator to add to the group
   */
  async addMember(group: Address, validator: Address): Promise<CeloTransactionObject<boolean>> {
    const numMembers = await this.getValidatorGroupSize(group)
    if (numMembers === 0) {
      const election = await this.kit.contracts.getElection()
      const voteWeight = await election.getTotalVotesForGroup(group)
      const { lesser, greater } = await election.findLesserAndGreaterAfterVote(group, voteWeight)

      return toTransactionObject(
        this.kit,
        this.contract.methods.addFirstMember(validator, lesser, greater)
      )
    } else {
      return toTransactionObject(this.kit, this.contract.methods.addMember(validator))
    }
  }

  /**
   * Removes a member from a ValidatorGroup
   * The ValidatorGroup is specified by the `from` of the tx.
   *
   * @param validator The Validator to remove from the group
   */
  removeMember = proxySend(this.kit, this.contract.methods.removeMember)

  /**
   * Reorders a member within a validator group.
   * Fails if `validator` is not a member of the account's validator group.
   * @param groupAddr The validator group
   * @param validator The validator to reorder.
   * @param newIndex New position for the validator
   */
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
      this.contract.methods.reorderMember(validator, nextMember, prevMember)
    )
  }
}

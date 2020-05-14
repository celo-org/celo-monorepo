import { eqAddress, findAddressIndex } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { EventLog } from 'web3-core'
import { Address, NULL_ADDRESS } from '../base'
import { Validators } from '../generated/Validators'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  stringToBytes,
  toTransactionObject,
  tupleParser,
  valueToBigNumber,
  valueToFixidityString,
  valueToInt,
} from './BaseWrapper'

export interface Validator {
  name: string
  address: Address
  ecdsaPublicKey: string
  blsPublicKey: string
  affiliation: string | null
  score: BigNumber
  signer: Address
}

export interface ValidatorGroup {
  name: string
  address: Address
  members: Address[]
  membersUpdated: number
  affiliates: Address[]
  commission: BigNumber
  nextCommission: BigNumber
  nextCommissionBlock: BigNumber
  lastSlashed: BigNumber
  slashingMultiplier: BigNumber
}

export interface ValidatorReward {
  validator: Validator
  validatorPayment: BigNumber
  group: ValidatorGroup
  groupPayment: BigNumber
  epochNumber: number
}

export interface LockedGoldRequirements {
  value: BigNumber
  duration: BigNumber
}

export interface ValidatorsConfig {
  groupLockedGoldRequirements: LockedGoldRequirements
  validatorLockedGoldRequirements: LockedGoldRequirements
  maxGroupSize: BigNumber
  membershipHistoryLength: BigNumber
  slashingMultiplierResetPeriod: BigNumber
  commissionUpdateDelay: BigNumber
}

export interface GroupMembership {
  epoch: number
  group: Address
}

export interface MembershipHistoryExtraData {
  lastRemovedFromGroupTimestamp: number
  tail: number
}

/**
 * Contract for voting for validators and managing validator groups.
 */
// TODO(asa): Support validator signers
export class ValidatorsWrapper extends BaseWrapper<Validators> {
  /**
   * Queues an update to a validator group's commission.
   * @param commission Fixidity representation of the commission this group receives on epoch
   *   payments made to its members. Must be in the range [0, 1.0].
   */
  setNextCommissionUpdate: (commission: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.setNextCommissionUpdate,
    tupleParser(valueToFixidityString)
  )

  /**
   * Updates a validator group's commission based on the previously queued update
   */
  updateCommission: () => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.updateCommission
  )

  /**
   * Returns the Locked Gold requirements for validators.
   * @returns The Locked Gold requirements for validators.
   */
  async getValidatorLockedGoldRequirements(): Promise<LockedGoldRequirements> {
    const res = await this.contract.methods.getValidatorLockedGoldRequirements().call()
    return {
      value: valueToBigNumber(res[0]),
      duration: valueToBigNumber(res[1]),
    }
  }

  /**
   * Returns the Locked Gold requirements for validator groups.
   * @returns The Locked Gold requirements for validator groups.
   */
  async getGroupLockedGoldRequirements(): Promise<LockedGoldRequirements> {
    const res = await this.contract.methods.getGroupLockedGoldRequirements().call()
    return {
      value: valueToBigNumber(res[0]),
      duration: valueToBigNumber(res[1]),
    }
  }

  /**
   * Returns the Locked Gold requirements for specific account.
   * @returns The Locked Gold requirements for a specific account.
   */
  getAccountLockedGoldRequirement = proxyCall(
    this.contract.methods.getAccountLockedGoldRequirement,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the reset period, in seconds, for slashing multiplier.
   */
  getSlashingMultiplierResetPeriod = proxyCall(
    this.contract.methods.slashingMultiplierResetPeriod,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the update delay, in blocks, for the group commission.
   */
  getCommissionUpdateDelay = proxyCall(
    this.contract.methods.commissionUpdateDelay,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ValidatorsConfig> {
    const res = await Promise.all([
      this.getValidatorLockedGoldRequirements(),
      this.getGroupLockedGoldRequirements(),
      this.contract.methods.maxGroupSize().call(),
      this.contract.methods.membershipHistoryLength().call(),
      this.getSlashingMultiplierResetPeriod(),
      this.getCommissionUpdateDelay(),
    ])
    return {
      validatorLockedGoldRequirements: res[0],
      groupLockedGoldRequirements: res[1],
      maxGroupSize: valueToBigNumber(res[2]),
      membershipHistoryLength: valueToBigNumber(res[3]),
      slashingMultiplierResetPeriod: res[4],
      commissionUpdateDelay: res[5],
    }
  }

  /**
   * Returns the account associated with `signer`.
   * @param signer The address of an account or currently authorized validator signer.
   * @dev Fails if the `signer` is not an account or currently authorized validator.
   * @return The associated account.
   */
  async validatorSignerToAccount(signerAddress: Address) {
    const accounts = await this.kit.contracts.getAccounts()
    return accounts.validatorSignerToAccount(signerAddress)
  }

  /**
   * Returns the account associated with `signer`.
   * @param signer The address of the account or previously authorized signer.
   * @dev Fails if the `signer` is not an account or previously authorized signer.
   * @return The associated account.
   */
  async signerToAccount(signerAddress: Address) {
    const accounts = await this.kit.contracts.getAccounts()
    return accounts.signerToAccount(signerAddress)
  }

  /**
   * Updates a validator's BLS key.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
   *   of possession. 48 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 96 bytes.
   * @return True upon success.
   */
  updateBlsPublicKey: (
    blsPublicKey: string,
    blsPop: string
  ) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.updateBlsPublicKey,
    tupleParser(stringToBytes, stringToBytes)
  )

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
  async getValidator(address: Address, blockNumber?: number): Promise<Validator> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    const res = await this.contract.methods.getValidator(address).call({}, blockNumber)
    const accounts = await this.kit.contracts.getAccounts()
    const name = (await accounts.getName(address, blockNumber)) || ''

    return {
      name,
      address,
      ecdsaPublicKey: (res.ecdsaPublicKey as unknown) as string,
      blsPublicKey: (res.blsPublicKey as unknown) as string,
      affiliation: res.affiliation,
      score: fromFixed(new BigNumber(res.score)),
      signer: res.signer,
    }
  }

  async getValidatorFromSigner(address: Address, blockNumber?: number): Promise<Validator> {
    const account = await this.signerToAccount(address)
    if (eqAddress(account, NULL_ADDRESS) || !(await this.isValidator(account))) {
      return {
        name: 'Unregistered validator',
        address,
        ecdsaPublicKey: '',
        blsPublicKey: '',
        affiliation: '',
        score: new BigNumber(0),
        signer: address,
      }
    } else {
      return this.getValidator(account, blockNumber)
    }
  }

  /** Get ValidatorGroup information */
  async getValidatorGroup(
    address: Address,
    getAffiliates: boolean = true,
    blockNumber?: number
  ): Promise<ValidatorGroup> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    const res = await this.contract.methods.getValidatorGroup(address).call({}, blockNumber)
    const accounts = await this.kit.contracts.getAccounts()
    const name = (await accounts.getName(address, blockNumber)) || ''
    let affiliates: Validator[] = []
    if (getAffiliates) {
      const validators = await this.getRegisteredValidators(blockNumber)
      affiliates = validators
        .filter((v) => v.affiliation && eqAddress(v.affiliation, address))
        .filter((v) => !res[0].includes(v.address))
    }
    return {
      name,
      address,
      members: res[0],
      commission: fromFixed(new BigNumber(res[1])),
      nextCommission: fromFixed(new BigNumber(res[2])),
      nextCommissionBlock: new BigNumber(res[3]),
      membersUpdated: res[4].reduce(
        (a: number, b: BigNumber.Value) => Math.max(a, new BigNumber(b).toNumber()),
        0
      ),
      affiliates: affiliates.map((v) => v.address),
      slashingMultiplier: fromFixed(new BigNumber(res[5])),
      lastSlashed: valueToBigNumber(res[6]),
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
      zip((epoch, group): GroupMembership => ({ epoch: valueToInt(epoch), group }), res[0], res[1])
  )

  /**
   * Returns extra data from the Validator's group membership history
   * @param validator The validator whose membership history to return.
   * @return The group membership history of a validator.
   */
  getValidatorMembershipHistoryExtraData: (
    validator: Address
  ) => Promise<MembershipHistoryExtraData> = proxyCall(
    this.contract.methods.getMembershipHistory,
    undefined,
    (res) => ({ lastRemovedFromGroupTimestamp: valueToInt(res[2]), tail: valueToInt(res[3]) })
  )

  /** Get the size (amount of members) of a ValidatorGroup */
  getValidatorGroupSize: (group: Address) => Promise<number> = proxyCall(
    this.contract.methods.getGroupNumMembers,
    undefined,
    valueToInt
  )

  /** Get list of registered validator addresses */
  async getRegisteredValidatorsAddresses(blockNumber?: number): Promise<Address[]> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    return this.contract.methods.getRegisteredValidators().call({}, blockNumber)
  }

  /** Get list of registered validator group addresses */
  getRegisteredValidatorGroupsAddresses: () => Promise<Address[]> = proxyCall(
    this.contract.methods.getRegisteredValidatorGroups
  )

  /** Get list of registered validators */
  async getRegisteredValidators(blockNumber?: number): Promise<Validator[]> {
    const vgAddresses = await this.getRegisteredValidatorsAddresses(blockNumber)
    return concurrentMap(10, vgAddresses, (addr) => this.getValidator(addr, blockNumber))
  }

  /** Get list of registered validator groups */
  async getRegisteredValidatorGroups(): Promise<ValidatorGroup[]> {
    const vgAddresses = await this.getRegisteredValidatorGroupsAddresses()
    return concurrentMap(10, vgAddresses, (addr) => this.getValidatorGroup(addr, false))
  }

  /**
   * Registers a validator unaffiliated with any validator group.
   *
   * Fails if the account is already a validator or validator group.
   *
   * @param validatorAddress The address that the validator is using for consensus, should match
   *   the validator signer.
   * @param ecdsaPublicKey The ECDSA public key that the validator is using for consensus. 64 bytes.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
   *   of possession. 48 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 96 bytes.
   */

  getEpochNumber = proxyCall(this.contract.methods.getEpochNumber, undefined, valueToBigNumber)

  getEpochSize = proxyCall(this.contract.methods.getEpochSize, undefined, valueToBigNumber)

  registerValidator: (
    ecdsaPublicKey: string,
    blsPublicKey: string,
    blsPop: string
  ) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.registerValidator,
    tupleParser(stringToBytes, stringToBytes, stringToBytes)
  )

  /**
   * De-registers a validator, removing it from the group for which it is a member.
   * @param validatorAddress Address of the validator to deregister
   */
  async deregisterValidator(validatorAddress: Address) {
    const allValidators = await this.getRegisteredValidatorsAddresses()
    const idx = findAddressIndex(validatorAddress, allValidators)

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
    const idx = findAddressIndex(validatorGroupAddress, allGroups)

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
   * Removes a validator from the group for which it is a member.
   * @param validatorAccount The validator to deaffiliate from their affiliated validator group.
   */
  forceDeaffiliateIfValidator = proxySend(
    this.kit,
    this.contract.methods.forceDeaffiliateIfValidator
  )

  /**
   * Resets a group's slashing multiplier if it has been >= the reset period since
   * the last time the group was slashed.
   */
  resetSlashingMultiplier = proxySend(this.kit, this.contract.methods.resetSlashingMultiplier)

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

    const currentIdx = findAddressIndex(validator, group.members)
    if (currentIdx < 0) {
      throw new Error(`ValidatorGroup ${groupAddr} does not include ${validator}`)
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

  /**
   * Retrieves ValidatorRewards for epochNumber.
   * @param epochNumber The epoch to retrieve ValidatorRewards at.
   */
  async getValidatorRewards(epochNumber: number): Promise<ValidatorReward[]> {
    const blockNumber = await this.kit.getLastBlockNumberForEpoch(epochNumber)
    const events = await this.getPastEvents('ValidatorEpochPaymentDistributed', {
      fromBlock: blockNumber,
      toBlock: blockNumber,
    })
    const validator: Validator[] = await concurrentMap(10, events, (e: EventLog) =>
      this.getValidator(e.returnValues.validator)
    )
    const validatorGroup: ValidatorGroup[] = await concurrentMap(10, events, (e: EventLog) =>
      this.getValidatorGroup(e.returnValues.group, false)
    )
    return events.map(
      (e: EventLog, index: number): ValidatorReward => ({
        epochNumber,
        validator: validator[index],
        validatorPayment: valueToBigNumber(e.returnValues.validatorPayment),
        group: validatorGroup[index],
        groupPayment: valueToBigNumber(e.returnValues.groupPayment),
      })
    )
  }

  /**
   * Returns the current set of validator signer addresses
   */
  async currentSignerSet(): Promise<Address[]> {
    const n = valueToInt(await this.contract.methods.numberValidatorsInCurrentSet().call())
    return concurrentMap(5, Array.from(Array(n).keys()), (idx) =>
      this.contract.methods.validatorSignerAddressFromCurrentSet(idx).call()
    )
  }

  /**
   * Returns the current set of validator signer and account addresses
   */
  async currentValidatorAccountsSet() {
    const signerAddresses = await this.currentSignerSet()
    const accountAddresses = await concurrentMap(5, signerAddresses, (signer) =>
      this.validatorSignerToAccount(signer)
    )
    return zip((signer, account) => ({ signer, account }), signerAddresses, accountAddresses)
  }

  /**
   * Returns the group membership for `validator`.
   * @param validator Address of validator to retrieve group membership for.
   * @param blockNumber Block number to retrieve group membership at.
   * @return Group and membership history index for `validator`.
   */
  async getValidatorMembershipHistoryIndex(
    validator: Validator,
    blockNumber?: number
  ): Promise<{ group: Address; historyIndex: number }> {
    const blockEpoch = await this.kit.getEpochNumberOfBlock(
      blockNumber || (await this.kit.web3.eth.getBlockNumber())
    )
    const account = await this.validatorSignerToAccount(validator.signer)
    const membershipHistory = await this.getValidatorMembershipHistory(account)
    const historyIndex = this.findValidatorMembershipHistoryIndex(blockEpoch, membershipHistory)
    const group = membershipHistory[historyIndex].group
    return { group, historyIndex }
  }

  /**
   * Returns the index into `history` for `epoch`.
   * @param epoch The needle.
   * @param history The haystack.
   * @return Index for epoch or -1.
   */
  findValidatorMembershipHistoryIndex(epoch: number, history: GroupMembership[]): number {
    const revIndex = history
      .slice()
      .reverse()
      .findIndex((x) => x.epoch <= epoch)
    return revIndex < 0 ? -1 : history.length - revIndex - 1
  }
}

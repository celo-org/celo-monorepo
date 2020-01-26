import { Signature } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { VestingInstance } from '../generated/types/VestingInstance'
import { PendingWithdrawal } from '../wrappers/LockedGold'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toTransactionObject,
  tupleParser,
  valueToBigNumber,
  valueToInt,
  valueToString,
} from './BaseWrapper'

export interface VestingSchedule {
  vestingNumPeriods: BigNumber
  vestingAmountPerPeriod: BigNumber
  vestingPeriodSec: number
  vestingStartTime: number
  vestingCliffStartTime: number
}

/**
 * Contract for handling an instance of a vesting contract.
 */
export class VestingInstanceWrapper extends BaseWrapper<VestingInstance> {
  /**
   * Returns the underlying vesting scheme of the vesting instance
   * @return A VestingSchedule.
   */
  async getVestingSchedule(): Promise<VestingSchedule> {
    const vestingSchedule = await this.contract.methods.vestingSchedule().call()

    return {
      vestingNumPeriods: valueToBigNumber(vestingSchedule.vestingNumPeriods),
      vestingAmountPerPeriod: valueToBigNumber(vestingSchedule.vestAmountPerPeriod),
      vestingPeriodSec: valueToInt(vestingSchedule.vestingPeriodSec),
      vestingStartTime: valueToInt(vestingSchedule.vestingStartTime),
      vestingCliffStartTime: valueToInt(vestingSchedule.vestingCliffStartTime),
    }
  }

  /**
   * Returns the beneficiary of the vested contract
   * @return The address of the beneficiary.
   */
  getBeneficiary: () => Promise<Address> = proxyCall(this.contract.methods.beneficiary)

  /**
   * Returns the revoker address of the vested contract
   * @return The address of the revoker.
   */
  getRevoker: () => Promise<Address> = proxyCall(this.contract.methods.revoker)

  /**
   * Returns the total withdrawn amount from the vesting contract
   * @return The total withdrawn amount from the vesting contract
   */
  getTotalWithdrawn: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.totalWithdrawn,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the vested instance balance at revoke time
   * @return The vested instance balance at revoke time
   */
  getVestedBalanceAtRevoke: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.vestedBalanceAtRevoke,
    undefined,
    valueToBigNumber
  )

  /**
   * Indicates if the vesting has been paused or not
   * @return A boolean indicating paused vesting (true) or unpaused(false).
   */
  isPaused: () => Promise<boolean> = proxyCall(this.contract.methods.isPaused)

  /**
   * Indicates if the vesting is revocable or not
   * @return A boolean indicating revocable vesting (true) or non-revocable(false).
   */
  isRevokable: () => Promise<boolean> = proxyCall(this.contract.methods.revocable)

  /**
   * Indicates if the vesting is revoked or not
   * @return A boolean indicating revoked vesting (true) or non-revoked(false).
   */
  isRevoked: () => Promise<boolean> = proxyCall(this.contract.methods.isRevoked)

  /**
   * Returns the time at which the vesting was revoked
   * @return The timestamp of the vesting revokation
   */
  getRevokeTime: () => Promise<string> = proxyCall(this.contract.methods.revokeTime)

  /**
   * Returns the end time of the set pause in UNIX
   * @return The end time of the set pause in UNIX
   */
  getPauseEndTime: () => Promise<string> = proxyCall(this.contract.methods.pauseEndTime)

  /**
   * Returns maximum pause period in seconds
   * @return The maximum pause period in seconds
   */
  getMaxPausePeriod: () => Promise<string> = proxyCall(this.contract.methods.maxPausePeriod)

  /**
   * Returns the total balance of the vesting instance
   * @return The total vesting instance balance
   */
  getTotalBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getTotalBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the the sum of locked and unlocked gold in the vesting instance
   * @return The remaining total vesting instance balance
   */
  getRemainingTotalBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getRemainingTotalBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the remaining unlocked gold balance in the vesting instance
   * @return The available unlocked vesting instance gold balance
   */
  getRemainingUnlockedBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getRemainingUnlockedBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the remaining locked gold balance in the vesting instance
   * @return The remaining locked vesting instance gold balance
   */
  getRemainingLockedBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getRemainingLockedBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the initial vesting amount in the vesting instance
   * @return The initial vesting amount
   */
  getInitialVestingAmount: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getInitialVestingAmount,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the total amount that has already vested up to now
   * @return The already vested amount up to the point of call
   */
  getCurrentVestedTotalAmount: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getCurrentVestedTotalAmount,
    undefined,
    valueToBigNumber
  )

  /**
   * Pause the gold withdrawal in a vesting instance
   * @param pausePeriod the period for which the withdrawal shall be paused
   * @return A CeloTransactionObject
   */
  async pauseVesting(pausePeriod: string | number): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.pause(pausePeriod))
  }

  /**
   * Revoke a vesting schedule
   * @return A CeloTransactionObject
   */
  async revokeVesting(): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.revoke())
  }

  /**
   * Refund revoker and beneficiary after the vesting has been revoked.
   * @return A CeloTransactionObject
   */
  async refundAndFinalize(): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.refundAndFinalize())
  }

  /**
   * Locks gold to be used for voting.
   * @param value The amount of gold to lock
   */
  lockGold: (value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.lockGold,
    tupleParser(valueToString)
  )

  /**
   * Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock
   */
  unlockGold: (value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.unlockGold,
    tupleParser(valueToString)
  )

  async getPendingWithdrawalsTotalValue(account: Address) {
    const lockedGoldContract = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedGoldContract.getPendingWithdrawals(account)
    // Ensure there are enough pending withdrawals to relock.
    const values = pendingWithdrawals.map((pw: PendingWithdrawal) => pw.value)
    const reducer = (total: BigNumber, pw: BigNumber) => pw.plus(total)
    return values.reduce(reducer, new BigNumber(0))
  }

  /**
   * Relocks gold in the vesting instance that has been unlocked but not withdrawn.
   * @param value The total value to relock
   */
  async relockGold(value: BigNumber.Value): Promise<Array<CeloTransactionObject<void>>> {
    const lockedGoldContract = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedGoldContract.getPendingWithdrawals(
      this.contract._address
    )
    // Ensure there are enough pending withdrawals to relock.
    const totalValue = await this.getPendingWithdrawalsTotalValue(this.contract._address)
    if (totalValue.isLessThan(value)) {
      throw new Error(`Not enough pending withdrawals to relock ${value}`)
    }
    // Assert pending withdrawals are sorted by time (increasing), so that we can re-lock starting
    // with those furthest away from being available (at the end).
    const throwIfNotSorted = (pw: PendingWithdrawal, i: number) => {
      if (i > 0 && !pw.time.isGreaterThanOrEqualTo(pendingWithdrawals[i - 1].time)) {
        throw new Error('Pending withdrawals not sorted by timestamp')
      }
    }
    pendingWithdrawals.forEach(throwIfNotSorted)

    let remainingToRelock = new BigNumber(value)
    const relockPw = (
      acc: Array<CeloTransactionObject<void>>,
      pw: PendingWithdrawal,
      i: number
    ) => {
      const valueToRelock = BigNumber.minimum(pw.value, remainingToRelock)
      if (!valueToRelock.isZero()) {
        remainingToRelock = remainingToRelock.minus(valueToRelock)
        acc.push(this._relock(i, valueToRelock))
      }
      return acc
    }
    return pendingWithdrawals.reduceRight(relockPw, []) as Array<CeloTransactionObject<void>>
  }

  /**
   * Relocks gold in the vesting instance that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  _relock: (index: number, value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relockGold,
    tupleParser(valueToString, valueToString)
  )

  /**
   * Withdraw gold in the vesting instance that has been unlocked but not withdrawn.
   * @param index The index of the pending locked gold withdrawal
   */
  withdrawLockedGold: (index: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdrawLockedGold,
    tupleParser(valueToString)
  )

  /**
   * Transfer gold from the vesting back to beneficiary.
   * @param value The requested gold amount
   */
  withdraw: (value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdraw,
    tupleParser(valueToString)
  )

  /**
   * Beneficiary creates an account on behalf of the vesting contract.
   */
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)

  /**
   * Beneficiary creates an account on behalf of the vesting contract.
   * @param name The name to set
   * @param dataEncryptionKey The key to set
   * @param walletAddress The address to set
   */
  setAccount = proxySend(this.kit, this.contract.methods.setAccount)

  /**
   * Sets the name for the account
   * @param name The name to set
   */
  setAccountName = proxySend(this.kit, this.contract.methods.setAccountName)

  /**
   * Sets the metadataURL for the account
   * @param metadataURL The url to set
   */
  setAccountMetadataURL = proxySend(this.kit, this.contract.methods.setAccountMetadataURL)

  /**
   * Sets the wallet address for the account
   * @param walletAddress The address to set
   */
  setAccountWalletAddress = proxySend(this.kit, this.contract.methods.setAccountWalletAddress)

  /**
   * Sets the data encryption of the account
   * @param dataEncryptionKey The key to set
   */
  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

  /**
   * Authorizes an address to sign votes on behalf of the account.
   * @param signer The address of the vote signing key to authorize.
   * @param proofOfSigningKeyPossession The account address signed by the signer address.
   * @return A CeloTransactionObject
   */
  async authorizeVoteSigner(
    signer: Address,
    proofOfSigningKeyPossession: Signature
  ): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeVoteSigner(
        signer,
        proofOfSigningKeyPossession.v,
        proofOfSigningKeyPossession.r,
        proofOfSigningKeyPossession.s
      )
    )
  }

  /**
   * Activates any activatable pending votes.
   * @param account The account with pending votes to activate.
   */
  async activate(account: Address): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.activate(account))
  }

  /**
   * Revokes pending votes
   * @param account The account to revoke from.
   * @param validatorGroup The group to revoke the vote for.
   * @param value The amount of gold to revoke.
   */
  async revokePending(
    account: Address,
    group: Address,
    value: BigNumber
  ): Promise<CeloTransactionObject<void>> {
    const electionContract = await this.kit.contracts.getElection()
    const groups = await electionContract.getGroupsVotedForByAccount(account)
    const index = groups.indexOf(group)
    const { lesser, greater } = await electionContract.findLesserAndGreaterAfterVote(
      group,
      value.times(-1)
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.revokePending(group, value.toFixed(), lesser, greater, index)
    )
  }

  /**
   * Revokes active votes
   * @param account The account to revoke from.
   * @param validatorGroup The group to revoke the vote for.
   * @param value The amount of gold to revoke.
   */
  async revokeActive(
    account: Address,
    group: Address,
    value: BigNumber
  ): Promise<CeloTransactionObject<void>> {
    const electionContract = await this.kit.contracts.getElection()
    const groups = await electionContract.getGroupsVotedForByAccount(account)
    const index = groups.indexOf(group)
    const { lesser, greater } = await electionContract.findLesserAndGreaterAfterVote(
      group,
      value.times(-1)
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.revokeActive(group, value.toFixed(), lesser, greater, index)
    )
  }

  /**
   * Increments the number of total and pending votes for `group`.
   * @param validatorGroup The validator group to vote for.
   * @param value The amount of gold to use to vote.
   */
  async vote(validatorGroup: Address, value: BigNumber): Promise<CeloTransactionObject<void>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing kit.defaultAccount`)
    }

    const electionContract = await this.kit.contracts.getElection()

    const { lesser, greater } = await electionContract.findLesserAndGreaterAfterVote(
      validatorGroup,
      value
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.vote(validatorGroup, value.toFixed(), lesser, greater)
    )
  }
}

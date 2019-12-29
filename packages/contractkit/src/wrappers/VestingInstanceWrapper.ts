import { Signature } from '@celo/utils/lib/signatureUtils'
import { toFixed } from '@celo/utils/src/fixidity'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { VestingInstance } from '../generated/types/VestingInstance'
import { PendingWithdrawal } from '../wrappers/LockedGold'
import {
  BaseWrapper,
  CeloTransactionObject,
  NumberLike,
  parseNumber,
  proxyCall,
  proxySend,
  toBigNumber,
  toNumber,
  toTransactionObject,
  tupleParser,
} from './BaseWrapper'

export interface VestingScheme {
  vestingAmount: BigNumber
  vestingAmountPerPeriod: BigNumber
  vestingPeriods: number
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
   * @return A VestingScheme.
   */
  async getVestingScheme(): Promise<VestingScheme> {
    const vestingSchedule = await this.contract.methods.vestingSchedule().call()
    const vestingPeriods = toFixed(
      toBigNumber(vestingSchedule.vestingAmount).div(
        toBigNumber(vestingSchedule.vestAmountPerPeriod)
      )
    )
    return {
      vestingAmount: toBigNumber(vestingSchedule.vestingAmount),
      vestingAmountPerPeriod: toBigNumber(vestingSchedule.vestAmountPerPeriod),
      vestingPeriods: toNumber(vestingPeriods.toString()),
      vestingPeriodSec: toNumber(vestingSchedule.vestingPeriodSec),
      vestingStartTime: toNumber(vestingSchedule.vestingStartTime),
      vestingCliffStartTime: toNumber(vestingSchedule.vestingCliffStartTime),
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
   * Returns the address of the refund destination
   * @return The address of the refund destination.
   */
  getRefundDestination: () => Promise<Address> = proxyCall(this.contract.methods.refundDestination)

  /**
   * Returns the currently withdrawn by the beneficiary amount
   * @return The currently withdrawn amount.
   */
  getCurrentlyWithdrawn: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.currentlyWithdrawn,
    undefined,
    toBigNumber
  )

  /**
   * Indicates if the vesting has been paused or not
   * @return A boolean indicating paused vesting (true) or unpaused(false).
   */
  isPaused: () => Promise<boolean> = proxyCall(this.contract.methods.paused)

  /**
   * Indicates if the vesting is revocable or not
   * @return A boolean indicating revocable vesting (true) or non-revocable(false).
   */
  isRevokable: () => Promise<boolean> = proxyCall(this.contract.methods.revocable)

  /**
   * Indicates if the vesting is revoked or not
   * @return A boolean indicating revoked vesting (true) or non-revoked(false).
   */
  isRevoked: () => Promise<boolean> = proxyCall(this.contract.methods.revoked)

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
   * Returns the withdrawable amount at a specified timestamp.
   * @param timestamp The timestamp in question.
   * @return The amount which could be withdrawn at that timestamp.
   */
  getWithdrawableAmountAtTimestamp: (timestamp: string | number) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getWithdrawableAmountAtTimestamp,
    undefined,
    toBigNumber
  )

  /**
   * Returns the total vesting instance balance (locked and non-locked gold)
   * @return the total vesting instance balance (locked and non-locked gold)
   */
  getVestingInstanceTotalBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getVestingInstanceTotalBalance,
    undefined,
    toBigNumber
  )

  /**
   * Pause a vesting instance
   * @param pausePeriod The duration of the pause period in seconds
   * @return A CeloTransactionObject
   */
  async pauseVesting(pausePeriod: string | number): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.pause(pausePeriod))
  }

  /**
   * Revoke a vesting instance
   * @param pausePeriod The timestamp at which the revoking is to take place
   * @return A CeloTransactionObject
   */
  async revokeVesting(revokeTimestamp: string | number): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.revoke(revokeTimestamp))
  }

  /**
   * Locks gold to be used for voting.
   * @param value The amount of gold to lock.
   */
  lockGold: (value: NumberLike) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.lockGold,
    tupleParser(parseNumber)
  )

  /**
   * Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  unlockGold: (value: NumberLike) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.unlockGold,
    tupleParser(parseNumber)
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
   * Relocks gold that has been unlocked but not withdrawn.
   * @param value The value to relock from pending withdrawals.
   */
  async relockGold(
    account: Address,
    value: NumberLike
  ): Promise<Array<CeloTransactionObject<void>>> {
    const lockedGoldContract = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedGoldContract.getPendingWithdrawals(account)
    // Ensure there are enough pending withdrawals to relock.
    const totalValue = await this.getPendingWithdrawalsTotalValue(account)
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
   * Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  _relock: (index: number, value: NumberLike) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relockGold,
    tupleParser(parseNumber, parseNumber)
  )

  /**
   * Withdraw gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock.
   */
  withdrawLockedGold: (index: string | number) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdrawLockedGold
  )

  /**
   * Withdraws gold that has been vested by the contract.
   */
  withdraw: () => CeloTransactionObject<void> = proxySend(this.kit, this.contract.methods.withdraw)

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
}

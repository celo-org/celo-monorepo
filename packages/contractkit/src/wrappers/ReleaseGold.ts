import { Signature } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { newReleaseGold } from '../generated/ReleaseGold'
import { ReleaseGold } from '../generated/types/ReleaseGold'
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

export interface ReleaseSchedule {
  releaseStartTime: number
  releaseCliff: number
  numReleasePeriods: number
  releasePeriod: number
  amountReleasedPerPeriod: BigNumber
}

export interface RevocationInfo {
  revocable: boolean
  releasedBalanceAtRevoke: BigNumber
  revokeTime: number
}

/**
 * Contract for handling an instance of a ReleaseGold contract.
 */
export class ReleaseGoldWrapper extends BaseWrapper<ReleaseGold> {
  /**
   * Returns the ReleaseGold instance at the given contract address.
   * @param contractAddress The address of the desired ReleaseGold contract.
   * @return The ReleaseGold instance contract
   */
  async getReleaseGoldAt(contractAddress: string) {
    return new ReleaseGoldWrapper(this.kit, newReleaseGold(this.kit.web3, contractAddress))
  }

  /**
   * Returns the underlying Release schedule of the ReleaseGold contract
   * @return A ReleaseSchedule.
   */
  async getReleaseSchedule(): Promise<ReleaseSchedule> {
    const releaseSchedule = await this.contract.methods.releaseSchedule().call()

    return {
      releaseStartTime: valueToInt(releaseSchedule.releaseStartTime),
      releaseCliff: valueToInt(releaseSchedule.releaseCliff),
      numReleasePeriods: valueToInt(releaseSchedule.numReleasePeriods),
      releasePeriod: valueToInt(releaseSchedule.releasePeriod),
      amountReleasedPerPeriod: valueToBigNumber(releaseSchedule.amountReleasedPerPeriod),
    }
  }

  /**
   * Returns the beneficiary of the ReleaseGold contract
   * @return The address of the beneficiary.
   */
  getBeneficiary: () => Promise<Address> = proxyCall(this.contract.methods.beneficiary)

  /**
   * Returns the revoker address of the ReleaseGold contract
   * @return The address of the revoker.
   */
  getRevoker: () => Promise<Address> = proxyCall(this.contract.methods.releaseOwner)

  /**
   * Returns the total withdrawn amount from the ReleaseGold contract
   * @return The total withdrawn amount from the ReleaseGold contract
   */
  getTotalWithdrawn: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.totalWithdrawn,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the underlying Revocation Info of the ReleaseGold contract
   * @return A RevocationInfo struct.
   */
  async getRevocationInfo(): Promise<RevocationInfo> {
    const revocationInfo = await this.contract.methods.revocationInfo().call()

    return {
      revocable: revocationInfo.revocable,
      releasedBalanceAtRevoke: valueToBigNumber(revocationInfo.releasedBalanceAtRevoke),
      revokeTime: valueToInt(revocationInfo.revokeTime),
    }
  }

  /**
   * Indicates if the release grant is revocable or not
   * @return A boolean indicating revocable releasing (true) or non-revocable(false).
   */
  async isRevokable(): Promise<boolean> {
    // TODO(lucas): is this necessary
    const revocationInfo = await this.getRevocationInfo()
    return revocationInfo.revocable
  }

  /**
   * Indicates if the release grant is revoked or not
   * @return A boolean indicating revoked releasing (true) or non-revoked(false).
   */
  isRevoked: () => Promise<boolean> = proxyCall(this.contract.methods.isRevoked)

  // /**
  //  * Returns the time at which the release schedule was revoked
  //  * @return The timestamp of the release schedule revokation
  //  */
  // getRevokeTime: () => Promise<string> = proxyCall(this.contract.methods.revokeTime)

  /**
   * Returns the total balance of the ReleaseGold instance
   * @return The total ReleaseGold instance balance
   */
  getTotalBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getTotalBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the the sum of locked and unlocked gold in the ReleaseGold instance
   * @return The remaining total ReleaseGold instance balance
   */
  getRemainingTotalBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getRemainingTotalBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the remaining unlocked gold balance in the ReleaseGold instance
   * @return The available unlocked ReleaseGold instance gold balance
   */
  getRemainingUnlockedBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getRemainingUnlockedBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the remaining locked gold balance in the ReleaseGold instance
   * @return The remaining locked ReleaseGold instance gold balance
   */
  getRemainingLockedBalance: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getRemainingLockedBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the total amount that has already released up to now
   * @return The already released gold amount up to the point of call
   */
  getCurrentReleasedTotalAmount: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.getCurrentReleasedTotalAmount,
    undefined,
    valueToBigNumber
  )

  /**
   * Revoke a Release schedule
   * @return A CeloTransactionObject
   */
  async revokeReleasing(): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(this.kit, this.contract.methods.revoke())
  }

  /**
   * Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.
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

  /**
   * Get the total value of `account`s pending withdrawals.
   * @param account Account to query
   */
  async getPendingWithdrawalsTotalValue(account: Address) {
    const lockedGoldContract = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedGoldContract.getPendingWithdrawals(account)
    // Ensure there are enough pending withdrawals to relock.
    const values = pendingWithdrawals.map((pw: PendingWithdrawal) => pw.value)
    const reducer = (total: BigNumber, pw: BigNumber) => pw.plus(total)
    return values.reduce(reducer, new BigNumber(0))
  }

  /**
   * Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.
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
   * Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  _relock: (index: number, value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relockGold,
    tupleParser(valueToString, valueToString)
  )

  /**
   * Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.
   * @param index The index of the pending locked gold withdrawal
   */
  withdrawLockedGold: (index: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdrawLockedGold,
    tupleParser(valueToString)
  )

  /**
   * Transfer released gold from the ReleaseGold instance back to beneficiary.
   * @param value The requested gold amount
   */
  withdraw: (value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.withdraw,
    tupleParser(valueToString)
  )

  /**
   * Beneficiary creates an account on behalf of the ReleaseGold contract.
   */
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)

  /**
   * Beneficiary creates an account on behalf of the ReleaseGold contract.
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
}

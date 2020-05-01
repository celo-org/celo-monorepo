import { findAddressIndex } from '@celo/utils/lib/address'
import {
  hashMessageWithPrefix,
  Signature,
  signedMessageToPublicKey,
} from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { ReleaseGold } from '../generated/ReleaseGold'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  stringIdentity,
  stringToBytes,
  toTransactionObject,
  tupleParser,
  valueToBigNumber,
  valueToInt,
  valueToString,
} from './BaseWrapper'
import { PendingWithdrawal } from './LockedGold'

export interface BalanceState {
  totalWithdrawn: string
  maxDistribution: string
  totalBalance: string
  remainingTotalBalance: string
  remainingUnlockedBalance: string
  remainingLockedBalance: string
  currentReleasedTotalAmount: string
}

export interface ReleaseGoldInfo {
  releaseGoldWrapperAddress: string
  beneficiary: string
  releaseOwner: string
  refundAddress: string
  liquidityProvisionMet: boolean
  canValidate: boolean
  canVote: boolean
  releaseSchedule: ReleaseSchedule
  isRevoked: boolean
  revokedStateData: RevocationInfo
  balanceStateData: BalanceState
}

interface ReleaseSchedule {
  releaseStartTime: number
  releaseCliff: number
  numReleasePeriods: number
  releasePeriod: number
  amountReleasedPerPeriod: BigNumber
}

interface RevocationInfo {
  revocable: boolean
  canExpire: boolean
  releasedBalanceAtRevoke: BigNumber
  revokeTime: number
}

/**
 * Contract for handling an instance of a ReleaseGold contract.
 */
export class ReleaseGoldWrapper extends BaseWrapper<ReleaseGold> {
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
   * Returns the releaseOwner address of the ReleaseGold contract
   * @return The address of the releaseOwner.
   */
  getReleaseOwner: () => Promise<Address> = proxyCall(this.contract.methods.releaseOwner)

  /**
   * Returns the refund address of the ReleaseGold contract
   * @return The refundAddress.
   */
  getRefundAddress: () => Promise<Address> = proxyCall(this.contract.methods.refundAddress)

  /**
   * Returns the owner's address of the ReleaseGold contract
   * @return The owner's address.
   */
  getOwner: () => Promise<Address> = proxyCall(this.contract.methods.owner)

  /**
   * Returns true if the liquidity provision has been met for this contract
   * @return If the liquidity provision is met.
   */
  getLiquidityProvisionMet: () => Promise<boolean> = proxyCall(
    this.contract.methods.liquidityProvisionMet
  )

  /**
   * Returns true if the contract can validate
   * @return If the contract can validate
   */
  getCanValidate: () => Promise<boolean> = proxyCall(this.contract.methods.canValidate)

  /**
   * Returns true if the contract can vote
   * @return If the contract can vote
   */
  getCanVote: () => Promise<boolean> = proxyCall(this.contract.methods.canVote)

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
   * Returns the maximum amount of gold (regardless of release schedule)
   * currently allowed for release.
   * @return The max amount of gold currently withdrawable.
   */
  getMaxDistribution: () => Promise<BigNumber> = proxyCall(
    this.contract.methods.maxDistribution,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the underlying Revocation Info of the ReleaseGold contract
   * @return A RevocationInfo struct.
   */
  async getRevocationInfo(): Promise<RevocationInfo> {
    try {
      const revocationInfo = await this.contract.methods.revocationInfo().call()
      return {
        revocable: revocationInfo.revocable,
        canExpire: revocationInfo.canExpire,
        releasedBalanceAtRevoke: valueToBigNumber(revocationInfo.releasedBalanceAtRevoke),
        revokeTime: valueToInt(revocationInfo.revokeTime),
      }
    } catch (_) {
      // This error is caused by a mismatch between the deployed contract and the locally compiled version.
      // Specifically, networks like baklava and rc0 were deployed before adding `canExpire`.
      console.info('Some info could not be fetched, returning default for revocation info.')
      return {
        revocable: false,
        canExpire: false,
        releasedBalanceAtRevoke: new BigNumber(0),
        revokeTime: 0,
      }
    }
  }

  /**
   * Indicates if the release grant is revocable or not
   * @return A boolean indicating revocable releasing (true) or non-revocable(false).
   */
  async isRevocable(): Promise<boolean> {
    const revocationInfo = await this.getRevocationInfo()
    return revocationInfo.revocable
  }

  /**
   * Indicates if the release grant is revoked or not
   * @return A boolean indicating revoked releasing (true) or non-revoked(false).
   */
  isRevoked: () => Promise<boolean> = proxyCall(this.contract.methods.isRevoked)

  /**
   * Returns the time at which the release schedule was revoked
   * @return The timestamp of the release schedule revocation
   */
  async getRevokeTime(): Promise<number> {
    const revocationInfo = await this.getRevocationInfo()
    return revocationInfo.revokeTime
  }

  /**
   * Returns the balance of released gold when the grant was revoked
   * @return The balance at revocation time. 0 can also indicate not revoked.
   */
  async getReleasedBalanceAtRevoke(): Promise<string> {
    const revocationInfo = await this.getRevocationInfo()
    return revocationInfo.releasedBalanceAtRevoke.toString()
  }

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

  transfer: (to: Address, value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.transfer,
    tupleParser(stringIdentity, valueToString)
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
   * Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  async relockGold(value: BigNumber.Value): Promise<Array<CeloTransactionObject<void>>> {
    const lockedGold = await this.kit.contracts.getLockedGold()
    const pendingWithdrawals = await lockedGold.getPendingWithdrawals(this.address)
    // Ensure there are enough pending withdrawals to relock.
    const totalValue = await lockedGold.getPendingWithdrawalsTotalValue(this.address)
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
        acc.push(this._relockGold(i, valueToRelock))
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
  _relockGold: (index: number, value: BigNumber.Value) => CeloTransactionObject<void> = proxySend(
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
   * Sets the contract's liquidity provision to true
   */
  setLiquidityProvision = proxySend(this.kit, this.contract.methods.setLiquidityProvision)

  /**
   * Sets the contract's `canExpire` field to `_canExpire`
   * @param _canExpire If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.
   */
  setCanExpire = proxySend(this.kit, this.contract.methods.setCanExpire)

  /**
   * Sets the contract's max distribution
   */
  setMaxDistribution = proxySend(this.kit, this.contract.methods.setMaxDistribution)

  /**
   * Sets the contract's beneficiary
   */
  setBeneficiary = proxySend(this.kit, this.contract.methods.setBeneficiary)

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
   * Authorizes an address to sign validation messages on behalf of the account.
   * @param signer The address of the validator signing key to authorize.
   * @param proofOfSigningKeyPossession The account address signed by the signer address.
   * @return A CeloTransactionObject
   */
  async authorizeValidatorSigner(
    signer: Address,
    proofOfSigningKeyPossession: Signature
  ): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const account = this.address
    if (await validators.isValidator(account)) {
      const message = this.kit.web3.utils.soliditySha3({ type: 'address', value: account })
      const prefixedMsg = hashMessageWithPrefix(message)
      const pubKey = signedMessageToPublicKey(
        prefixedMsg,
        proofOfSigningKeyPossession.v,
        proofOfSigningKeyPossession.r,
        proofOfSigningKeyPossession.s
      )
      return toTransactionObject(
        this.kit,
        this.contract.methods.authorizeValidatorSignerWithPublicKey(
          signer,
          proofOfSigningKeyPossession.v,
          proofOfSigningKeyPossession.r,
          proofOfSigningKeyPossession.s,
          stringToBytes(pubKey)
        )
      )
    } else {
      return toTransactionObject(
        this.kit,
        this.contract.methods.authorizeValidatorSigner(
          signer,
          proofOfSigningKeyPossession.v,
          proofOfSigningKeyPossession.r,
          proofOfSigningKeyPossession.s
        )
      )
    }
  }

  /**
   * Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.
   * @param signer The address of the signing key to authorize.
   * @param proofOfSigningKeyPossession The contract's account address signed by the signer address.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
   *   of possession. 48 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 96 bytes.
   * @return A CeloTransactionObject
   */
  async authorizeValidatorSignerAndBls(
    signer: Address,
    proofOfSigningKeyPossession: Signature,
    blsPublicKey: string,
    blsPop: string
  ): Promise<CeloTransactionObject<void>> {
    const account = this.address
    const message = this.kit.web3.utils.soliditySha3({ type: 'address', value: account })
    const prefixedMsg = hashMessageWithPrefix(message)
    const pubKey = signedMessageToPublicKey(
      prefixedMsg,
      proofOfSigningKeyPossession.v,
      proofOfSigningKeyPossession.r,
      proofOfSigningKeyPossession.s
    )
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeValidatorSignerWithKeys(
        signer,
        proofOfSigningKeyPossession.v,
        proofOfSigningKeyPossession.r,
        proofOfSigningKeyPossession.s,
        stringToBytes(pubKey),
        stringToBytes(blsPublicKey),
        stringToBytes(blsPop)
      )
    )
  }

  /**
   * Authorizes an address to sign attestation messages on behalf of the account.
   * @param signer The address of the attestation signing key to authorize.
   * @param proofOfSigningKeyPossession The account address signed by the signer address.
   * @return A CeloTransactionObject
   */
  async authorizeAttestationSigner(
    signer: Address,
    proofOfSigningKeyPossession: Signature
  ): Promise<CeloTransactionObject<void>> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeAttestationSigner(
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
    const index = findAddressIndex(group, groups)
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
    const index = findAddressIndex(group, groups)
    const { lesser, greater } = await electionContract.findLesserAndGreaterAfterVote(
      group,
      value.times(-1)
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.revokeActive(group, value.toFixed(), lesser, greater, index)
    )
  }

  async revoke(
    account: Address,
    group: Address,
    value: BigNumber
  ): Promise<Array<CeloTransactionObject<void>>> {
    const electionContract = await this.kit.contracts.getElection()
    const vote = await electionContract.getVotesForGroupByAccount(account, group)
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
}

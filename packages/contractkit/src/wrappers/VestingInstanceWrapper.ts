import {
  hashMessageWithPrefix,
  Signature,
  signedMessageToPublicKey,
} from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { VestingInstance } from '../generated/types/VestingInstance'
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

interface VestingScheme {
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
    const vestingScheme = await this.contract.methods.vestingScheme().call()
    return {
      vestingAmount: toBigNumber(vestingScheme.vestingAmount),
      vestingAmountPerPeriod: toBigNumber(vestingScheme.vestAmountPerPeriod),
      vestingPeriods: toNumber(vestingScheme.vestingPeriods),
      vestingPeriodSec: toNumber(vestingScheme.vestingPeriodSec),
      vestingStartTime: toNumber(vestingScheme.vestingStartTime),
      vestingCliffStartTime: toNumber(vestingScheme.vestingCliffStartTime),
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
   * @return A boolean indicating revocable vesting (true) or none-revocable(false).
   */
  isRevokable: () => Promise<boolean> = proxyCall(this.contract.methods.revocable)

  /**
   * Indicates if the vesting is revoked or not
   * @return A boolean indicating revoked vesting (true) or none-revoked(false).
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
   * Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
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

  /**
   * Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock.
   * @param value The value to relock.
   */
  relockGold: (index: number, value: string | number) => CeloTransactionObject<void> = proxySend(
    this.kit,
    this.contract.methods.relockGold
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
   * Withdraws a gold that has been unlocked after the unlocking period has passed.
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
   * Authorize an attestation signing key on behalf of this account to another address.
   * @param signer The address of the signing key to authorize.
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
   * Authorizes an address to sign consensus messages on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param proofOfSigningKeyPossession The account address signed by the signer address.
   * @return A CeloTransactionObject
   */
  async authorizeValidatorSigner(
    signer: Address,
    proofOfSigningKeyPossession: Signature
  ): Promise<CeloTransactionObject<void>> {
    const validators = await this.kit.contracts.getValidators()
    const account = this.kit.defaultAccount || (await this.kit.web3.eth.getAccounts())[0]
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
        this.contract.methods.authorizeValidatorSigner(
          signer,
          // @ts-ignore Typescript does not support overloading.
          pubKey,
          proofOfSigningKeyPossession.v,
          proofOfSigningKeyPossession.r,
          proofOfSigningKeyPossession.s
        )
      )
    } else {
      return toTransactionObject(
        this.kit,
        this.contract.methods.authorizeValidatorSigner(
          signer,
          '' as any, // TODO: FIX!!!
          proofOfSigningKeyPossession.v,
          proofOfSigningKeyPossession.r,
          proofOfSigningKeyPossession.s
        )
      )
    }
  }
}

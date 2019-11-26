import Web3 from 'web3'
import { Address } from '../base'
import { Accounts } from '../generated/types/Accounts'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toTransactionObject,
} from '../wrappers/BaseWrapper'

enum SignerRole {
  Attestation,
  Validation,
  Vote,
}
/**
 * Contract for handling deposits needed for voting.
 */
export class AccountsWrapper extends BaseWrapper<Accounts> {
  /**
   * Creates an account.
   */
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)

  /**
   * Returns the attestation signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can vote.
   */
  getAttestationSigner: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getAttestationSigner
  )
  /**
   * Returns the vote signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can vote.
   */
  getVoteSigner: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getVoteSigner
  )
  /**
   * Returns the validation signere for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  getValidationSigner: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getValidationSigner
  )

  /**
   * Returns the account address given the signer for validating
   * @param signer Address that is authorized to sign the tx as validator
   * @return The Account address
   */
  activeValidationSignerToAccount: (signer: Address) => Promise<Address> = proxyCall(
    this.contract.methods.activeValidationSignerToAccount
  )

  /**
   * Check if an account already exists.
   * @param account The address of the account
   * @return Returns `true` if account exists. Returns `false` otherwise.
   */
  isAccount: (account: string) => Promise<boolean> = proxyCall(this.contract.methods.isAccount)

  /**
   * Check if an address is a signer address
   * @param address The address of the account
   * @return Returns `true` if account exists. Returns `false` otherwise.
   */
  isSigner: (address: string) => Promise<boolean> = proxyCall(this.contract.methods.isAuthorized)

  /**
   * Authorize an attestation signing key on behalf of this account to another address.
   * @param account Address of the active account.
   * @param attestationSigner The address of the signing key to authorize.
   * @return A CeloTransactionObject
   */
  async authorizeAttestationSigner(
    account: Address,
    attestationSigner: Address
  ): Promise<CeloTransactionObject<void>> {
    return this.authorizeSigner(SignerRole.Attestation, account, attestationSigner)
  }
  /**
   * Authorizes an address to sign votes on behalf of the account.
   * @param account Address of the active account.
   * @param voteSigner The address of the vote signing key to authorize.
   * @return A CeloTransactionObject
   */
  async authorizeVoteSigner(
    account: Address,
    voteSigner: Address
  ): Promise<CeloTransactionObject<void>> {
    return this.authorizeSigner(SignerRole.Vote, account, voteSigner)
  }

  /**
   * Authorizes an address to sign consensus messages on behalf of the account.
   * @param account Address of the active account.
   * @param validationSigner The address of the signing key to authorize.
   * @return A CeloTransactionObject
   */
  async authorizeValidationSigner(
    account: Address,
    validationSigner: Address
  ): Promise<CeloTransactionObject<void>> {
    return this.authorizeSigner(SignerRole.Validation, account, validationSigner)
  }

  /**
   * Returns the set name for the account
   * @param account Account
   */
  getName = proxyCall(this.contract.methods.getName)

  /**
   * Returns the set data encryption key for the account
   * @param account Account
   */
  getDataEncryptionKey = proxyCall(this.contract.methods.getDataEncryptionKey)

  /**
   * Returns the set wallet address for the account
   * @param account Account
   */
  getWalletAddress = proxyCall(this.contract.methods.getWalletAddress)

  /**
   * Returns the metadataURL for the account
   * @param account Account
   */
  getMetadataURL = proxyCall(this.contract.methods.getMetadataURL)

  /**
   * Sets the data encryption of the account
   * @param encryptionKey The key to set
   */
  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )

  /**
   * Convenience Setter for the dataEncryptionKey and wallet address for an account
   * @param name A string to set as the name of the account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account
   */
  setAccount = proxySend(this.kit, this.contract.methods.setAccount)

  /**
   * Sets the name for the account
   * @param name The name to set
   */
  setName = proxySend(this.kit, this.contract.methods.setName)

  /**
   * Sets the metadataURL for the account
   * @param url The url to set
   */
  setMetadataURL = proxySend(this.kit, this.contract.methods.setMetadataURL)

  /**
   * Sets the wallet address for the account
   * @param address The address to set
   */
  setWalletAddress = proxySend(this.kit, this.contract.methods.setWalletAddress)

  private authorizeFns = {
    [SignerRole.Attestation]: this.contract.methods.authorizeAttestationSigner,
    [SignerRole.Validation]: this.contract.methods.authorizeValidationSigner,
    [SignerRole.Vote]: this.contract.methods.authorizeVoteSigner,
  }

  private async authorizeSigner(role: SignerRole, account: Address, signer: Address) {
    const sig = await this.getParsedSignatureOfAddress(account, signer)
    // TODO(asa): Pass default tx "from" argument.
    return toTransactionObject(this.kit, this.authorizeFns[role](signer, sig.v, sig.r, sig.s))
  }

  private async getParsedSignatureOfAddress(address: Address, signer: string) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = (await this.kit.web3.eth.sign(hash, signer)).slice(2)
    return {
      r: `0x${signature.slice(0, 64)}`,
      s: `0x${signature.slice(64, 128)}`,
      v: Web3.utils.hexToNumber(signature.slice(128, 130)) + 27,
    }
  }
}

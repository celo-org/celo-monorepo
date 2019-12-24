import {
  hashMessageWithPrefix,
  LocalSigner,
  NativeSigner,
  parseSignature,
  Signature,
  signedMessageToPublicKey,
  Signer,
} from '@celo/utils/lib/signatureUtils'
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

interface AccountSummary {
  name: string
  authorizedSigners: {
    vote: Address
    validator: Address
    attestation: Address
  }
  metadataURL: string
  wallet: Address
  dataEncryptionKey: string
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
   * Returns the validator signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  getValidatorSigner: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getValidatorSigner
  )

  /**
   * Returns the account address given the signer for voting
   * @param signer Address that is authorized to sign the tx as voter
   * @return The Account address
   */
  voteSignerToAccount: (signer: Address) => Promise<Address> = proxyCall(
    this.contract.methods.voteSignerToAccount
  )

  /**
   * Returns the account address given the signer for validating
   * @param signer Address that is authorized to sign the tx as validator
   * @return The Account address
   */
  validatorSignerToAccount: (signer: Address) => Promise<Address> = proxyCall(
    this.contract.methods.validatorSignerToAccount
  )

  /**
   * Returns the account associated with `signer`.
   * @param signer The address of the account or previously authorized signer.
   * @param blockNumber Height of result, defaults to tip.
   * @dev Fails if the `signer` is not an account or previously authorized signer.
   * @return The associated account.
   */
  signerToAccount(signer: Address, blockNumber?: number): Promise<Address> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    return this.contract.methods.signerToAccount(signer).call({}, blockNumber)
  }

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
  isSigner: (address: string) => Promise<boolean> = proxyCall(
    this.contract.methods.isAuthorizedSigner
  )

  async getAccountSummary(account: string): Promise<AccountSummary> {
    const ret = await Promise.all([
      this.getName(account),
      this.getVoteSigner(account),
      this.getValidatorSigner(account),
      this.getAttestationSigner(account),
      this.getMetadataURL(account),
      this.getWalletAddress(account),
      this.getDataEncryptionKey(account),
    ])
    return {
      name: ret[0],
      authorizedSigners: {
        vote: ret[1],
        validator: ret[2],
        attestation: ret[3],
      },
      metadataURL: ret[4],
      wallet: ret[5],
      // @ts-ignore Incorrect bytes type.
      dataEncryptionKey: ret[6],
    }
  }

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
          pubKey,
          proofOfSigningKeyPossession.v,
          proofOfSigningKeyPossession.r,
          // @ts-ignore Typescript does not support overloading.
          proofOfSigningKeyPossession.s
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

  async generateProofOfSigningKeyPossession(account: Address, signer: Address) {
    return this.getParsedSignatureOfAddress(
      account,
      signer,
      NativeSigner(this.kit.web3.eth.sign, signer)
    )
  }

  async generateProofOfSigningKeyPossessionLocally(
    account: Address,
    signer: Address,
    privateKey: string
  ) {
    return this.getParsedSignatureOfAddress(account, signer, LocalSigner(privateKey))
  }

  /**
   * Returns the set name for the account
   * @param account Account
   * @param blockNumber Height of result, defaults to tip.
   */
  async getName(account: Address, blockNumber?: number): Promise<string> {
    // @ts-ignore: Expected 0-1 arguments, but got 2
    return this.contract.methods.getName(account).call({}, blockNumber)
  }

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

  parseSignatureOfAddress(address: Address, signer: string, signature: string) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    return parseSignature(hash, signature, signer)
  }

  private async getParsedSignatureOfAddress(address: Address, signer: string, signerFn: Signer) {
    const hash = Web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = await signerFn.sign(hash)
    return parseSignature(hash, signature, signer)
  }
}

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

/**
 * Contract for handling deposits needed for voting.
 */
export class AccountsWrapper extends BaseWrapper<Accounts> {
  /**
   * Creates an account.
   */
  createAccount = proxySend(this.kit, this.contract.methods.createAccount)

  /**
   * Returns the voter for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can vote.
   */
  getVoteSignerFromAccount: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getVoteSignerFromAccount
  )
  /**
   * Returns the validator for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  getValidationSignerFromAccount: (account: string) => Promise<Address> = proxyCall(
    this.contract.methods.getValidationSignerFromAccount
  )

  /**
   * Check if an account already exists.
   * @param account The address of the account
   * @return Returns `true` if account exists. Returns `false` otherwise.
   */
  isAccount: (account: string) => Promise<boolean> = proxyCall(this.contract.methods.isAccount)

  /**
   * Authorize voting on behalf of this account to another address.
   * @param account Address of the active account.
   * @param voter Address to be used for voting.
   * @return A CeloTransactionObject
   */
  async authorizeVoteSigner(
    account: Address,
    voter: Address
  ): Promise<CeloTransactionObject<void>> {
    const sig = await this.getParsedSignatureOfAddress(account, voter)
    // TODO(asa): Pass default tx "from" argument.
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeVoteSigner(voter, sig.v, sig.r, sig.s)
    )
  }

  /**
   * Authorize validating on behalf of this account to another address.
   * @param account Address of the active account.
   * @param voter Address to be used for validating.
   * @return A CeloTransactionObject
   */
  async authorizeValidationSigner(
    account: Address,
    validator: Address
  ): Promise<CeloTransactionObject<void>> {
    const sig = await this.getParsedSignatureOfAddress(account, validator)
    return toTransactionObject(
      this.kit,
      this.contract.methods.authorizeValidationSigner(validator, sig.v, sig.r, sig.s)
    )
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
   * Sets the metadataURL for the account
   * @param url The url to set
   */
  setMetadataURL = proxySend(this.kit, this.contract.methods.setMetadataURL)

  /**
   * Sets the wallet address for the account
   * @param address The address to set
   */
  setWalletAddress = proxySend(this.kit, this.contract.methods.setWalletAddress)

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

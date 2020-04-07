import { EncodedTransaction, Tx } from 'web3-core'
import { Address } from '../base'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
import { Signer } from './signers/signer'
import { Wallet, WalletBase } from './wallet'

/**
 * Abstract class representing a remote wallet that requires async initialization
 */
export abstract class RemoteWallet extends WalletBase implements Wallet {
  private setupFinished = false
  private setupLocked = false

  /**
   * Discovers wallet accounts and caches results in memory
   * Idempotent to ensure multiple calls are benign
   */
  async init() {
    if (this.setupLocked || this.setupFinished) {
      return
    }
    try {
      this.setupLocked = true
      const accountSigners = await this.loadAccountSigners()
      accountSigners.forEach((signer, address) => {
        this.addSigner(address, signer)
      })
      this.setupFinished = true
    } finally {
      this.setupLocked = false
    }
  }

  /**
   * Discover accounts and store mapping in accountSigners
   */
  protected abstract async loadAccountSigners(): Promise<Map<Address, Signer>>

  /**
   * Get a list of accounts in the remote wallet
   */
  getAccounts(): Address[] {
    this.initializationRequired()
    return super.getAccounts()
  }

  /**
   * Returns true if account is in the remote wallet
   * @param address Account to check
   */
  hasAccount(address?: Address) {
    this.initializationRequired()
    return super.hasAccount(address)
  }

  /**
   * Signs the EVM transaction using the signer pulled from the from field
   * @param txParams EVM transaction
   */
  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    this.initializationRequired()
    return super.signTransaction(txParams)
  }

  /**
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessage(address: Address, data: string): Promise<string> {
    this.initializationRequired()
    return super.signPersonalMessage(address, data)
  }

  /**
   * @param address Address of the account to sign with
   * @param typedData the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string> {
    this.initializationRequired()
    return super.signTypedData(address, typedData)
  }

  protected initializationRequired() {
    if (!this.setupFinished) {
      throw new Error('wallet needs to be initialized first')
    }
  }
}

import { sleep } from '@celo/utils/lib/async'
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
  private INIT_TIMEOUT_IN_MS = 10 * 1000

  /**
   * Discovers wallet accounts and caches results in memory
   * Idempotent to ensure multiple calls are benign
   */
  async init() {
    if (this.setupLocked || this.setupFinished) {
      await this.initCompleted()
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
   * Monitor the initialization state until it reaches completion or time out
   */
  private async initCompleted() {
    let initTimeout = this.INIT_TIMEOUT_IN_MS
    const sleepIntervalInMs = 1 * 1000
    while (initTimeout > 0) {
      initTimeout -= sleepIntervalInMs
      if (this.setupFinished) {
        return
      }
      await sleep(sleepIntervalInMs)
    }
    throw new Error('Initialization took too long. Ensure the wallet signer is available')
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
  hasAccount(address?: Address): boolean {
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

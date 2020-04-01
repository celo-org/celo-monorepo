import { normalizeAddressWith0x } from '@celo/utils/lib/address'
import { Tx } from 'web3/eth/types'
import { EncodedTransaction } from 'web3/types'
import { Address } from '../base'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
// @ts-ignore-next-line
import { BN } from 'bn.js'
import { Wallet } from './wallet'

/**
 * Abstract class representing a remote wallet that requires async initialization
 */
export abstract class RemoteWallet implements Wallet {
  // Account addresses are hex-encoded and lower case
  private addressToNativeKey: Map<Address, string> = new Map<Address, string>()
  private setupFinished = false
  private setupOngoing = false

  /**
   * Discovers wallet accounts and caches results in memory
   * Idempotent to ensure multiple calls are benign
   */
  async init() {
    if (this.setupOngoing || this.setupFinished) {
      return
    }
    this.setupOngoing = true
    this.addressToNativeKey = await this.retrieveAccounts()
    this.setupOngoing = false
    this.setupFinished = true
  }

  /**
   * Discover accounts and store mapping in addressToNativeKey
   */
  protected abstract async retrieveAccounts(): Promise<Map<Address, string>>

  /**
   * Get a list of accounts in the remote wallet
   */
  getAccounts(): Address[] {
    this.initializationRequired()
    return Array.from(this.addressToNativeKey.keys())
  }

  /**
   * Returns true if account is in the remote wallet
   * @param address Account to check
   */
  hasAccount(address?: string) {
    this.initializationRequired()
    if (address) {
      return this.addressToNativeKey.has(normalizeAddressWith0x(address))
    } else {
      return false
    }
  }

  /**
   * Signs the EVM transaction using the signer pulled from the from field
   * @param txParams EVM transaction
   */
  abstract async signTransaction(txParams: Tx): Promise<EncodedTransaction>

  /**
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  abstract async signPersonalMessage(address: string, data: string): Promise<string>

  /**
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  abstract async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string>

  protected initializationRequired() {
    if (!this.setupFinished) {
      throw new Error('ledger-wallet needs to be initialized first')
    }
  }

  protected getNativeKeyPathFor(account: Address): string {
    if (account) {
      const maybeDP = this.addressToNativeKey.get(normalizeAddressWith0x(account))
      if (maybeDP != null) {
        return maybeDP
      }
    }
    throw Error(`remote-wallet@getNativeKeyPathFor: Native key not found for ${account}`)
  }
}

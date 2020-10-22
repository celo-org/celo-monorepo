import { isHexString, normalizeAddressWith0x } from '@celo/base/lib/address'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import * as ethUtil from 'ethereumjs-util'
import { EncodedTransaction, Tx } from 'web3-core'
import { Address } from '../base'
import {
  chainIdTransformationForSigning,
  encodeTransaction,
  rlpEncodedTx,
} from '../utils/signing-utils'
import { Signer } from './signers/signer'

export interface ReadOnlyWallet {
  getAccounts: () => Address[]
  hasAccount: (address?: Address) => boolean
  signTransaction: (txParams: Tx) => Promise<EncodedTransaction>
  signTypedData: (address: Address, typedData: EIP712TypedData) => Promise<string>
  signPersonalMessage: (address: Address, data: string) => Promise<string>
  decrypt: (address: Address, ciphertext: Buffer) => Promise<Buffer>
}

type addInMemoryAccount = (privateKey: string) => void
type addRemoteAccount = (privateKey: string, passphrase: string) => Promise<string>

export interface Wallet extends ReadOnlyWallet {
  addAccount: addInMemoryAccount | addRemoteAccount
}

export interface UnlockableWallet extends Wallet {
  unlockAccount: (address: string, passphrase: string, duration: number) => Promise<boolean>
  isAccountUnlocked: (address: string) => boolean
}

export abstract class WalletBase<TSigner extends Signer> implements ReadOnlyWallet {
  // By creating the Signers in advance we can have a common pattern across wallets
  // Each implementation is responsible for populating this map through addSigner
  private accountSigners = new Map<Address, TSigner>()

  /**
   * Gets a list of accounts that have been registered
   */
  getAccounts(): Address[] {
    return Array.from(this.accountSigners.keys())
  }

  /**
   * Returns true if account has been registered
   * @param address Account to check
   */
  hasAccount(address?: Address): boolean {
    if (address) {
      const normalizedAddress = normalizeAddressWith0x(address)
      return this.accountSigners.has(normalizedAddress)
    } else {
      return false
    }
  }

  /**
   * Adds the account-signer set to the internal map
   * @param address Account address
   * @param signer Account signer
   */
  protected addSigner(address: Address, signer: TSigner) {
    const normalizedAddress = normalizeAddressWith0x(address)
    this.accountSigners.set(normalizedAddress, signer)
  }

  /**
   * Gets the signer based on the 'from' field in the tx body
   * @param txParams Transaction to sign
   */
  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    if (!txParams) {
      throw new Error('No transaction object given!')
    }
    const rlpEncoded = rlpEncodedTx(txParams)
    const addToV = chainIdTransformationForSigning(txParams.chainId!)

    // Get the signer from the 'from' field
    const fromAddress = txParams.from!.toString()
    const signer = this.getSigner(fromAddress)
    const signature = await signer!.signTransaction(addToV, rlpEncoded)

    return encodeTransaction(rlpEncoded, signature)
  }

  /**
   * Sign a personal Ethereum signed message.
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessage(address: Address, data: string): Promise<string> {
    if (!isHexString(data)) {
      throw Error('wallet@signPersonalMessage: Expected data has to be a hex string ')
    }

    const signer = this.getSigner(address)
    const sig = await signer.signPersonalMessage(data)

    return ethUtil.toRpcSig(sig.v, sig.r, sig.s)
  }

  /**
   * Sign an EIP712 Typed Data message.
   * @param address Address of the account to sign with
   * @param typedData the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string> {
    if (typedData === undefined) {
      throw Error('wallet@signTypedData: TypedData Missing')
    }

    const signer = this.getSigner(address)
    const sig = await signer.signTypedData(typedData)

    return ethUtil.toRpcSig(sig.v, sig.r, sig.s)
  }

  protected getSigner(address: string): TSigner {
    const normalizedAddress = normalizeAddressWith0x(address)
    if (!this.accountSigners.has(normalizedAddress)) {
      throw new Error(`Could not find address ${normalizedAddress}`)
    }
    return this.accountSigners.get(normalizedAddress)!
  }

  async decrypt(address: string, ciphertext: Buffer) {
    const signer = this.getSigner(address)
    return signer.decrypt(ciphertext)
  }
}

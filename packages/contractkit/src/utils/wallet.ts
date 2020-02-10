import {
  ensureLeading0x,
  isHexString,
  privateKeyToAddress,
  trimLeading0x,
} from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { Tx } from 'web3/eth/types'
import { EncodedTransaction } from 'web3/types'
import { EIP712TypedData, generateTypedDataHash } from './sign-typed-data-utils'
import { signTransaction } from './signing-utils'

export interface IWallet {
  addAccount: (privateKey: string) => void
  getAccounts: () => string[]
  hasAccount: (address: string) => boolean
  signTransaction: (txParams: Tx) => Promise<EncodedTransaction>
  signTypedData: (address: string, typedData: EIP712TypedData) => Promise<string>
  signPersonalMessage: (address: string, data: string) => Promise<string>
}

export function normalizeKey(key: string) {
  return ensureLeading0x(key).toLowerCase()
}

export class Wallet implements IWallet {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly accountAddressToPrivateKey = new Map<string, string>()

  addAccount(privateKey: string) {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = normalizeKey(privateKey)
    const accountAddress = normalizeKey(privateKeyToAddress(privateKey))
    if (this.accountAddressToPrivateKey.has(accountAddress)) {
      return
    }
    this.accountAddressToPrivateKey.set(accountAddress, privateKey)
  }

  getAccounts(): string[] {
    return Array.from(this.accountAddressToPrivateKey.keys())
  }

  hasAccount(address: string) {
    if (address) {
      return this.accountAddressToPrivateKey.has(normalizeKey(address))
    } else {
      return false
    }
  }

  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    return signTransaction(txParams, this.getPrivateKeyFor(txParams.from!))
  }

  // Original code taken from
  // https://github.com/0xProject/0x-monorepo/blob/78c704e3d/packages/subproviders/src/subproviders/private_key_wallet.ts
  /**
   * Sign a personal Ethereum signed message.
   * The address must be provided it must match the address calculated from the private key.
   * @param address Address of the account to sign with
   * @param data Hex string message to sign
   * @return Signature hex string (order: rsv)
   */
  async signPersonalMessage(address: string, data: string): Promise<string> {
    if (!isHexString(data)) {
      throw Error('Expected data has to be an Hex String ')
    }
    // ecsign needs a privateKey without 0x
    const pk = trimLeading0x(this.getPrivateKeyFor(address))
    const pkBuffer = Buffer.from(pk, 'hex')

    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)

    const sig = ethUtil.ecsign(msgHashBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }

  // Original code taken from
  // https://github.com/0xProject/0x-monorepo/blob/78c704e3d/packages/subproviders/src/subproviders/private_key_wallet.ts
  /**
   * Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
   * The address must be provided it must match the address calculated from the private key.
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  async signTypedData(address: string, typedData: EIP712TypedData): Promise<string> {
    if (typedData === undefined) {
      throw Error('TypedData Missing')
    }

    // ecsign needs a privateKey without 0x
    const pk = trimLeading0x(this.getPrivateKeyFor(address))
    const pkBuffer = Buffer.from(pk, 'hex')

    const dataBuff = generateTypedDataHash(typedData)

    const sig = ethUtil.ecsign(dataBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }

  private getPrivateKeyFor(account: string): string {
    if (account) {
      const maybePk = this.accountAddressToPrivateKey.get(normalizeKey(account))
      if (maybePk != null) {
        return maybePk
      }
    }
    throw Error(`tx-signing@getPrivateKey: ForPrivate key not found for ${account}`)
  }
}

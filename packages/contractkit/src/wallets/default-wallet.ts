import {
  isHexString,
  normalizeAddressWith0x,
  privateKeyToAddress,
  trimLeading0x,
} from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { EncodedTransaction, Tx } from 'web3-core'
import { Address } from '../base'
import { EIP712TypedData, generateTypedDataHash } from '../utils/sign-typed-data-utils'
import { signTransaction } from '../utils/signing-utils'
import { Wallet } from './wallet'

export class DefaultWallet implements Wallet {
  // Account addresses are hex-encoded, lower case alphabets
  private readonly privateKeys = new Map<Address, string>()

  addAccount(privateKey: string): void {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = normalizeAddressWith0x(privateKey)
    const accountAddress = normalizeAddressWith0x(privateKeyToAddress(privateKey))
    if (this.privateKeys.has(accountAddress)) {
      return
    }
    this.privateKeys.set(accountAddress, privateKey)
  }

  getAccounts(): Address[] {
    return Array.from(this.privateKeys.keys())
  }

  hasAccount(address?: string) {
    if (address) {
      return this.privateKeys.has(normalizeAddressWith0x(address))
    } else {
      return false
    }
  }

  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    return signTransaction(txParams, this.getPrivateKeyFor(txParams.from!.toString()))
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
      throw Error('default-wallet@signPersonalMessage: Expected data has to be an Hex String ')
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
  async signTypedData(address: Address, typedData: EIP712TypedData): Promise<string> {
    if (typedData === undefined) {
      throw Error('default-wallet@signTypedData: TypedData Missing')
    }

    // ecsign needs a privateKey without 0x
    const pk = trimLeading0x(this.getPrivateKeyFor(address))
    const pkBuffer = Buffer.from(pk, 'hex')

    const dataBuff = generateTypedDataHash(typedData)

    const sig = ethUtil.ecsign(dataBuff, pkBuffer)
    const rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s)
    return rpcSig
  }

  private getPrivateKeyFor(account: Address): string {
    if (account) {
      const maybePk = this.privateKeys.get(normalizeAddressWith0x(account))
      if (maybePk != null) {
        return maybePk
      }
    }
    throw Error(`default-wallet@getPrivateKeyFor: Private key not found for ${account}`)
  }
}

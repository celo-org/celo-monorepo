// @ts-ignore-next-line
import { account as Account, bytes as Bytes, hash as Hash, nat as Nat, RLP } from 'eth-lib'
// @ts-ignore-next-line
import * as helpers from 'web3-core-helpers'
// @ts-ignore-next-line
import { BN } from 'bn.js'
import { AzureKeyVaultClient } from './azure-key-vault-client'
import { isHexString, trimLeading0x } from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { EIP712TypedData, generateTypedDataHash } from '../utils/sign-typed-data-utils'

export interface Signer {
  /**
   * Signs the message and returns an EVM transaction
   * @param addToV represents the chainId and is added to the recoveryId to prevent replay
   * @param message is the hashed transaction object
   */
  sign: (addToV: number, hexMessage: string) => Promise<string>
}

/**
 * Signs the EVM transaction using the provided private key
 */
export class LocalSigner implements Signer {
  private privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }

  async sign(addToV: number, hexMessage: string) {
    return Account.makeSigner(addToV)(hexMessage, this.privateKey)
  }
}

/**
 * Signs the EVM transaction using an HSM key in Azure Key Vault
 * Credentials must be set as environment variables prior to calling sign operation
 */
export class RemoteAKVSigner implements Signer {
  private keyVaultClient: AzureKeyVaultClient
  private keyName: string

  constructor(keyVaultClient: AzureKeyVaultClient, keyName: string) {
    this.keyVaultClient = keyVaultClient
    this.keyName = keyName
  }

  async sign(addToV: number, data: string) {
    if (!isHexString(data)) {
      throw Error('RemoteAKVSigner@sign: Expected data to be a hex string')
    }
    const bufferedMessage = Buffer.from(trimLeading0x(data), 'hex')
    const signature = await this.keyVaultClient.signMessage(bufferedMessage, this.keyName)

    const sigV = Nat.fromString(Bytes.fromNumber(addToV + signature.v))
    const sigR = Bytes.pad(32, Bytes.fromNat('0x' + signature.r.toString(16)))
    const sigS = Bytes.pad(32, Bytes.fromNat('0x' + signature.s.toString(16)))
    return Account.encodeSignature([sigV, sigR, sigS])
  }

  async signPersonalMessage(data: string) {
    if (!isHexString(data)) {
      throw Error('RemoteAKVSigner@sign: Expected data to be a hex string')
    }
    const bufferedMessage = Buffer.from(trimLeading0x(data), 'hex')
    const sig = await this.keyVaultClient.signMessage(bufferedMessage, this.keyName)
    const rpcSig = ethUtil.toRpcSig(sig.v, ethUtil.toBuffer(sig.r), ethUtil.toBuffer(sig.s))
    return rpcSig
  }

  async signTypedData(typedData: EIP712TypedData): Promise<string> {
    if (typedData === undefined) {
      throw Error('RemoteAKVSigner@sign: TypedData Missing')
    }
    const dataBuff = generateTypedDataHash(typedData)
    const sig = await this.keyVaultClient.signMessage(dataBuff, this.keyName)
    const rpcSig = ethUtil.toRpcSig(sig.v, ethUtil.toBuffer(sig.r), ethUtil.toBuffer(sig.s))
    return rpcSig
  }
}

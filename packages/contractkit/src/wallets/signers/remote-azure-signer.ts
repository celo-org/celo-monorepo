// @ts-ignore-next-line
import { account as Account, bytes as Bytes, hash as Hash, nat as Nat, RLP } from 'eth-lib'
// @ts-ignore-next-line
import * as helpers from 'web3-core-helpers'
// @ts-ignore-next-line
import { BN } from 'bn.js'
import { AzureKeyVaultClient } from './azure-key-vault-client'
import { trimLeading0x } from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { EIP712TypedData, generateTypedDataHash } from '../../utils/sign-typed-data-utils'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

/**
 * Signs the EVM transaction using an HSM key in Azure Key Vault
 * Credentials must be set as environment variables prior to calling sign operation
 */
export class RemoteAzureSigner implements Signer {
  private keyVaultClient: AzureKeyVaultClient
  private keyName: string

  constructor(keyVaultClient: AzureKeyVaultClient, keyName: string) {
    this.keyVaultClient = keyVaultClient
    this.keyName = keyName
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const signature = await this.keyVaultClient.signMessage(bufferedMessage, this.keyName)

    const sigV = Nat.fromString(Bytes.fromNumber(addToV + signature.v))
    const sigR = Bytes.pad(32, Bytes.fromNat('0x' + signature.r.toString(16)))
    const sigS = Bytes.pad(32, Bytes.fromNat('0x' + signature.s.toString(16)))
    return { v: sigV, r: sigR, s: sigS }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
    const sig = await this.keyVaultClient.signMessage(Buffer.from(msgHashBuff), this.keyName)
    // TODO cleanup
    const sigR = Bytes.pad(32, Bytes.fromNat('0x' + sig.r.toString(16)))
    const sigS = Bytes.pad(32, Bytes.fromNat('0x' + sig.s.toString(16)))
    const sigV = sig.v + 27
    return { v: sigV, r: sigR, s: sigS }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = generateTypedDataHash(typedData)
    const sig = await this.keyVaultClient.signMessage(dataBuff, this.keyName)
    // TODO cleanup
    const sigR = Bytes.pad(32, Bytes.fromNat('0x' + sig.r.toString(16)))
    const sigS = Bytes.pad(32, Bytes.fromNat('0x' + sig.s.toString(16)))
    return { v: sig.v, r: sigR, s: sigS }
  }

  getNativeKey(): string {
    return this.keyName
  }
}

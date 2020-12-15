import { ensureLeading0x, trimLeading0x } from '@celo/base/lib/address'
import { RLPEncodedTx, Signer } from '@celo/connect'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { getHashFromEncoded } from '@celo/wallet-base'
import * as ethUtil from 'ethereumjs-util'
import { AzureKeyVaultClient } from './azure-key-vault-client'

/**
 * Signs the EVM transaction using an HSM key in Azure Key Vault
 */
export class AzureHSMSigner implements Signer {
  private static keyVaultClient: AzureKeyVaultClient
  private keyName: string

  constructor(keyVaultClient: AzureKeyVaultClient, keyName: string) {
    if (!AzureHSMSigner.keyVaultClient) {
      AzureHSMSigner.keyVaultClient = keyVaultClient
    }

    this.keyName = keyName
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const signature = await AzureHSMSigner.keyVaultClient.signMessage(bufferedMessage, this.keyName)
    const sigV = addToV + signature.v

    return {
      v: sigV,
      r: signature.r,
      s: signature.s,
    }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = ethUtil.toBuffer(ensureLeading0x(data))
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
    const signature = await AzureHSMSigner.keyVaultClient.signMessage(
      Buffer.from(msgHashBuff),
      this.keyName
    )
    // Recovery ID should be a byte prefix
    // https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v
    const sigV = signature.v + 27

    return {
      v: sigV,
      r: signature.r,
      s: signature.s,
    }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = generateTypedDataHash(typedData)
    const signature = await AzureHSMSigner.keyVaultClient.signMessage(dataBuff, this.keyName)

    // Recovery ID should be a byte prefix
    // https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v
    const sigV = signature.v + 27
    return {
      v: sigV,
      r: signature.r,
      s: signature.s,
    }
  }

  getNativeKey(): string {
    return this.keyName
  }

  decrypt(_ciphertext: Buffer) {
    throw new Error('Decryption operation is not supported on this signer')
    // To make the compiler happy
    return Promise.resolve(_ciphertext)
  }

  computeSharedSecret(_publicKey: string) {
    throw new Error('Not implemented')
    return Promise.resolve(Buffer.from([]))
  }
}

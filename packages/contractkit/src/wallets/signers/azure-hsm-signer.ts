import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { AzureKeyVaultClient } from '../../utils/azure-key-vault-client'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

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

  getNativeKey(): string {
    return this.keyName
  }
}

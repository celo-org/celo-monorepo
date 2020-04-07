import { trimLeading0x } from '@celo/utils/lib/address'
import * as ethUtil from 'ethereumjs-util'
import { EIP712TypedData, generateTypedDataHash } from '../../utils/sign-typed-data-utils'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { AzureKeyVaultClient } from './azure-key-vault-client'
import { Signer } from './signer'

/**
 * Signs the EVM transaction using an HSM key in Azure Key Vault
 */
export class AzureHSMSigner implements Signer {
  private keyVaultClient: AzureKeyVaultClient
  private keyName: string

  constructor(keyVaultClient: AzureKeyVaultClient, keyName: string) {
    this.keyVaultClient = keyVaultClient
    this.keyName = keyName
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: string; r: string; s: string }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const signature = await this.keyVaultClient.signMessage(bufferedMessage, this.keyName)
    const sigVT = addToV + signature.v
    return {
      v: sigVT.toString(16),
      r: signature.r.toString(16),
      s: signature.s.toString(16),
    }
  }

  async signPersonalMessage(
    data: string
  ): Promise<{ v: number; r: Buffer | Uint8Array; s: Buffer | Uint8Array }> {
    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
    const signature = await this.keyVaultClient.signMessage(Buffer.from(msgHashBuff), this.keyName)
    const sigV = signature.v + 27

    return {
      v: sigV,
      r: ethUtil.toBuffer(signature.r),
      s: ethUtil.toBuffer(signature.s),
    }
  }

  async signTypedData(
    typedData: EIP712TypedData
  ): Promise<{ v: number; r: Buffer | Uint8Array; s: Buffer | Uint8Array }> {
    const dataBuff = generateTypedDataHash(typedData)
    const signature = await this.keyVaultClient.signMessage(dataBuff, this.keyName)
    const sigV = signature.v + 27

    return {
      v: sigV,
      r: ethUtil.toBuffer(signature.r),
      s: ethUtil.toBuffer(signature.s),
    }
  }

  getNativeKey(): string {
    return this.keyName
  }
}

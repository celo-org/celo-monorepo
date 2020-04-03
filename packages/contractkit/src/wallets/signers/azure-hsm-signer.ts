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
import { getHashFromEncoded, RLPEncodedTx, toPaddedBuffer } from '../../utils/signing-utils'
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
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const signature = await this.keyVaultClient.signMessage(bufferedMessage, this.keyName)

    const sigV = Nat.fromString(Bytes.fromNumber(addToV + signature.v))
    const sigR = toPaddedBuffer(signature.r)
    const sigS = toPaddedBuffer(signature.s)
    return { v: sigV, r: sigR, s: sigS }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = ethUtil.toBuffer(data)
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff)
    const signature = await this.keyVaultClient.signMessage(Buffer.from(msgHashBuff), this.keyName)

    const sigR = toPaddedBuffer(signature.r)
    const sigS = toPaddedBuffer(signature.s)
    const sigV = signature.v + 27
    return { v: sigV, r: sigR, s: sigS }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const dataBuff = generateTypedDataHash(typedData)
    const signature = await this.keyVaultClient.signMessage(dataBuff, this.keyName)

    const sigR = toPaddedBuffer(signature.r)
    const sigS = toPaddedBuffer(signature.s)
    return { v: signature.v, r: sigR, s: sigS }
  }

  getNativeKey(): string {
    return this.keyName
  }
}

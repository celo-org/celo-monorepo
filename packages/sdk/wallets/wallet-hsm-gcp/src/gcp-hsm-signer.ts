import { RLPEncodedTx, Signer } from '@celo/connect'
import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { getHashFromEncoded } from '@celo/wallet-base'
import {
  bigNumberToBuffer,
  bufferToBigNumber,
  makeCanonical,
  parseBERSignature,
  recoverKeyIndex,
  Signature,
  sixtyFour,
  thirtyTwo,
} from '@celo/wallet-hsm'
import { KeyManagementServiceClient } from '@google-cloud/kms'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'

export class GcpHsmSigner implements Signer {
  private client: KeyManagementServiceClient
  private versionName: string
  private publicKey: BigNumber

  constructor(client: KeyManagementServiceClient, versionName: string, publicKey: BigNumber) {
    this.client = client
    this.versionName = versionName
    this.publicKey = publicKey
  }

  private async findCanonicalSignature(buffer: Buffer): Promise<{ S: BigNumber; R: BigNumber }> {
    let S: BigNumber
    let R: BigNumber

    const [signResponse] = await this.client.asymmetricSign({
      name: this.versionName,
      digest: {
        sha256: buffer,
      },
    })
    const { r, s } = parseBERSignature(signResponse.signature as Buffer)

    R = bufferToBigNumber(r)
    S = bufferToBigNumber(s)
    S = makeCanonical(S)

    return { S: S!, R: R! }
  }

  private async sign(buffer: Buffer): Promise<Signature> {
    const { R, S } = await this.findCanonicalSignature(buffer)
    const rBuff = bigNumberToBuffer(R, thirtyTwo)
    const sBuff = bigNumberToBuffer(S, thirtyTwo)
    const recoveryParam = recoverKeyIndex(
      Buffer.concat([rBuff, sBuff], sixtyFour),
      this.publicKey,
      buffer
    )

    return {
      r: rBuff,
      s: sBuff,
      v: recoveryParam,
    }
  }

  async signTransaction(addToV: number, encodedTx: RLPEncodedTx): Promise<Signature> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const { v, r, s } = await this.sign(bufferedMessage)

    return {
      v: v + addToV,
      r,
      s,
    }
  }

  async signPersonalMessage(data: string): Promise<Signature> {
    const dataBuff = ethUtil.toBuffer(ensureLeading0x(data))
    const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff) as Buffer
    const { v, r, s } = await this.sign(msgHashBuff)

    return {
      v: v + 27,
      r,
      s,
    }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<Signature> {
    const typedDataHashBuff = generateTypedDataHash(typedData)
    const { v, r, s } = await this.sign(typedDataHashBuff)

    return {
      v: v + 27,
      r,
      s,
    }
  }

  getNativeKey(): string {
    return this.versionName
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

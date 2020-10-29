import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { EIP712TypedData, generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { KMS } from 'aws-sdk'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'
import { parseBERSignature } from '../../utils/ber-utils'
import {
  bigNumberToBuffer,
  bufferToBigNumber,
  makeCanonical,
  Signature,
} from '../../utils/signature-utils'
import {
  getHashFromEncoded,
  recoverKeyIndex,
  RLPEncodedTx,
  sixtyFour,
  thirtyTwo,
} from '../../utils/signing-utils'
import { Signer } from './signer'

const SigningAlgorithm = 'ECDSA_SHA_256'

export class AwsHsmSigner implements Signer {
  private kms: KMS
  private keyId: string
  private publicKey: BigNumber

  constructor(kms: KMS, keyId: string, publicKey: BigNumber) {
    this.kms = kms
    this.keyId = keyId
    this.publicKey = publicKey
  }

  private async findCanonicalSignature(buffer: Buffer): Promise<{ S: BigNumber; R: BigNumber }> {
    let S: BigNumber
    let R: BigNumber

    const { Signature: signature } = await this.kms
      .sign({
        KeyId: this.keyId,
        MessageType: 'DIGEST',
        Message: buffer,
        SigningAlgorithm,
      })
      .promise()
    const { r, s } = parseBERSignature(signature as Buffer)

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
    return this.keyId
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

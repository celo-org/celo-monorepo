import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { KMS } from 'aws-sdk'
import { BigNumber } from 'bignumber.js'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
import { parseBERSignature } from '../../utils/ber-utils'
import {
  bigNumberToBuffer,
  bufferToBigNumber,
  isCanonical,
  Signature,
} from '../../utils/signature-utils'
import { getHashFromEncoded, recoverKeyIndex, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

const SigningAlgorithm = 'ECDSA_SHA_256'
const secp256k1Curve = new EC('secp256k1')

export default class AwsHsmSigner implements Signer {
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

    let flag = true
    while (flag) {
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

      const N = bufferToBigNumber(secp256k1Curve.curve.n)
      if (isCanonical(S, N)) {
        flag = false
      }
    }

    return { S: S!, R: R! }
  }

  private async sign(buffer: Buffer): Promise<Signature> {
    const { R, S } = await this.findCanonicalSignature(buffer)
    const rBuff = bigNumberToBuffer(R, 32)
    const sBuff = bigNumberToBuffer(S, 32)
    const recoveryParam = recoverKeyIndex(Buffer.concat([rBuff, sBuff], 64), this.publicKey, buffer)

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

  getNativeKey(): string {
    return this.keyId
  }
}

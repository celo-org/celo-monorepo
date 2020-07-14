import { ensureLeading0x, publicKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import { KMS } from 'aws-sdk'
import BigNumber from 'bignumber.js'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
import { parseBERSignature } from '../../utils/ber-utils'
import {
  bigNumberToBuffer,
  bufferToBigNumber,
  isCanonical,
  Signature,
} from '../../utils/signature-utils'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

const SigningAlgorithm = 'ECDSA_SHA_256'
const secp256k1Curve = new EC('secp256k1')

function getRecoveryParam(message: Buffer, expectedAddress: string, r: Buffer, s: Buffer): number {
  for (let i = 0; i < 2; i++) {
    const recoveredPublicKeyByteArray = ethUtil.ecrecover(message, i + 27, r, s)
    const publicKeyBuff = Buffer.from(recoveredPublicKeyByteArray)

    const pub = bigNumberToBuffer(bufferToBigNumber(publicKeyBuff), 64)
    if (publicKeyToAddress(ensureLeading0x(pub.toString('hex'))) === expectedAddress) {
      return i
    }
  }

  throw new Error('unable to recover public key from signature')
}

export default class AwsHsmSigner implements Signer {
  private kms: KMS
  private keyId: string
  private address: string

  constructor(kms: KMS, keyId: string, address: string) {
    this.kms = kms
    this.keyId = keyId
    this.address = address
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
    const recoveryParam = getRecoveryParam(buffer, this.address, rBuff, sBuff)

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

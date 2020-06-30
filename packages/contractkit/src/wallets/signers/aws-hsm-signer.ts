import { publicKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import { KMS } from 'aws-sdk'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
import { parseBERSignature } from '../../utils/ber-utils'
import { bigNumberToBuffer, bufferToBigNumber, isCanonical } from '../../utils/signature-utils'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

const SigningAlgorithm = 'ECDSA_SHA_256'
const secp256k1Curve = new EC('secp256k1')

function getRecoveryParam(message: Buffer, expectedAddress: string, r: Buffer, s: Buffer): number {
  for (let i = 0; i < 2; i++) {
    try {
      const recoveredPublicKey = ethUtil.ecrecover(message, i + 27, r, s) as Buffer
      if (publicKeyToAddress(recoveredPublicKey.toString('hex')) !== expectedAddress) {
        throw new Error('invalid public key recovered')
      }
      return i
    } catch (e) {}
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

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const { Signature: signature } = await this.kms
      .sign({
        KeyId: this.keyId,
        MessageType: 'DIGEST',
        Message: bufferedMessage,
        SigningAlgorithm,
      })
      .promise()
    const { r, s } = parseBERSignature(signature as Buffer)
    const R = bufferToBigNumber(r)
    let S = bufferToBigNumber(s)

    const N = bufferToBigNumber(secp256k1Curve.curve.n)
    if (!isCanonical(S, N)) {
      S = N.minus(S)
    }

    const rBuff = bigNumberToBuffer(R, 32)
    const sBuff = bigNumberToBuffer(S, 32)
    const recoveryParam = getRecoveryParam(bufferedMessage, this.address, r, s)

    return {
      v: recoveryParam + addToV,
      r: rBuff,
      s: sBuff,
    }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    console.log('> signPersonalMessage', data)
    return {
      v: 10,
      r: Buffer.from([]),
      s: Buffer.from([]),
    }
  }

  getNativeKey(): string {
    return ''
  }
}

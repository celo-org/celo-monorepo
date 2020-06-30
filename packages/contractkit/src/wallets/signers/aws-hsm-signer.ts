import { publicKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import * as asn1js from 'asn1js'
import { KMS } from 'aws-sdk'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
import { bigNumberToBuffer, bufferToBigNumber, isCanonical } from '../../utils/signature-utils'
import { getHashFromEncoded, RLPEncodedTx } from '../../utils/signing-utils'
import { Signer } from './signer'

const SigningAlgorithm = 'ECDSA_SHA_256'

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

/**
 * AWS returns DER encoded signatures but DER is valid BER
 */
function parseBERSignature(sig: Buffer): { r: Buffer; s: Buffer } {
  const { result } = asn1js.fromBER(toArrayBuffer(sig))

  const part1 = (result as asn1js.Sequence).valueBlock.value[0] as asn1js.BitString
  const part2 = (result as asn1js.Sequence).valueBlock.value[1] as asn1js.BitString

  return {
    r: Buffer.from(part1.valueBlock.valueHex),
    s: Buffer.from(part2.valueBlock.valueHex),
  }
}

function publicKeyFromAsn1(buf: Buffer): Buffer {
  const { result } = asn1js.fromBER(toArrayBuffer(buf))
  const values = (result as asn1js.Sequence).valueBlock.value
  const value = values[1] as asn1js.BitString
  return Buffer.from(value.valueBlock.valueHex.slice(1))
}

const kms = new KMS({ region: 'eu-central-1', apiVersion: '2014-11-01' })

const secp256k1Curve = new EC('secp256k1')

export default class AwsHsmSigner implements Signer {
  private keyId: string
  constructor(keyId: string) {
    this.keyId = keyId
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const { Signature: signature } = await kms
      .sign({
        KeyId: this.keyId,
        MessageType: 'DIGEST',
        Message: bufferedMessage,
        SigningAlgorithm,
      })
      .promise()
    const { PublicKey } = await kms.getPublicKey({ KeyId: this.keyId }).promise()
    const publicKey = publicKeyFromAsn1(PublicKey as Buffer)

    const correctAddress = publicKeyToAddress(publicKey.toString('hex'))

    const { r, s } = parseBERSignature(signature as Buffer)
    const R = bufferToBigNumber(r)
    let S = bufferToBigNumber(s)

    const N = bufferToBigNumber(secp256k1Curve.curve.n)
    if (!isCanonical(S, N)) {
      S = N.minus(S)
    }

    const rBuff = bigNumberToBuffer(R, 32)
    const sBuff = bigNumberToBuffer(S, 32)

    let recoveredPublicKey: Buffer
    let recoveryParam: number
    let v: number

    try {
      recoveryParam = 27
      v = 0
      recoveredPublicKey = ethUtil.ecrecover(bufferedMessage, recoveryParam, r, s) as Buffer

      if (publicKeyToAddress(recoveredPublicKey.toString('hex')) !== correctAddress) {
        throw new Error('invalid')
      }
    } catch (e) {
      recoveryParam = 28
      v = 1
      recoveredPublicKey = ethUtil.ecrecover(bufferedMessage, recoveryParam, r, s) as Buffer
    }

    return {
      v: v + addToV,
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

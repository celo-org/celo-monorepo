import { trimLeading0x } from '@celo/utils/lib/address'
import * as asn1 from 'asn1js'
import { KMS } from 'aws-sdk'
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

const kms = new KMS({ region: 'eu-central-1', apiVersion: '2014-11-01' })

function parseBERSignature(sig: Buffer): { r: Buffer; s: Buffer } {
  const { result } = asn1.fromBER(toArrayBuffer(sig))
  const part1 = (result as asn1.Sequence).valueBlock.value[0] as asn1.BitString
  const part2 = (result as asn1.Sequence).valueBlock.value[1] as asn1.BitString

  return {
    r: Buffer.from(part1.valueBlock.valueHex),
    s: Buffer.from(part2.valueBlock.valueHex),
  }
}

// main()

export default class AwsHsmSigner implements Signer {
  private keyId: string
  constructor(keyId: string) {
    this.keyId = keyId
  }

  async signTransaction(
    // @ts-ignore
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    console.log('>>> signing', encodedTx)

    const hash = getHashFromEncoded(encodedTx.rlpEncode)
    const bufferedMessage = Buffer.from(trimLeading0x(hash), 'hex')
    const { Signature: signature } = await kms
      .sign({
        KeyId: this.keyId,
        Message: bufferedMessage,
        SigningAlgorithm,
      })
      .promise()
    console.log('sig', signature?.toString('base64'))

    const { r, s } = parseBERSignature(signature as Buffer)

    console.log('r', r)
    console.log('s', s)

    return {
      v: 21,
      r,
      s,
    }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    console.log('> signPersonal', data)
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

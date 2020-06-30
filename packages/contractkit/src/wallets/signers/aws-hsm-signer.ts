import { ensureLeading0x, publicKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'
import * as asn1js from 'asn1js'
import { KMS } from 'aws-sdk'
import { BigNumber } from 'bignumber.js'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
// import { ecdsaRecover } from 'secp256k1'
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

//call this with your signature buffer
function parseBERSignature(sig: Buffer): { r: Buffer; s: Buffer } {
  const { result } = asn1js.fromBER(toArrayBuffer(sig))

  const part1 = (result as asn1js.Sequence).valueBlock.value[0] as asn1js.BitString
  const part2 = (result as asn1js.Sequence).valueBlock.value[1] as asn1js.BitString

  // const sequence = result as asn1js.Sequence
  // return {
  //   r: Buffer.from(sequence.valueBlock.valueBeforeDecode).slice(0, 32),
  //   s: Buffer.from(sequence.valueBlock.valueBeforeDecode).slice(32, 64),
  // }

  return {
    r: Buffer.from(part1.valueBlock.valueHex),
    s: Buffer.from(part2.valueBlock.valueHex),
  }
}

// call this with your KMS public key
function publicKeyFromAsn1(buf: Buffer): Buffer {
  const { result } = asn1js.fromBER(toArrayBuffer(buf))
  const values = (result as asn1js.Sequence).valueBlock.value
  const value = values[1] as asn1js.BitString

  // console.log('>>> public key hex', value.valueBlock.valueHex.)
  return Buffer.from(value.valueBlock.valueHex.slice(1))
}

const bufferToBigNumber = (input: Buffer): BigNumber => {
  return new BigNumber(ensureLeading0x(input.toString('hex')))
}

const isCanonical = (S: BigNumber, curveN: BigNumber): boolean => {
  return S.comparedTo(curveN.dividedBy(2)) <= 0
}

const bigNumberToBuffer = (input: BigNumber, lengthInBytes: number): Buffer => {
  let hex = input.toString(16)
  const hexLength = lengthInBytes * 2 // 2 hex characters per byte.
  if (hex.length < hexLength) {
    hex = '0'.repeat(hexLength - hex.length) + hex
  }
  return ethUtil.toBuffer(ensureLeading0x(hex)) as Buffer
}

// const recoverKeyIndex = (signature: Uint8Array, publicKey: BigNumber, hash: Uint8Array): number => {
//   for (let i = 0; i < 4; i++) {
//     try {
//       const recoveredPublicKeyByteArr = ecdsaRecover(signature, i, hash, false)
//       const publicKeyBuff = Buffer.from(recoveredPublicKeyByteArr)
//       const recoveredPublicKey = bufferToBigNumber(publicKeyBuff)
//       console.log('Recovered key: ' + recoveredPublicKey)
//       console.log('Expected key: ' + publicKey)
//       if (publicKey.eq(recoveredPublicKey)) {
//         return i
//       }
//     } catch (e) {
//       console.log('recovery error', e.message)
//     }
//   }
//   console.log('throwing')
//   throw new Error('Unable to generate recovery key from signature.')
// }

const kms = new KMS({ region: 'eu-central-1', apiVersion: '2014-11-01' })

// function parseBERSignature(sig: Buffer): { r: Buffer; s: Buffer } {
//   const { result } = asn1.fromBER(toArrayBuffer(sig))
//   const part1 = (result as asn1.Sequence).valueBlock.value[0] as asn1.BitString
//   const part2 = (result as asn1.Sequence).valueBlock.value[1] as asn1.BitString

//   return {
//     r: Buffer.from(part1.valueBlock.valueHex),
//     s: Buffer.from(part2.valueBlock.valueHex),
//   }
// }

const secp256k1Curve = new EC('secp256k1')

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
    console.log('>>> signing', addToV, encodedTx)
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
    // Canonicalize signature
    // const { r, s } = parseBERSignature(signature as Buffer)
    // const R = bufferToBigNumber(r)
    // let S = bufferToBigNumber(s)
    const publicKey = publicKeyFromAsn1(PublicKey as Buffer)
    console.log('hex pub key', publicKey.toString('hex'))

    const correctAddress = publicKeyToAddress(publicKey.toString('hex'))

    // console.log('generated', publicKey.toString('hex'))
    // console.log('assumed', publicKeyToAddress(Buffer.from(rawPublicKey, 'base64').toString('hex')))
    // const R = bufferToBigNumber(DER.slice(0, 32))
    // let S = bufferToBigNumber(DER.slice(32, 64))
    // console.log(DER, R, S)

    const { r, s } = parseBERSignature(signature as Buffer)
    const R = bufferToBigNumber(r)
    let S = bufferToBigNumber(s)
    // cosnt

    // const R = bufferToBigNumber(Buffer.from((signature as Buffer).slice(0, 32)))
    // let S = bufferToBigNumber(Buffer.from((signature as Buffer).slice(32, 64)))

    // The Azure Signature MAY not be canonical, which is illegal in Ethereum
    // thus it must be transposed to the lower intersection.
    // https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures
    const N = bufferToBigNumber(secp256k1Curve.curve.n)
    if (!isCanonical(S, N)) {
      console.log('Canonicalizing signature')
      S = N.minus(S)
    }

    const rBuff = bigNumberToBuffer(R, 32)
    const sBuff = bigNumberToBuffer(S, 32)
    // const canonicalizedSignature = Buffer.concat([rBuff, sBuff])

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
    console.log('recovered public key', recoveredPublicKey.toString('hex'))
    console.log('recovered address', publicKeyToAddress(recoveredPublicKey.toString('hex')))

    // const recoveryParam = recoverKeyIndex(
    //   canonicalizedSignature,
    //   bufferToBigNumber(recoveredPublicKey),
    //   bufferedMessage
    // )

    return {
      v: v + addToV,
      r: rBuff,
      s: sBuff,
    }

    // console.log('sig', signature?.toString('base64'))

    // const actual = encodedTx.transaction.from

    // // const rs = {
    // //   r: (signature as Buffer).slice(0, 32),
    // //   s: (signature as Buffer).slice(32, 64),
    // // }
    // const { r, s } = asn1.fromBER(signature as Buffer)

    // let i = 0
    // while (i < 30) {
    //   try {
    //     const pubKey = ethUtil.ecrecover(Buffer.from(trimLeading0x(hash), 'hex'), i, r, s)
    //     const derived = publicKeyToAddress(pubKey.toString('hex'))
    //     if (derived === actual) {
    //       console.log('found a match!', i)
    //     }
    //   } catch (e) {
    //     console.log('e', e.message)
    //   }
    //   i++
    // }

    // const v = 27
    // const v2 = 28
    // const pubKey = ethUtil.ecrecover(Buffer.from(trimLeading0x(hash), 'hex'), v, rs.r, rs.s)
    // const pubKey2 = ethUtil.ecrecover(Buffer.from(trimLeading0x(hash), 'hex'), v2, rs.r, rs.s)
    // console.log(
    //   'derived address >>>',
    //   publicKeyToAddress(pubKey.toString('hex')),
    //   publicKeyToAddress(pubKey2.toString('hex'))
    // )

    // // let { r, s } = parseBERSignature(signature as Buffer)
    // // console.log('are these the same?', rs.r.toString('base64'), r.toString('base64'))
    // // if (s > curve.n / 2) id = id ^ 1 // Invert id if s of signature is over half the n

    // return {
    //   v,
    //   r: rs.r,
    //   s: rs.s,
    // }
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

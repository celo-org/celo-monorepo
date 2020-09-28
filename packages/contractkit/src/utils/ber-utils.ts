import * as asn1 from 'asn1js'
import { BigNumber } from 'bignumber.js'
import { bigNumberToBuffer, bufferToBigNumber } from './signature-utils'

export const toArrayBuffer = (b: Buffer): ArrayBuffer => {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}

export function publicKeyFromAsn1(b: Buffer): BigNumber {
  const { result } = asn1.fromBER(toArrayBuffer(b))
  const values = (result as asn1.Sequence).valueBlock.value
  if (values.length < 2) {
    throw new Error('Cannot get public key from Asn1: invalid sequence')
  }
  const value = values[1] as asn1.BitString
  return bufferToBigNumber(Buffer.from(value.valueBlock.valueHex.slice(1)))
}

/**
 * This is used only for mocking
 * Creates an asn1 key to emulate KMS response
 */
export function asn1FromPublicKey(bn: BigNumber): Buffer {
  const pkbuff = bigNumberToBuffer(bn, 64)
  const sequence = new asn1.Sequence()
  const values = sequence.valueBlock.value
  for (const i of [0, 1]) {
    values.push(
      new asn1.Integer({
        value: i,
      })
    )
  }
  const value = values[1] as asn1.BitString
  // Adding a dummy padding byte
  const padding = Buffer.from(new Uint8Array([0x00]))
  value.valueBlock.valueHex = Buffer.concat([padding, pkbuff])
  return Buffer.from(sequence.toBER(false))
}

/**
 * AWS returns DER encoded signatures but DER is valid BER
 */
export function parseBERSignature(b: Buffer): { r: Buffer; s: Buffer } {
  const { result } = asn1.fromBER(toArrayBuffer(b))

  const parts = (result as asn1.Sequence).valueBlock.value as asn1.BitString[]
  if (parts.length < 2) {
    throw new Error('Invalid signature parsed')
  }
  const [part1, part2] = parts

  return {
    r: Buffer.from(part1.valueBlock.valueHex),
    s: Buffer.from(part2.valueBlock.valueHex),
  }
}

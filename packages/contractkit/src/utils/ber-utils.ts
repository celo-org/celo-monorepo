import * as asn1 from 'asn1js'
import { BigNumber } from 'bignumber.js'
import { bufferToBigNumber } from './signature-utils'

export const toArrayBuffer = (b: Buffer): ArrayBuffer => {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}

export function publicKeyFromAsn1(b: Buffer): BigNumber {
  const { result } = asn1.fromBER(toArrayBuffer(b))
  const values = (result as asn1.Sequence).valueBlock.value
  const value = values[1] as asn1.BitString
  return bufferToBigNumber(Buffer.from(value.valueBlock.valueHex.slice(1)))
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

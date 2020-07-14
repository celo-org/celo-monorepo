// import { ensureLeading0x } from '@celo/utils/lib/address'
import * as asn1 from 'asn1js'
import { bufferToBigNumber } from './signature-utils'
import { BigNumber } from 'bignumber.js'

export const toArrayBuffer = (b: Buffer): ArrayBuffer => {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}

export function publicKeyFromAsn1(b: Buffer): BigNumber {
  const { result } = asn1.fromBER(toArrayBuffer(b))
  const values = (result as asn1.Sequence).valueBlock.value
  const value = values[1] as asn1.BitString
  // return ensureLeading0x(Buffer.from(value.valueBlock.valueHex.slice(1)).toString('hex'))
  return bufferToBigNumber(Buffer.from(value.valueBlock.valueHex.slice(1)))
}

/**
 * AWS returns DER encoded signatures but DER is valid BER
 */
export function parseBERSignature(b: Buffer): { r: Buffer; s: Buffer } {
  const { result } = asn1.fromBER(toArrayBuffer(b))

  const part1 = (result as asn1.Sequence).valueBlock.value[0] as asn1.BitString
  const part2 = (result as asn1.Sequence).valueBlock.value[1] as asn1.BitString

  return {
    r: Buffer.from(part1.valueBlock.valueHex),
    s: Buffer.from(part2.valueBlock.valueHex),
  }
}

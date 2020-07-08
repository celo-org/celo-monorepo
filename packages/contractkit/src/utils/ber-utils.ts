import { ensureLeading0x } from '@celo/utils/lib/address'
import * as asn1 from 'asn1js'

export const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

export function publicKeyFromAsn1(buf: Buffer): string {
  const { result } = asn1.fromBER(toArrayBuffer(buf))
  const values = (result as asn1.Sequence).valueBlock.value
  const value = values[1] as asn1.BitString
  return ensureLeading0x(Buffer.from(value.valueBlock.valueHex.slice(1)).toString('hex'))
}

/**
 * AWS returns DER encoded signatures but DER is valid BER
 */
export function parseBERSignature(sig: Buffer): { r: Buffer; s: Buffer } {
  const { result } = asn1.fromBER(toArrayBuffer(sig))

  const part1 = (result as asn1.Sequence).valueBlock.value[0] as asn1.BitString
  const part2 = (result as asn1.Sequence).valueBlock.value[1] as asn1.BitString

  return {
    r: Buffer.from(part1.valueBlock.valueHex),
    s: Buffer.from(part2.valueBlock.valueHex),
  }
}

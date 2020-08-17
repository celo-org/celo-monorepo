import { ensureLeading0x } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'

const secp256k1Curve = new EC('secp256k1')

/**
 * If the signature is in the "bottom" of the curve, it is non-canonical
 * Non-canonical signatures are illegal in Ethereum and therefore the S value
 * must be transposed to the lower intersection
 * https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures
 */
export const makeCanonical = (S: BigNumber): BigNumber => {
  const curveN = bufferToBigNumber(secp256k1Curve.curve.n)
  const isCanonical = S.comparedTo(curveN.dividedBy(2)) <= 0
  if (!isCanonical) {
    return curveN.minus(S)
  }
  return S
}

export const bufferToBigNumber = (input: Buffer): BigNumber => {
  return new BigNumber(ensureLeading0x(input.toString('hex')))
}

export const bigNumberToBuffer = (input: BigNumber, lengthInBytes: number): Buffer => {
  let hex = input.toString(16)
  const hexLength = lengthInBytes * 2 // 2 hex characters per byte.
  if (hex.length < hexLength) {
    hex = '0'.repeat(hexLength - hex.length) + hex
  }
  return ethUtil.toBuffer(ensureLeading0x(hex)) as Buffer
}

export class Signature {
  public v: number
  public r: Buffer
  public s: Buffer

  constructor(v: number, r: Buffer, s: Buffer) {
    this.v = v
    this.r = r
    this.s = s
  }
}

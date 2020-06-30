import { ensureLeading0x } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import * as ethUtil from 'ethereumjs-util'

/**
 * Returns true if the signature is in the "bottom" of the curve
 */
export const isCanonical = (S: BigNumber, curveN: BigNumber): boolean => {
  return S.comparedTo(curveN.dividedBy(2)) <= 0
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

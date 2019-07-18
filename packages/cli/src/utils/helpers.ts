import BN from 'bn.js'

export type Address = string

export function zip<A, B, C>(fn: (a: A, b: B) => C, as: A[], bs: B[]) {
  const len = Math.min(as.length, bs.length)
  const res: C[] = []

  for (let i = 0; i < len; i++) {
    res.push(fn(as[i], bs[i]))
  }
  return res
}

export function compareBN(a: BN, b: BN) {
  if (a.eq(b)) {
    return 0
  } else if (a.lt(b)) {
    return -1
  } else {
    return 1
  }
}

export function eqAddress(a: Address, b: Address) {
  return a.replace('0x', '').toLowerCase() === b.replace('0x', '').toLowerCase()
}

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

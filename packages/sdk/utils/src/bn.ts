import BN from 'bn.js'

export function compareBN(a: BN, b: BN) {
  if (a.eq(b)) {
    return 0
  } else if (a.lt(b)) {
    return -1
  } else {
    return 1
  }
}

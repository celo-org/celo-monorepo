import BigNumber from 'bignumber.js'

export const digits = new BigNumber('24')
export const fixed1 = new BigNumber('1000000000000000000000000')

export const toFixed = (n: number | BigNumber) => {
  return fixed1.times(n).integerValue(BigNumber.ROUND_FLOOR)
}

// Keeps the decimal portion
export const fromFixed = (f: BigNumber) => {
  return f.div(fixed1)
}

// Returns an integer
export const fixedToInt = (f: BigNumber) => {
  return f.idiv(fixed1)
}

export const multiply = (a: BigNumber, b: BigNumber) => {
  return a.times(b).idiv(fixed1)
}

export const divide = (a: BigNumber, b: BigNumber) => {
  return a.times(fixed1).idiv(b)
}

export const reciprocal = (f: BigNumber) => {
  return divide(fixed1, f)
}

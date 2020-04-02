import BigNumber from 'bignumber.js'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeBigNumber(): R
      toEqBigNumber(expected: BigNumber | string | number): R
    }
  }
}
jest.setTimeout(10000)

expect.extend({
  toBeBigNumber(received: any) {
    const pass = BigNumber.isBigNumber(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be BigNumber`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be bigNumber`,
        pass: false,
      }
    }
  },
  toEqBigNumber(received: BigNumber, _expected: BigNumber | string | number) {
    const expected = new BigNumber(_expected)
    const pass = expected.eq(received)
    if (pass) {
      return {
        message: () => `expected ${received.toString()} not to equal ${expected.toString()}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received.toString()} to equal ${expected.toString()}`,
        pass: false,
      }
    }
  },
})

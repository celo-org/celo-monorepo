import { assertEqualBN, assertRevert, assertGteBN } from '@celo/protocol/lib/test-utils'
import { FixidityTestInstance } from 'types'
import { toFixed, fixed1 } from '@celo/protocol/lib/fixidity'
import BigNumber from 'bignumber.js'

contract('FixidityLib', () => {
  const FixidityTest = artifacts.require('FixidityTest')
  let fixidityTest: FixidityTestInstance

  const maxFixedAdd = new BigNumber(
    '57896044618658097711785492504343953926634992332820282019728792003956564819967'
  )
  const maxUint256 = new BigNumber(
    '115792089237316195423570985008687907853269984665640564039457584007913129639935'
  )
  const maxFixedMul = new BigNumber('340282366920938463463374607431768211455999999999999')

  beforeEach(async () => {
    fixidityTest = await FixidityTest.new()
  })

  describe('add', () => {
    it('should add two integers', async () => {
      const a = toFixed(2)
      const b = toFixed(3)
      const expected = toFixed(5)
      const result = await fixidityTest.add(a, b)

      assertEqualBN(result, expected)
    })

    it('should add two fractions', async () => {
      const a = toFixed(2.42)
      const b = toFixed(3.63)
      const expected = toFixed(6.05)
      const result = await fixidityTest.add(a, b)

      assertEqualBN(result, expected)
    })

    it('should add two maxFixedAdd numbers', async () => {
      const result = await fixidityTest.add(maxFixedAdd, maxFixedAdd)
      const expected = maxUint256.minus(1)
      assertEqualBN(result, expected)
    })

    it('should fail to add numbers larger than maxFixedAdd', async () => {
      const bigNumber = maxFixedAdd.plus(1)
      await assertRevert(fixidityTest.add(bigNumber, bigNumber))
    })
  })

  describe('subtract', () => {
    it('should subtract two integers', async () => {
      const a = toFixed(10)
      const b = toFixed(6)
      const expected = toFixed(4)
      const result = await fixidityTest.subtract(a, b)

      assertEqualBN(result, expected)
    })

    it('should fail to subtract a larger number from a smaller one', async () => {
      const a = toFixed(6)
      const b = toFixed(10)

      await assertRevert(fixidityTest.subtract(a, b))
    })
  })

  describe('multiply', () => {
    it('should multiply two integers', async () => {
      const a = toFixed(7)
      const b = toFixed(6)
      const expected = toFixed(42)
      const result = await fixidityTest.multiply(a, b)

      assertEqualBN(result, expected)
    })

    it('should multiply two fractions', async () => {
      const a = toFixed(1.3)
      const b = toFixed(4.2)
      const expected = toFixed(5.46)
      const result = await fixidityTest.multiply(a, b)

      assertEqualBN(result, expected)
    })

    it('should multiply two maxFixedMul numbers', async () => {
      const result = await fixidityTest.multiply(maxFixedMul, maxFixedMul)
      const upperBound = maxFixedMul.times(maxFixedMul).idiv(fixed1)
      const lowerBound = maxFixedMul.times(maxFixedMul.idiv(fixed1))

      assertGteBN(upperBound, result)
      assertGteBN(result, lowerBound)
    })

    it('should fail to multiply numbers larger than maxFixedMul', async () => {
      const bigNumber = maxFixedMul.plus(1)
      await assertRevert(fixidityTest.multiply(bigNumber, bigNumber))
    })
  })

  describe('divide', () => {
    it('should divide two integers', async () => {
      const a = toFixed(84)
      const b = toFixed(2)
      const expected = toFixed(42)
      const result = await fixidityTest.divide(a, b)

      assertEqualBN(result, expected)
    })

    it('should divide two fractions', async () => {
      const a = toFixed(1.8)
      const b = toFixed(1.5)
      const upperBound = toFixed(1.2)
      const lowerBound = toFixed(1.19999)
      const result = await fixidityTest.divide(a, b)

      assertGteBN(upperBound, result)
      assertGteBN(result, lowerBound)
    })
  })
})

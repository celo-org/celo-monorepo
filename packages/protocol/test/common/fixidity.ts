import { assertEqualBN, assertGteBN, assertRevert } from '@celo/protocol/lib/test-utils'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { FixidityTestInstance } from 'types'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

contract('FixidityLib', () => {
  const FixidityTest = artifacts.require('FixidityTest')
  let fixidityTest: FixidityTestInstance

  const zero = new BigNumber(0)
  const maxFixedAdd = new BigNumber(
    '57896044618658097711785492504343953926634992332820282019728792003956564819967'
  )
  const maxUint256 = new BigNumber(
    '115792089237316195423570985008687907853269984665640564039457584007913129639935'
  )
  const maxNewFixed = new BigNumber('115792089237316195423570985008687907853269984665640564')
  const maxFixedMul = new BigNumber('340282366920938463463374607431768211455999999999999')
  const mulPrecision = new BigNumber('1000000000000')
  const maxFixedDividend = new BigNumber('115792089237316195423570985008687907853269984665640564')

  beforeEach(async () => {
    fixidityTest = await FixidityTest.new()
  })

  describe('newFixed', () => {
    it('should create 0', async () => {
      const result = await fixidityTest.newFixed(0)

      assertEqualBN(result, zero)
    })

    it('should create 1', async () => {
      const result = await fixidityTest.newFixed(1)

      assertEqualBN(result, fixed1)
    })

    it('should create maxNewFixed', async () => {
      const expected = toFixed(maxNewFixed)
      const result = await fixidityTest.newFixed(maxNewFixed)

      assertEqualBN(expected, result)
    })

    it('should fail to create maxNewFixed + 1', async () => {
      const bigNumber = maxNewFixed.plus(1)
      await assertRevert(fixidityTest.newFixed(bigNumber))
    })
  })

  describe('newFixedFraction', () => {
    it('should create 1 / 1', async () => {
      const result = await fixidityTest.newFixedFraction(1, 1)

      assertEqualBN(result, fixed1)
    })

    it('should create 0 / 1', async () => {
      const result = await fixidityTest.newFixedFraction(0, 1)

      assertEqualBN(result, zero)
    })

    it('should create 1/fixed1', async () => {
      const expected = new BigNumber(1)
      const result = await fixidityTest.newFixedFraction(1, fixed1)

      assertEqualBN(result, expected)
    })

    it('should fail to create a fraction with a 0 denominator', async () => {
      await assertRevert(fixidityTest.newFixedFraction(1, 0))
    })
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

    it('should fail to add anything to maxUint256', async () => {
      await assertRevert(fixidityTest.add(maxUint256, new BigNumber(1)))
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

    it('should subtract two fractions', async () => {
      const a = toFixed(23.4)
      const b = toFixed(23.2)
      const expected = toFixed(0.2)
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

    it('should multiply by 0', async () => {
      const result = await fixidityTest.multiply(maxFixedMul, zero)

      assertEqualBN(result, zero)
    })

    it('should multiply two maxFixedMul numbers', async () => {
      const result = await fixidityTest.multiply(maxFixedMul, maxFixedMul)
      const upperBound = maxFixedMul.times(maxFixedMul).idiv(fixed1)
      const lowerBound = maxFixedMul.times(maxFixedMul.idiv(fixed1))

      assertGteBN(upperBound, result)
      assertGteBN(result, lowerBound)
    })

    it('should retian mulPrecision precision', async () => {
      const a = fixed1.idiv(mulPrecision)
      const b = fixed1.times(mulPrecision)
      const result = await fixidityTest.multiply(a, b)

      assertEqualBN(result, fixed1)
    })

    it('should fail to multiply numbers larger than maxFixedMul', async () => {
      const bigNumber = maxFixedMul.plus(1)
      await assertRevert(fixidityTest.multiply(bigNumber, bigNumber))
    })
  })

  describe('reciprocal', () => {
    it('should return fixed1 for fixed1^-1', async () => {
      const result = await fixidityTest.reciprocal(fixed1)

      assertEqualBN(result, fixed1)
    })

    it('should return 1 for (fixed1 * fixed1)^-1', async () => {
      const result = await fixidityTest.reciprocal(fixed1.times(fixed1))

      assertEqualBN(result, new BigNumber(1))
    })

    it('should return 0 for (fixed1 * fixed1 + 1)^-1', async () => {
      const result = await fixidityTest.reciprocal(fixed1.times(fixed1).plus(1))

      assertEqualBN(result, zero)
    })

    it('should fail to invert 0', async () => {
      await assertRevert(fixidityTest.reciprocal(zero))
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

    it('should divide maxFixedDividend by 1', async () => {
      const expected = maxFixedDividend.times(fixed1)
      const result = await fixidityTest.divide(maxFixedDividend, 1)

      assertEqualBN(result, expected)
    })

    it('should fail to divide a number greater than maxFixedDividend by 1', async () => {
      await assertRevert(fixidityTest.divide(maxFixedDividend.plus(1), 1))
    })

    it('should fail to divide a number greater than maxFixedDividend', async () => {
      await assertRevert(fixidityTest.divide(maxFixedDividend.plus(1), fixed1))
    })

    it('should fail to divide by 0', async () => {
      await assertRevert(fixidityTest.divide(maxFixedDividend, zero))
    })
  })

  describe('comparisons', () => {
    it('should behave correctly when the first number is greater', async () => {
      const a = new BigNumber(2)
      const b = new BigNumber(1)

      const gtResult = await fixidityTest.gt(a, b)
      const gteResult = await fixidityTest.gte(a, b)
      const ltResult = await fixidityTest.lt(a, b)
      const lteResult = await fixidityTest.lte(a, b)

      assert.isTrue(gtResult)
      assert.isTrue(gteResult)
      assert.isFalse(ltResult)
      assert.isFalse(lteResult)
    })

    it('should behave correctly when the numbers are equal', async () => {
      const a = new BigNumber(2)
      const b = new BigNumber(2)

      const gtResult = await fixidityTest.gt(a, b)
      const gteResult = await fixidityTest.gte(a, b)
      const ltResult = await fixidityTest.lt(a, b)
      const lteResult = await fixidityTest.lte(a, b)

      assert.isFalse(gtResult)
      assert.isTrue(gteResult)
      assert.isFalse(ltResult)
      assert.isTrue(lteResult)
    })

    it('should behave correctly when the first number is smaller', async () => {
      const a = new BigNumber(1)
      const b = new BigNumber(2)

      const gtResult = await fixidityTest.gt(a, b)
      const gteResult = await fixidityTest.gte(a, b)
      const ltResult = await fixidityTest.lt(a, b)
      const lteResult = await fixidityTest.lte(a, b)

      assert.isFalse(gtResult)
      assert.isFalse(gteResult)
      assert.isTrue(ltResult)
      assert.isTrue(lteResult)
    })
  })
})

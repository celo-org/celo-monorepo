pragma solidity ^0.5.0;


/**
 * @title FixidityLib
 * @author Gadi Guy, Alberto Cuesta Canada
 * @notice This library provides fixed point arithmetic with protection against
 * overflow.
 * All operations are done with uint256 and the operands must have been created
 * with any of the newFrom* functions, which shift the comma digits() to the
 * right and check for limits, or with wrap() which expects a number already
 * in the internal representation of a fraction.
 * When using this library be sure to use maxNewFixed() as the upper limit for
 * creation of fixed point numbers. Use maxFixedMul(), maxFixedDividend() and
 * maxFixedAdd() if you want to be certain that those operations don't
 * overflow.
 */
library FixidityLib {

  struct Fraction {
    uint256 value;
  }

  /**
   * @notice Number of positions that the comma is shifted to the right.
   */
  function digits() internal pure returns (uint8) {
    return 24;
  }

  uint256 private constant FIXED1_UINT = 1000000000000000000000000;

  /**
   * @notice This is 1 in the fixed point units used in this library.
   * @dev Test fixed1() equals 10^digits()
   * Hardcoded to 24 digits.
   */
  function fixed1() internal pure returns (Fraction memory) {
    return Fraction(FIXED1_UINT);
  }

  /**
   * @notice Wrap a uint256 that represents a 24-decimal fraction in a Fraction
   * struct.
   * @param x Number that already represents a 24-decimal fraction.
   * @return A Fraction struct with contents x.
   */
  function wrap(uint256 x) internal pure returns (Fraction memory) {
    return Fraction(x);
  }

  /**
   * @notice Unwraps the uint256 inside of a Fraction struct.
   */
  function unwrap(Fraction memory x) internal pure returns (uint256) {
    return x.value;
  }

  /**
   * @notice The amount of decimals lost on each multiplication operand.
   * @dev Test mulPrecision() equals sqrt(fixed1)
   */
  function mulPrecision() internal pure returns (uint256) {
    return 1000000000000;
  }

  /**
   * @notice Maximum value that can be represented in a uint256
   * @dev Test maxUint256() equals 2^256 -1
   */
  function maxUint256() internal pure returns (uint256) {
    return 115792089237316195423570985008687907853269984665640564039457584007913129639935;
  }

  /**
   * @notice Maximum value that can be converted to fixed point. Optimize for
   * deployment.
   * @dev
   * Test maxNewFixed() equals maxUint256() / fixed1()
   */
  function maxNewFixed() internal pure returns (uint256) {
    return 115792089237316195423570985008687907853269984665640564;
  }

  /**
   * @notice Maximum value that can be safely used as an addition operator.
   * @dev Test maxFixedAdd() equals maxUint256()-1 / 2
   * Test add(maxFixedAdd(),maxFixedAdd()) equals maxFixedAdd() + maxFixedAdd()
   * Test add(maxFixedAdd()+1,maxFixedAdd()+1) throws
   */
  function maxFixedAdd() internal pure returns (uint256) {
    return 57896044618658097711785492504343953926634992332820282019728792003956564819967;
  }

  /**
   * @notice Maximum value that can be safely used as a multiplication operator.
   * @dev Calculated as sqrt(maxUint256()*fixed1()).
   * Test multiply(maxFixedMul(),maxFixedMul()) is around maxFixedMul() * maxFixedMul()
   * Test multiply(maxFixedMul(),maxFixedMul()+1) throws
   */
  function maxFixedMul() internal pure returns (uint256) {
    return 340282366920938463463374607431768211455999999999999;
  }

  /**
   * @notice Maximum value that can be safely used as a dividend.
   * @dev divide(maxFixedDividend,newFixedFraction(1,fixed1())) is around maxUint256().
   * Test maxFixedDividend() equals maxUint256()/fixed1()
   * Test divide(maxFixedDividend(),1) equals maxFixedDividend()*(fixed1)
   * Test divide(maxFixedDividend()+1,multiply(mulPrecision(),mulPrecision())) throws
   */
  function maxFixedDividend() internal pure returns (uint256) {
    return 115792089237316195423570985008687907853269984665640564;
  }

  /**
   * @notice Converts a uint256 to fixed point Fraction
   * @dev Test newFixed(0) returns 0
   * Test newFixed(1) returns fixed1()
   * Test newFixed(maxNewFixed()) returns maxNewFixed() * fixed1()
   * Test newFixed(maxNewFixed()+1) fails
   */
  function newFixed(uint256 x)
    internal
    pure
    returns (Fraction memory)
  {
    require(x <= maxNewFixed());
    return Fraction(x * FIXED1_UINT);
  }

  /**
   * @notice Converts a uint256 in the fixed point representation of this
   * library to a non decimal. All decimal digits will be truncated.
   */
  function fromFixed(Fraction memory x)
    internal
    pure
    returns (uint256)
  {
    return x.value / FIXED1_UINT;
  }

  /**
   * @notice Converts two uint256 representing a fraction to fixed point units,
   * equivalent to multiplying dividend and divisor by 10^digits().
   * @dev
   * Test newFixedFraction(maxFixedDividend()+1,1) fails
   * Test newFixedFraction(1,maxFixedDividend()+1) fails
   * Test newFixedFraction(1,0) fails
   * Test newFixedFraction(0,1) returns 0
   * Test newFixedFraction(1,1) returns fixed1()
   * Test newFixedFraction(maxFixedDividend(),1) returns maxFixedDividend()*fixed1()
   * Test newFixedFraction(1,fixed1()) returns 1
   */
  function newFixedFraction(
    uint256 numerator,
    uint256 denominator
  )
    internal
    pure
    returns (Fraction memory)
  {
    require(numerator <= maxNewFixed());
    require(denominator <= maxNewFixed());
    require(denominator != 0);
    Fraction memory convertedNumerator = newFixed(numerator);
    Fraction memory convertedDenominator = newFixed(denominator);
    return divide(convertedNumerator, convertedDenominator);
  }

  /**
   * @notice Returns the integer part of a fixed point number.
   * @dev
   * Test integer(0) returns 0
   * Test integer(fixed1()) returns fixed1()
   * Test integer(newFixed(maxNewFixed())) returns maxNewFixed()*fixed1()
   */
  function integer(Fraction memory x) internal pure returns (Fraction memory) {
    return Fraction((x.value / FIXED1_UINT) * FIXED1_UINT); // Can't overflow
  }

  /**
   * @notice Returns the fractional part of a fixed point number.
   * In the case of a negative number the fractional is also negative.
   * @dev
   * Test fractional(0) returns 0
   * Test fractional(fixed1()) returns 0
   * Test fractional(fixed1()-1) returns 10^24-1
   */
  function fractional(Fraction memory x) internal pure returns (Fraction memory) {
    return Fraction(x.value - (x.value / FIXED1_UINT) * FIXED1_UINT); // Can't overflow
  }

  /**
   * @notice x+y. If any operator is higher than maxFixedAdd() it
   * might overflow.
   * @dev
   * Test add(maxFixedAdd(),maxFixedAdd()) returns maxUint256()-1
   * Test add(maxFixedAdd()+1,maxFixedAdd()+1) fails
   * Test add(maxUint256(),maxUint256()) fails
   */
  function add(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    uint256 z = x.value + y.value;
    require(z >= x.value);
    return Fraction(z);
  }

  /**
   * @notice x-y.
   * @dev
   * Test subtract(6, 10) fails
   */
  function subtract(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    require(x.value >= y.value);
    return Fraction(x.value - y.value);
  }

  /**
   * @notice x*y. If any of the operators is higher than maxFixedMul() it
   * might overflow.
   * @dev
   * Test multiply(0,0) returns 0
   * Test multiply(maxFixedMul(),0) returns 0
   * Test multiply(0,maxFixedMul()) returns 0
   * Test multiply(fixed1()/mulPrecision(),fixed1()*mulPrecision())
   * Test multiply(maxFixedMul(),maxFixedMul()) is around maxUint256()
   * Test multiply(maxFixedMul()+1,maxFixedMul()+1) fails
   */
  function multiply(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    if (x.value == 0 || y.value == 0) return Fraction(0);
    if (y.value == FIXED1_UINT) return x;
    if (x.value == FIXED1_UINT) return y;

    // Separate into integer and fractional parts
    // x = x1 + x2, y = y1 + y2
    uint256 x1 = integer(x).value / FIXED1_UINT;
    uint256 x2 = fractional(x).value;
    uint256 y1 = integer(y).value / FIXED1_UINT;
    uint256 y2 = fractional(y).value;

    // (x1 + x2) * (y1 + y2) = (x1 * y1) + (x1 * y2) + (x2 * y1) + (x2 * y2)
    uint256 x1y1 = x1 * y1;
    if (x1 != 0) require(x1y1 / x1 == y1); // Overflow x1y1

    // x1y1 needs to be multiplied back by fixed1
    // solium-disable-next-line mixedcase
    uint256 fixed_x1y1 = x1y1 * FIXED1_UINT;
    if (x1y1 != 0) require(fixed_x1y1 / x1y1 == FIXED1_UINT); // Overflow x1y1 * fixed1
    x1y1 = fixed_x1y1;

    uint256 x2y1 = x2 * y1;
    if (x2 != 0) require(x2y1 / x2 == y1); // Overflow x2y1

    uint256 x1y2 = x1 * y2;
    if (x1 != 0) require(x1y2 / x1 == y2); // Overflow x1y2

    x2 = x2 / mulPrecision();
    y2 = y2 / mulPrecision();
    uint256 x2y2 = x2 * y2;
    if (x2 != 0) require(x2y2 / x2 == y2); // Overflow x2y2

    // result = fixed1() * x1 * y1 + x1 * y2 + x2 * y1 + x2 * y2 / fixed1();
    Fraction memory result = Fraction(x1y1);
    result = add(result, Fraction(x2y1)); // Add checks for overflow
    result = add(result, Fraction(x1y2)); // Add checks for overflow
    result = add(result, Fraction(x2y2)); // Add checks for overflow
    return result;
  }

  /**
   * @notice 1/x
   * @dev
   * Test reciprocal(0) fails
   * Test reciprocal(fixed1()) returns fixed1()
   * Test reciprocal(fixed1()*fixed1()) returns 1 // Testing how the fractional is truncated
   * Test reciprocal(1+fixed1()*fixed1()) returns 0 // Testing how the fractional is truncated
   */
  function reciprocal(Fraction memory x) internal pure returns (Fraction memory) {
    require(x.value != 0);
    return Fraction((FIXED1_UINT*FIXED1_UINT) / x.value); // Can't overflow
  }

  /**
   * @notice x/y. If the dividend is higher than maxFixedDividend() it
   * might overflow. You can use multiply(x,reciprocal(y)) instead.
   * @dev
   * Test divide(fixed1(),0) fails
   * Test divide(maxFixedDividend(),1) = maxFixedDividend()*(10^digits())
   * Test divide(maxFixedDividend()+1,1) throws
   */
  function divide(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    require(y.value != 0);
    uint256 X = x.value * FIXED1_UINT;
    require(X / FIXED1_UINT == x.value);
    return Fraction(X / y.value);
  }

  /**
   * @notice x > y
   */
  function gt(Fraction memory x, Fraction memory y) internal pure returns (bool) {
    return x.value > y.value;
  }

  /**
   * @notice x >= y
   */
  function gte(Fraction memory x, Fraction memory y) internal pure returns (bool) {
    return x.value >= y.value;
  }

  /**
   * @notice x < y
   */
  function lt(Fraction memory x, Fraction memory y) internal pure returns (bool) {
    return x.value < y.value;
  }

  /**
   * @notice x <= y
   */
  function lte(Fraction memory x, Fraction memory y) internal pure returns (bool) {
    return x.value <= y.value;
  }

  /**
   * @notice x == y
   */
  function equals(Fraction memory x, Fraction memory y) internal pure returns (bool) {
    return x.value == y.value;
  }

  /**
   * @notice x <= 1
   */
  function isProperFraction(Fraction memory x) internal pure returns (bool) {
    return lte(x, fixed1());
  }
}

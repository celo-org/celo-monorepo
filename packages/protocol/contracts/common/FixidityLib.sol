pragma solidity ^0.5.0;


/**
 * @title FixidityLib
 * @author Gadi Guy, Alberto Cuesta Canada
 * @notice This library provides fixed point arithmetic with protection against
 * overflow.
 * All operations are done with int256 and the operands must have been created
 * with any of the newFrom* functions, which shift the comma digits() to the
 * right and check for limits.
 * When using this library be sure of using maxNewFixed() as the upper limit for
 * creation of fixed point numbers. Use maxFixedMul(), maxFixedDiv() and
 * maxFixedAdd() if you want to be certain that those operations don't
 * overflow.
 */
library FixidityLib2 {

  struct Fraction {
    int256 value;
  }

  /**
   * @notice Number of positions that the comma is shifted to the right.
   */
  function digits() internal pure returns(uint8) {
    return 24;
  }

  int256 private constant FIXED1_INT = 1000000000000000000000000;

  /**
   * @notice This is 1 in the fixed point units used in this library.
   * @dev Test fixed1() equals 10^digits()
   * Hardcoded to 24 digits.
   */
  function fixed1() internal pure returns(Fraction memory) {
    return Fraction(FIXED1_INT);
  }

  function wrapUint256(uint256 x) internal view returns (Fraction memory) {
    require(x <= uint256(maxInt256()));
    return Fraction(int256(x));
  }

  /**
   * @notice The amount of decimals lost on each multiplication operand.
   * @dev Test mulPrecision() equals sqrt(fixed1)
   * Hardcoded to 24 digits.
   */
  function mulPrecision() internal pure returns(int256) {
    return 1000000000000;
  }

  /**
   * @notice Maximum value that can be represented in an int256
   * @dev Test maxInt256() equals 2^255 -1
   */
  function maxInt256() internal pure returns(int256) {
    return 57896044618658097711785492504343953926634992332820282019728792003956564819967;
  }

  /**
   * @notice Minimum value that can be represented in an int256
   * @dev Test minInt256 equals (2^255) * (-1)
   */
  function minInt256() internal pure returns(int256) {
    return -57896044618658097711785492504343953926634992332820282019728792003956564819968;
  }

  /**
   * @notice Maximum value that can be converted to fixed point. Optimize for
   * @dev deployment.
   * Test maxNewFixed() equals maxInt256() / fixed1()
   * Hardcoded to 24 digits.
   */
  function maxNewFixed() internal pure returns(int256) {
    return 57896044618658097711785492504343953926634992332820282;
  }

  /**
   * @notice Maximum value that can be converted to fixed point. Optimize for
   * deployment.
   * @dev Test minNewFixed() equals -(maxInt256()) / fixed1()
   * Hardcoded to 24 digits.
   */
  function minNewFixed() internal pure returns(int256) {
    return -57896044618658097711785492504343953926634992332820282;
  }

  /**
   * @notice Maximum value that can be safely used as an addition operator.
   * @dev Test maxFixedAdd() equals maxInt256()-1 / 2
   * Test add(maxFixedAdd(),maxFixedAdd()) equals maxFixedAdd() + maxFixedAdd()
   * Test add(maxFixedAdd()+1,maxFixedAdd()) throws
   * Test add(-maxFixedAdd(),-maxFixedAdd()) equals -maxFixedAdd() - maxFixedAdd()
   * Test add(-maxFixedAdd(),-maxFixedAdd()-1) throws
   */
  function maxFixedAdd() internal pure returns(int256) {
    return 28948022309329048855892746252171976963317496166410141009864396001978282409983;
  }

  /**
   * @notice Maximum negative value that can be safely in a subtraction.
   * @dev Test maxFixedSub() equals minInt256() / 2
   */
  function maxFixedSub() internal pure returns(int256) {
    return -28948022309329048855892746252171976963317496166410141009864396001978282409984;
  }

  /**
   * @notice Maximum value that can be safely used as a multiplication operator.
   * @dev Calculated as sqrt(maxInt256()*fixed1()).
   * Be careful with your sqrt() implementation. I couldn't find a calculator
   * that would give the exact square root of maxInt256*fixed1 so this number
   * is below the real number by no more than 3*10**28. It is safe to use as
   * a limit for your multiplications, although powers of two of numbers over
   * this value might still work.
   * Test multiply(maxFixedMul(),maxFixedMul()) equals maxFixedMul() * maxFixedMul()
   * Test multiply(maxFixedMul(),maxFixedMul()+1) throws
   * Test multiply(-maxFixedMul(),maxFixedMul()) equals -maxFixedMul() * maxFixedMul()
   * Test multiply(-maxFixedMul(),maxFixedMul()+1) throws
   * Hardcoded to 24 digits.
   */
  function maxFixedMul() internal pure returns(int256) {
    return 240615969168004511545033772477625056927114980741063;
  }

  /**
   * @notice Maximum value that can be safely used as a dividend.
   * @dev divide(maxFixedDiv,newFixedFraction(1,fixed1())) = maxInt256().
   * Test maxFixedDiv() equals maxInt256()/fixed1()
   * Test divide(maxFixedDiv(),multiply(mulPrecision(),mulPrecision())) = maxFixedDiv()*(10^digits())
   * Test divide(maxFixedDiv()+1,multiply(mulPrecision(),mulPrecision())) throws
   * Hardcoded to 24 digits.
   */
  function maxFixedDiv() internal pure returns(int256) {
    return 57896044618658097711785492504343953926634992332820282;
  }

  /**
   * @notice Maximum value that can be safely used as a divisor.
   * @dev Test maxFixedDivisor() equals fixed1()*fixed1() - Or 10**(digits()*2)
   * Test divide(10**(digits()*2 + 1),10**(digits()*2)) = returns 10*fixed1()
   * Test divide(10**(digits()*2 + 1),10**(digits()*2 + 1)) = throws
   * Hardcoded to 24 digits.
   */
  function maxFixedDivisor() internal pure returns(int256) {
    return 1000000000000000000000000000000000000000000000000;
  }

  /**
   * @notice Converts an int256 to fixed point units, equivalent to multiplying
   * by 10^digits().
   * @dev Test newFixed(0) returns 0
   * Test newFixed(1) returns fixed1()
   * Test newFixed(maxNewFixed()) returns maxNewFixed() * fixed1()
   * Test newFixed(maxNewFixed()+1) fails
   */
  function newFixed(int256 x)
    internal
    pure
      returns (Fraction memory)
  {
    require(x <= maxNewFixed());
    require(x >= minNewFixed());
    return Fraction(x * FIXED1_INT);
  }

  /**
   * @notice Converts an int256 in the fixed point representation of this
   * library to a non decimal. All decimal digits will be truncated.
   */
  function fromFixed(Fraction memory x)
    internal
    pure
    returns (int256)
  {
    return x.value / FIXED1_INT;
  }

  /**
   * @notice Converts two int256 representing a fraction to fixed point units,
   * equivalent to multiplying dividend and divisor by 10^digits().
   * @dev
   * Test newFixedFraction(maxFixedDiv()+1,1) fails
   * Test newFixedFraction(1,maxFixedDiv()+1) fails
   * Test newFixedFraction(1,0) fails
   * Test newFixedFraction(0,1) returns 0
   * Test newFixedFraction(1,1) returns fixed1()
   * Test newFixedFraction(maxFixedDiv(),1) returns maxFixedDiv()*fixed1()
   * Test newFixedFraction(1,fixed1()) returns 1
   * Test newFixedFraction(1,fixed1()-1) returns 0
   */
  function newFixedFraction(
    int256 numerator,
    int256 denominator
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
   * Test integer(-fixed1()) returns -fixed1()
   * Test integer(newFixed(-maxNewFixed())) returns -maxNewFixed()*fixed1()
   */
  function integer(Fraction memory x) internal pure returns (Fraction memory) {
    return Fraction((x.value / FIXED1_INT) * FIXED1_INT); // Can't overflow
  }

  /**
   * @notice Returns the fractional part of a fixed point number.
   * In the case of a negative number the fractional is also negative.
   * @dev
   * Test fractional(0) returns 0
   * Test fractional(fixed1()) returns 0
   * Test fractional(fixed1()-1) returns 10^24-1
   * Test fractional(-fixed1()) returns 0
   * Test fractional(-fixed1()+1) returns -10^24-1
   */
  function fractional(Fraction memory x) internal pure returns (Fraction memory) {
    return Fraction(x.value - (x.value / FIXED1_INT) * FIXED1_INT); // Can't overflow
  }

  /**
   * @notice x+y. If any operator is higher than maxFixedAdd() it
   * might overflow.
   * In solidity maxInt256 + 1 = minInt256 and viceversa.
   * @dev
   * Test add(maxFixedAdd(),maxFixedAdd()) returns maxInt256()-1
   * Test add(maxFixedAdd()+1,maxFixedAdd()+1) fails
   * Test add(-maxFixedSub(),-maxFixedSub()) returns minInt256()
   * Test add(-maxFixedSub()-1,-maxFixedSub()-1) fails
   * Test add(maxInt256(),maxInt256()) fails
   * Test add(minInt256(),minInt256()) fails
   */
  function add(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    int256 z = x.value + y.value;
    if (x.value > 0 && y.value > 0) require(z > x.value && z > y.value);
    if (x.value < 0 && y.value < 0) require(z < x.value && z < y.value);
    return Fraction(z);
  }

  /**
   * @notice x-y. You can use add(x,-y) instead.
   * @dev Tests covered by add(x,y)
   */
  function subtract(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    return add(x,Fraction(-y.value));
  }

  /**
   * @notice x*y. If any of the operators is higher than maxFixedMul() it
   * might overflow.
   * @dev
   * Test multiply(0,0) returns 0
   * Test multiply(maxFixedMul(),0) returns 0
   * Test multiply(0,maxFixedMul()) returns 0
   * Test multiply(maxFixedMul(),fixed1()) returns maxFixedMul()
   * Test multiply(fixed1(),maxFixedMul()) returns maxFixedMul()
   * Test all combinations of (2,-2), (2, 2.5), (2, -2.5) and (0.5, -0.5)
   * Test multiply(fixed1()/mulPrecision(),fixed1()*mulPrecision())
   * Test multiply(maxFixedMul()-1,maxFixedMul()) equals multiply(maxFixedMul(),maxFixedMul()-1)
   * Test multiply(maxFixedMul(),maxFixedMul()) returns maxInt256() // Probably not to the last digits
   * Test multiply(maxFixedMul()+1,maxFixedMul()) fails
   * Test multiply(maxFixedMul(),maxFixedMul()+1) fails
   */
  function multiply(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    if (x.value == 0 || y.value == 0) return Fraction(0);
    if (y.value == FIXED1_INT) return x;
    if (x.value == FIXED1_INT) return y;

    // Separate into integer and fractional parts
    // x = x1 + x2, y = y1 + y2
    int256 x1 = integer(x).value / FIXED1_INT;
    int256 x2 = fractional(x).value;
    int256 y1 = integer(y).value / FIXED1_INT;
    int256 y2 = fractional(y).value;

    // (x1 + x2) * (y1 + y2) = (x1 * y1) + (x1 * y2) + (x2 * y1) + (x2 * y2)
    int256 x1y1 = x1 * y1;
    if (x1 != 0) require(x1y1 / x1 == y1); // Overflow x1y1

    // x1y1 needs to be multiplied back by fixed1
    // solium-disable-next-line mixedcase
    int256 fixed_x1y1 = x1y1 * FIXED1_INT;
    if (x1y1 != 0) require(fixed_x1y1 / x1y1 == FIXED1_INT); // Overflow x1y1 * fixed1
    x1y1 = fixed_x1y1;

    int256 x2y1 = x2 * y1;
    if (x2 != 0) require(x2y1 / x2 == y1); // Overflow x2y1

    int256 x1y2 = x1 * y2;
    if (x1 != 0) require(x1y2 / x1 == y2); // Overflow x1y2

    x2 = x2 / mulPrecision();
    y2 = y2 / mulPrecision();
    int256 x2y2 = x2 * y2;
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
   * Test reciprocal(2*fixed1()*fixed1()) returns 0 // Testing how the fractional is truncated
   */
  function reciprocal(Fraction memory x) internal pure returns (Fraction memory) {
    require(x.value != 0);
    return Fraction((FIXED1_INT*FIXED1_INT) / x.value); // Can't overflow
  }

  /**
   * @notice x/y. If the dividend is higher than maxFixedDiv() it
   * might overflow. You can use multiply(x,reciprocal(y)) instead.
   * There is a loss of precision on division for the lower mulPrecision() decimals.
   * @dev
   * Test divide(fixed1(),0) fails
   * Test divide(maxFixedDiv(),1) = maxFixedDiv()*(10^digits())
   * Test divide(maxFixedDiv()+1,1) throws
   * Test divide(maxFixedDiv(),maxFixedDiv()) returns fixed1()
   */
  function divide(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    if (y.value == FIXED1_INT) return x;
    require(y.value != 0);
    require(y.value <= maxFixedDivisor());
    return multiply(x, reciprocal(y));
  }
}

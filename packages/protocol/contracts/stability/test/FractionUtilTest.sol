pragma solidity ^0.5.8;

import "../FractionUtil.sol";


// TODO(asa) Actually test this
contract FractionUtilTest {

  using FractionUtil for FractionUtil.Fraction;

  function reduce(uint256 numerator, uint256 denominator) external pure returns (uint256, uint256) {
    FractionUtil.Fraction memory fraction = FractionUtil.Fraction(numerator, denominator);
    fraction = fraction.reduce();
    return (fraction.numerator, fraction.denominator);
  }

  function equals(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (bool)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    return fractionA.equals(fractionB);
  }

  function add(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (uint256, uint256)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    FractionUtil.Fraction memory fraction = fractionA.add(fractionB);
    return (fraction.numerator, fraction.denominator);
  }

  function sub(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (uint256, uint256)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    FractionUtil.Fraction memory fraction = fractionA.sub(fractionB);
    return (fraction.numerator, fraction.denominator);
  }

  function mul(uint256 numerator, uint256 denominator, uint256 y) external pure returns (uint256) {
    FractionUtil.Fraction memory fraction = FractionUtil.Fraction(numerator, denominator);
    return fraction.mul(y);
  }

  function isGreaterThan(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (bool)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    return fractionA.isGreaterThan(fractionB);
  }

  function isGreaterThanOrEqualTo(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (bool)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    return fractionA.isGreaterThanOrEqualTo(fractionB);
  }

  function isLessThan(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (bool)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    return fractionA.isLessThan(fractionB);
  }

  function isLessThanOrEqualTo(
    uint256 numeratorA,
    uint256 denominatorA,
    uint256 numeratorB,
    uint256 denominatorB
  )
    external
    pure
    returns (bool)
  {
    FractionUtil.Fraction memory fractionA = FractionUtil.Fraction(numeratorA, denominatorA);
    FractionUtil.Fraction memory fractionB = FractionUtil.Fraction(numeratorB, denominatorB);
    return fractionA.isLessThanOrEqualTo(fractionB);
  }
}

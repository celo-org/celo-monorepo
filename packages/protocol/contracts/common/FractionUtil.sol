pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


// TODO(asa): Move to uint128 if gas savings are significant enough.
library FractionUtil {

  using SafeMath for uint256;
  using FractionUtil for Fraction;

  struct Fraction {
    uint256 numerator;
    uint256 denominator;
  }

  function reduce(Fraction memory x) internal pure returns (Fraction memory) {
    uint256 gcd = x.denominator;
    uint256 y = x.numerator;
    while (y != 0) {
      uint256 y_ = gcd % y;
      gcd = y;
      y = y_;
    }
    Fraction memory fraction = Fraction(x.numerator.div(gcd), x.denominator.div(gcd));
    return fraction;
  }

  /**
   * @dev Returns whether or not at least one of numerator and denominator are non-zero.
   * @return Whether or not at least one of numerator and denominator are non-zero.
   */
  function exists(Fraction memory x) internal pure returns (bool) {
    return x.numerator > 0 || x.denominator > 0;
  }

  /**
   * @dev Returns whether fraction "x" is equal to fraction "y".
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x == y
   */
  function equals(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (bool)
  {
    return x.numerator.mul(y.denominator) == y.numerator.mul(x.denominator);
  }

  /**
   * @dev Returns a new fraction that is the sum of two rates.
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x + y
   */
  function add(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (Fraction memory)
  {
    return Fraction(
      x.numerator.mul(y.denominator).add(y.numerator.mul(x.denominator)),
      x.denominator.mul(y.denominator)
    ).reduce();
  }

  /**
   * @dev Returns a new fraction that is the two rates subtracted from each other.
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x - y
   */
  function sub(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (Fraction memory)
  {
    require(isGreaterThanOrEqualTo(x, y));
    return Fraction(
      x.numerator.mul(y.denominator).sub(y.numerator.mul(x.denominator)),
      x.denominator.mul(y.denominator)
    ).reduce();
  }

  /**
   * @dev Returns a fraction that is the fraction times a fraction.
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x * y
   */
  function mul(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    return Fraction(x.numerator.mul(y.numerator), x.denominator.mul(y.denominator)).reduce();
  }

  /**
   * @dev Returns an integer that is the fraction time an integer.
   * @param x A Fraction struct.
   * @param y An integer.
   * @return x * y
   */
  function mul(Fraction memory x, uint256 y) internal pure returns (uint256) {
    return x.numerator.mul(y).div(x.denominator);
  }

  /**
   * @dev Returns the inverse of the fraction.
   * @param x A Fraction struct.
   * @return 1 / x
   */
  function inverse(
    Fraction memory x
  )
    internal
    pure
    returns (Fraction memory)
  {
    require(x.numerator != 0);
    return Fraction(
      x.denominator,
      x.numerator
    );
  }

  /**
   * @dev Returns a fraction that is the fraction divided by a fraction.
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x / y
   */
  function div(Fraction memory x, Fraction memory y) internal pure returns (Fraction memory) {
    require(y.numerator != 0);
    return Fraction(x.numerator.mul(y.denominator), x.denominator.mul(y.numerator));
  }

  /**
   * @dev Returns whether fraction "x" is greater than fraction "y".
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x > y
   */
  function isGreaterThan(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (bool)
  {
    return x.numerator.mul(y.denominator) > y.numerator.mul(x.denominator);
  }

  /**
   * @dev Returns whether fraction "x" is greater than or equal to fraction "y".
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x >= y
   */
  function isGreaterThanOrEqualTo(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (bool)
  {
    return x.numerator.mul(y.denominator) >= y.numerator.mul(x.denominator);
  }

  /**
   * @dev Returns whether fraction "x" is less than fraction "y".
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x < y
   */
  function isLessThan(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (bool)
  {
    return x.numerator.mul(y.denominator) < y.numerator.mul(x.denominator);
  }

  /**
   * @dev Returns whether fraction "x" is less than or equal to fraction "y".
   * @param x A Fraction struct.
   * @param y A Fraction struct.
   * @return x <= y
   */
  function isLessThanOrEqualTo(
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (bool)
  {
    return x.numerator.mul(y.denominator) <= y.numerator.mul(x.denominator);
  }

  /**
   * @dev Returns whether fraction "z" is between fractions "x" and "y".
   * @param z A Fraction struct.
   * @param x A Fraction struct representing a rate lower than "y".
   * @param y A Fraction struct representing a rate higher than "x".
   * @return x <= z <= y
   */
  function isBetween(
    Fraction memory z,
    Fraction memory x,
    Fraction memory y
  )
    internal
    pure
    returns (bool)
  {
    return isLessThanOrEqualTo(x, z) && isLessThanOrEqualTo(z, y);
  }
}

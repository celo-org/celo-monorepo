pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { console2 as console } from "celo-foundry/Test.sol";

import { IMentoExchange } from "../interfaces/IMentoExchange.sol";
import { FixidityLib } from "../../common/FixidityLib.sol";

contract CPExchange is IMentoExchange {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;
  string public constant name = "CPExchangeV1";

  /* ==================== External Pure Functions ==================== */

  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param amountIn Amount of tokens being paid in.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @param spread The spread of the pool.
   * @return amountOut Amount of tokens that will be paid out.
   * @return nextInBucketSize Size of the in bucket after the swap.
   * @return nextOutBucketSize Size of the out bucket after the swap.
   */
  function getAmountOut(
    uint256 amountIn,
    uint256 inBucketSize,
    uint256 outBucketSize,
    uint256 spread
  ) external pure returns (uint256 amountOut, uint256 nextInBucketSize, uint256 nextOutBucketSize) {
    amountOut = _getAmountOut(amountIn, inBucketSize, outBucketSize, spread);
    (nextInBucketSize, nextOutBucketSize) = _getUpdatedBuckets(
      amountIn,
      amountOut,
      inBucketSize,
      outBucketSize
    );
  }

  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param amountOut Amount of tokens desired to be paid out.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @param spread The spread of the pool.
   * @return amountIn Amount of tokens that have to be paid in.
   * @return nextInBucketSize Size of the in bucket after the swap.
   * @return nextOutBucketSize Size of the out bucket after the swap.
   */
  function getAmountIn(
    uint256 amountOut,
    uint256 inBucketSize,
    uint256 outBucketSize,
    uint256 spread
  ) external pure returns (uint256 amountIn, uint256 nextInBucketSize, uint256 nextOutBucketSize) {
    amountIn = _getAmountIn(amountOut, inBucketSize, outBucketSize, spread);
    (nextInBucketSize, nextOutBucketSize) = _getUpdatedBuckets(
      amountIn,
      amountOut,
      inBucketSize,
      outBucketSize
    );
  }

  /**
   * @notice Returns the size of a pair's buckets after an exchange.
   * @param amountIn Amount of in being paid in
   * @param amountOut Amount of out being paid out.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @return newinBucketSize Size of the in bucket after the swap.
   * @return newoutBucketSize Size of the out bucket after the swap.
   */
  function getUpdatedBuckets(
    uint256 amountIn,
    uint256 amountOut,
    uint256 inBucketSize,
    uint256 outBucketSize
  ) external pure returns (uint256 newTokenInBucketSize, uint256 newTokenOutBucketSize) {
    return _getUpdatedBuckets(amountIn, amountOut, inBucketSize, outBucketSize);
  }

  /* ==================== Private Functions ==================== */

  /**
   * @notice Returns the size of a pair's buckets after an exchange.
   * @param amountIn Amount of in being paid in
   * @param amountOut Amount of out being paid out.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @return nextInBucketSize Size of the in bucket after the swap.
   * @return nextOutBucketSize Size of the out bucket after the swap.
   */
  function _getUpdatedBuckets(
    uint256 amountIn,
    uint256 amountOut,
    uint256 inBucketSize,
    uint256 outBucketSize
  ) internal pure returns (uint256, uint256) {
    return (inBucketSize + amountIn, outBucketSize - amountOut);
  }

  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param amountIn Amount of tokens being paid in.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @param spread The spread of the pool.
   * @return amountOut Amount of tokens that will be paid out.
   */
  function _getAmountOut(
    uint256 amountIn,
    uint256 inBucketSize,
    uint256 outBucketSize,
    uint256 spread
  ) internal pure returns (uint256 amountOut) {
    if (amountIn == 0) return 0;

    FixidityLib.Fraction memory reducedAmountIn = FixidityLib
      .fixed1()
      .subtract(FixidityLib.wrap(spread))
      .multiply(FixidityLib.newFixed(amountIn));
    FixidityLib.Fraction memory numerator = reducedAmountIn.multiply(
      FixidityLib.newFixed(outBucketSize)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(inBucketSize).add(
      reducedAmountIn
    );

    // Can't use FixidityLib.divide because denominator can easily be greater
    // than maxFixedDivisor.
    // Fortunately, we expect an integer result, so integer division gives us as
    // much precision as we could hope for.
    return numerator.unwrap().div(denominator.unwrap());
  }

  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param amountOut Amount of tokens desired to be paid out.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @param spread The spread of the pool.
   * @return amountIn Amount of tokens that have to be paid in.
   */
  function _getAmountIn(
    uint256 amountOut,
    uint256 inBucketSize,
    uint256 outBucketSize,
    uint256 spread
  ) internal pure returns (uint256 amountIn) {
    if (amountOut == 0) return 0;

    FixidityLib.Fraction memory numerator = FixidityLib.newFixed(amountOut.mul(inBucketSize));
    FixidityLib.Fraction memory denominator = FixidityLib
      .newFixed(outBucketSize.sub(amountOut))
      .multiply(FixidityLib.fixed1().subtract(FixidityLib.wrap(spread)));

    // See comment in _getAmountOut
    return numerator.unwrap().div(denominator.unwrap());
  }
}

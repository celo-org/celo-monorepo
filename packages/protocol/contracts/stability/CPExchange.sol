pragma solidity ^0.5.13;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { IMentoExchange } from "./interfaces/IMentoExchange.sol";
//import "./interfaces/ISortedOracles.sol";
import { FixidityLib } from "../common/FixidityLib.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";
import { ReentrancyGuard } from "../common/libraries/ReentrancyGuard.sol";

contract CPExchange is IMentoExchange, UsingRegistry, ReentrancyGuard {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  // TODO(pedro-clabs): add spread to getAmount{In,Out}.
  function getAmountOut(
    address tokenIn, // TODO(pedro-clabs): do we need the token addresses?
    address tokenOut, // TODO(pedro-clabs): do we need the token addresses?
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 amountIn
  ) external view returns (uint256) {
    if (amountIn == 0) return 0;

    FixidityLib.Fraction memory amountInFixed = FixidityLib.newFixed(amountIn);
    FixidityLib.Fraction memory numerator = amountInFixed.multiply(
      FixidityLib.newFixed(tokenOutBucketSize)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(tokenInBucketSize).add(
      amountInFixed
    );

    // Can't use FixidityLib.divide because denominator can easily be greater
    // than maxFixedDivisor.
    // Fortunately, we expect an integer result, so integer division gives us as
    // much precision as we could hope for.
    return numerator.unwrap().div(denominator.unwrap());
  }

  function getUpdatedBuckets(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut,
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize
  ) external view returns (uint256, uint256) {
    return (tokenInBucketSize + amountIn, tokenOutBucketSize - amountOut);
  }
}

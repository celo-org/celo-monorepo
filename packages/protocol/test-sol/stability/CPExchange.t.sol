// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "celo-foundry/Test.sol";
import { console } from "forge-std/console.sol";

import "../utils/WithRegistry.sol";
import "../utils/TokenHelpers.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";
import "contracts/common/GoldToken.sol";
import "contracts/stability/CPExchange.sol";
import "contracts/stability/StableToken.sol";

contract CPExchangeTest is Test, WithRegistry, TokenHelpers {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  CPExchange exchange;
  StableToken stableToken;
  GoldToken celoToken;

  function setUp() public {
    exchange = new CPExchange();
  }

  function getAmountOut(uint256 tokenInBucketSize, uint256 tokenOutBucketSize, uint256 amountIn)
    public
    view
    returns (uint256)
  {
    return
      exchange.getAmountOut(
        address(celoToken),
        address(stableToken),
        tokenInBucketSize,
        tokenOutBucketSize,
        amountIn
      );
  }

  function getUpdatedBuckets(
    uint256 amountIn,
    uint256 amountOut,
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize
  ) public view returns (uint256, uint256) {
    return
      exchange.getUpdatedBuckets(
        address(celoToken),
        address(stableToken),
        amountIn,
        amountOut,
        tokenInBucketSize,
        tokenOutBucketSize
      );
  }

  function diff(uint256 a, uint256 b) public view returns (uint256) {
    return a > b ? a - b : b - a;
  }

  function checkTradeQuadruplet(
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 amountIn,
    uint256 expectedAmountOut
  ) public {
    uint256 amountOut = getAmountOut(tokenInBucketSize, tokenOutBucketSize, amountIn);
    assertEq(amountOut, expectedAmountOut);
  }

  function gwei(uint256 x) public view returns (uint256) {
    return x * 1e18;
  }
}

contract CPExchange_getAmountOut is CPExchangeTest {
  function test_getAmountOut_InvariantHolds(
    uint256 tokenInBucketSizeZ,
    uint256 tokenOutBucketSizeZ,
    uint256 amountIn
  ) public {
    // Map fuzzer values to better conditioned values.
    // Constrain bucket sizes to represent amounts of at most 1e12 tokens.
    uint256 tokenInBucketSize = tokenInBucketSizeZ % gwei(1e12);
    uint256 tokenOutBucketSize = tokenOutBucketSizeZ % gwei(1e12);
    /*
    uint256 amountIn = gwei(amountInZ / gwei(1));
   */
    // Buckets must be positive integers.
    vm.assume(tokenInBucketSize > 0);
    vm.assume(tokenOutBucketSize > 0);
    // Constraints to avoid overflows.
    vm.assume(tokenInBucketSize < FixidityLib.maxNewFixed());
    vm.assume(tokenOutBucketSize < FixidityLib.maxNewFixed());
    vm.assume(amountIn * tokenOutBucketSize < FixidityLib.maxNewFixed());
    vm.assume(tokenInBucketSize + amountIn < FixidityLib.maxNewFixed());
    // Constrain amountIn to the size of the buckets, in order to avoid
    // precision issues when amountIn >> bucketSizes.
    vm.assume(amountIn < tokenInBucketSize);
    vm.assume(amountIn < tokenOutBucketSize);
    // Constrain bucket sizes to represent rates in the range [0.1, 10.0],
    // in order to avoid precision issues when bucketA >> bucketB.
    vm.assume(tokenInBucketSize < 10 * tokenOutBucketSize);
    vm.assume(tokenOutBucketSize < 10 * tokenInBucketSize);
    // Constrain amountIn to represent amounts of at least 1e-5 tokens, in
    // order to avoid precision issues when amountIn << bucketSizes.
    vm.assume(amountIn >= 1e13);
    // Constrain bucket sizes to represent amounts of at most 1e12 tokens, for
    // the same reason as above.
    //vm.assume(tokenInBucketSize < 1e30);
    //vm.assume(tokenOutBucketSize < 1e30);

    uint256 amountOut = getAmountOut(tokenInBucketSize, tokenOutBucketSize, amountIn);

    uint256 kPre = tokenInBucketSize * tokenOutBucketSize;
    uint256 kPost = (tokenInBucketSize + amountIn) * (tokenOutBucketSize - amountOut);

    console.log("K (pre)");
    console.log(kPre);
    console.log("K (post)");
    console.log(kPost);
    console.log("K diff");
    console.log(diff(kPre, kPost));

    // Cannot test exactly for the constant product invariant, as it only holds within an epsilon (abs(k0 - k1) <= eps).
    // TODO(pedro-clabs): should eps be a function of the inputs?
    uint256 eps = 1e30;
    assertLe(diff(kPre, kPost), eps);
  }
}


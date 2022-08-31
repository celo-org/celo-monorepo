// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";
import { CPExchange } from "contracts/stability/exchanges/CPExchange.sol";
import { IMentoExchange } from "contracts/stability/interfaces/IMentoExchange.sol";

contract CPExchangeTest is Test {
  IMentoExchange exchange;

  uint256 spread1pc;
  uint256 spread10pc;

  uint256 inBucket;
  uint256 outBucket;

  function setUp() public {
    exchange = IMentoExchange(new CPExchange());
    spread1pc = FixidityLib.unwrap(FixidityLib.newFixedFraction(1, 100));
    spread10pc = FixidityLib.unwrap(FixidityLib.newFixedFraction(10, 100));

    inBucket = 10**10;
    outBucket = 2 * 10**10;

  }

  function test_name() public {
    assertEq(exchange.name(), "CPExchangeV1");
  }

  function test_getAmountOut_spread1pc() public {
    uint256 amountIn = 10**8;

    (uint256 amountOut, uint256 nextInBucket, uint256 nextOutBucket) = exchange.getAmountOut(
      amountIn,
      inBucket,
      outBucket,
      spread1pc
    );

    /*
                (10^8 * 99/100) * (2 * 10^10) 
    amountOut = ---------------------------- =
                10^10 + (10^8 * 99/100)       

                99 * 10^6 * 2 * 10^10
                ---------------------- = 
                (10^4 + 99) * 10^6

                198 * 10^10 
                ----------- = 196059015
                10099
    */

    assertEq(amountOut, 196059015);
    assertEq(nextInBucket, inBucket + amountIn);
    assertEq(nextOutBucket, outBucket - amountOut);
  }

  function test_getAmountOut_spread10pc() public {
    uint256 amountIn = 10**8;

    /*
                (10^8 * 90/100) * (2 * 10^10) 
    amountOut = ---------------------------- =
                10^10 + (10^8 * 90/100)       

                9 * 10^7 * 2 * 10^10
                ---------------------- = 
                (10^3 + 9) * 1076

                19 * 10^10 
                ----------- = 178394449
                1009
    */

    (uint256 amountOut, uint256 nextInBucket, uint256 nextOutBucket) = exchange.getAmountOut(
      amountIn,
      inBucket,
      outBucket,
      spread10pc
    );

    assertEq(amountOut, 178394449);
    assertEq(nextInBucket, inBucket + amountIn);
    assertEq(nextOutBucket, outBucket - amountOut);
  }

  function test_getAmountIn_spread1pc() public {
    uint256 amountOut = 2 * 10**8;

    (uint256 amountIn, uint256 nextInBucket, uint256 nextOutBucket) = exchange.getAmountIn(
      amountOut,
      inBucket,
      outBucket,
      spread1pc
    );

    /*
               2 * 10^8 * 10^10
    amountIn = ---------------------------- =
               (2 * 10^10 - 2 * 10^8) * 99/100

               2 * 10^18
               ---------------------- = 
               (200 - 2) * 10^6 * 99

               2 * 10^12
               ----------- = 102030405
               19602
    */

    assertEq(amountIn, 102030405);
    assertEq(nextInBucket, inBucket + amountIn);
    assertEq(nextOutBucket, outBucket - amountOut);
  }

  function test_getAmountIn_spread10pc() public {
    uint256 amountOut = 2 * 10**8;

    (uint256 amountIn, uint256 nextInBucket, uint256 nextOutBucket) = exchange.getAmountIn(
      amountOut,
      inBucket,
      outBucket,
      spread10pc
    );

    /*
               2 * 10^8 * 10^10
    amountIn = ---------------------------- =
               (2 * 10^10 - 2 * 10^8) * 90/100

               2 * 10^18
               ---------------------- = 
               (200 - 2) * 10^7 * 9

               2 * 10^11
               ----------- = 112233445
               1782
    */

    assertEq(amountIn, 112233445);
    assertEq(nextInBucket, inBucket + amountIn);
    assertEq(nextOutBucket, outBucket - amountOut);
  }
}

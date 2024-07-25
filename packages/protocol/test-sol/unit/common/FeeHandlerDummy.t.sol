// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.5.13;

import { Exchange } from "@mento-core/contracts/Exchange.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import "@celo-contracts/uniswap/test/MockUniswapV2Router02.sol";
import "@celo-contracts/uniswap/test/MockUniswapV2Factory.sol";
import "@mento-core/test/mocks/MockSortedOracles.sol";
import "@mento-core/test/mocks/MockReserve.sol";

// dummy test for artifacts to be generated (for FeeHandler test)
contract FeeHandlerDummy {
  function test_Reverts_WhenOracleSlippageIsHigh() public {
  }
}

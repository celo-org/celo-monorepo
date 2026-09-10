// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile FeeCurrencyWhitelistCompile so the 0.5 unit tests can
// deploy the 0.8 implementation via deployCodeTo (which resolves it by name).
import "@test-sol/unit/common/mocks/FeeCurrencyWhitelistCompile.sol";

contract CompileFeeCurrencyWhitelist is Test {
  function test_nop() public view {}
}

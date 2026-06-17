// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile FreezerCompile so the 0.5 unit tests can
// deploy the 0.8 implementation via deployCodeTo("FreezerCompile", ...).
import "@test-sol/unit/common/mocks/FreezerMocks08.sol";

contract CompileFreezerNetwork is Test {
  function test_nop() public view {}
}

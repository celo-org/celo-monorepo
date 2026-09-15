// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile the FeeHandler family compile-mocks so the 0.5 unit
// tests can deploy the 0.8 implementations via deployCodeTo (which resolves
// them by name).
import "@test-sol/unit/common/mocks/FeeHandlerFamilyMocks08.sol";

contract CompileFeeHandlerFamily is Test {
  function test_nop() public view {}
}

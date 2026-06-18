// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

// Forces forge to compile the 0.5 MockValidators so tests in this directory can
// deploy it via deployCodeTo("MockValidators.sol", ...). Previously the 0.5
// Accounts.t.sol source-imported it; after Accounts.t.sol moved to 0.8 this shim
// keeps the artifact in the common --match-path compile closure.
import "@celo-contracts/governance/test/MockValidators.sol";

contract CompileMockValidators is Test {
  function test_nop() public view {}
}

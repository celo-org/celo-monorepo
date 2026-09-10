// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/stability/SortedOracles.sol";

// Forces forge to compile the 0.8 SortedOracles so the 0.5 unit tests can deploy
// it via deployCodeTo("SortedOraclesCompile", ...). The trivial test keeps this
// file in the compile closure under the stability --match-path run.
contract SortedOraclesCompile is SortedOracles(true) {}

contract CompileSortedOracles is Test {
  function test_nop() public view {}
}

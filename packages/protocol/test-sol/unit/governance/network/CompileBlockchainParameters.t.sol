// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/governance/BlockchainParameters.sol";

// Forces forge to compile the 0.8 BlockchainParameters so the 0.5 unit tests can
// deploy it via deployCodeTo("BlockchainParametersCompile", ...). The trivial test
// keeps this file in the compile closure under the governance/network --match-path run.
contract BlockchainParametersCompile is BlockchainParameters(true) {}

contract CompileBlockchainParameters is Test {
  function test_nop() public view {}
}

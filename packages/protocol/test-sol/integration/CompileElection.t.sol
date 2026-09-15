// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile ElectionCompile so the 0.5 integration tests can
// deploy the 0.8 Election via deployCodeTo("ElectionCompile", ...).
import "@test-sol/unit/governance/voting/mocks/ElectionCompile.sol";

contract CompileElectionIntegration is Test {
  function test_nop() public view {}
}

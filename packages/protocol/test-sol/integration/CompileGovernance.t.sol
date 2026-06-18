// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile GovernanceMock08 so the 0.5 integration tests can
// deploy the 0.8 Governance via deployCodeTo("GovernanceMock08", ...).
import "@celo-contracts-8/governance/test/GovernanceMock08.sol";

contract CompileGovernanceIntegration is Test {
  function test_nop() public view {}
}

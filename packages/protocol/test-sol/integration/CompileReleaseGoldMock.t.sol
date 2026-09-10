// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "forge-std/console.sol";

// here only to force compile of ReleaseGoldCompile in the integration domain
import "@test-sol/unit/governance/voting/mocks/ReleaseGoldCompile.sol";

contract CompileReleaseGoldIntegrationMock is Test {
  function test_nop() public view {
    console.log("nop");
  }
}

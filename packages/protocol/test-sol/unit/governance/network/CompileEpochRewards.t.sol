// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile the 0.8 EpochRewards so the 0.5 unit tests can deploy
// it via deployCodeTo("EpochRewardsMock08", ...). The trivial test keeps this
// file in the compile closure under the governance/network --match-path run.
import "@test-sol/unit/governance/network/mocks/EpochRewardsMocks08.sol";

contract CompileEpochRewards is Test {
  function test_nop() public view {}
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Pulls the Random 0.8 mocks into the compile closure for the governance/voting
// --match-path run (Election.t.sol deploys MockRandom08 via deployCodeTo).
import "@test-sol/unit/identity/mocks/RandomMocks08.sol";

contract CompileRandomVoting is Test {
  function test_nop() public view {}
}

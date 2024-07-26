// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.5.13;

import { Reserve } from "@lib/mento-core/contracts/Reserve.sol";

// dummy test for artifacts to be generated (for FeeHandler test)
contract EpochRewardsDummy {
  function test_WhenVotingFractionRemainsAboveTarget5EpochsInARow_ShouldDecrease5TimesTargetVotingYield()
    public
  {}
}

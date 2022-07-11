// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test } from "celo-foundry/Test.sol";

import { WithRegistry } from "../utils/WithRegistry.sol";

import { MedianDeltaBreaker } from "contracts/stability/MedianDeltaBreaker.sol";

contract MedianDeltaBreakerTest is Test, WithRegistry {
  address deployer;

  MedianDeltaBreaker breaker;

  event BreakerTriggered(address indexed exchange);
  event BreakerReset(address indexed exchange);
  event CooldownTimeUpdated(uint256 newCooldownTime);
  event MinPriceChangeUpdated(uint256 newMinPriceChangeThreshold);
  event MaxPriceChangeUpdated(uint256 newMaxPriceChangeThreshold);
  event PriceChangeMultiplierUpdated(uint256 newPriceChangeMultiplier);

  function setUp() public {
    deployer = actor("deployer");
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { WithRegistry } from "../utils/WithRegistry.sol";

import { MockSortedOracles } from "contracts/stability/test/MockSortedOracles.sol";
import { MedianDeltaBreaker } from "contracts/stability/MedianDeltaBreaker.sol";
import {
  SortedLinkedListWithMedian
} from "contracts/common/linkedlists/SortedLinkedListWithMedian.sol";

contract MedianDeltaBreakerTest is Test, WithRegistry {
  address deployer;

  MockSortedOracles sortedOracles;
  MedianDeltaBreaker breaker;

  uint256 minThreshold = 0.15 * 10**24; // 15%
  uint256 maxThreshold = 0.25 * 10**24; // 25%
  uint256 timeMultiplier = 0.0075 * 10**24;
  uint256 coolDownTime = 5 minutes;

  event BreakerTriggered(address indexed exchange);
  event BreakerReset(address indexed exchange);
  event CooldownTimeUpdated(uint256 newCooldownTime);
  event MinPriceChangeUpdated(uint256 newMinPriceChangeThreshold);
  event MaxPriceChangeUpdated(uint256 newMaxPriceChangeThreshold);
  event PriceChangeMultiplierUpdated(uint256 newPriceChangeMultiplier);

  function setUp() public {
    deployer = actor("deployer");

    changePrank(deployer);
    setupSortedOracles();

    breaker = new MedianDeltaBreaker(
      address(registry),
      coolDownTime,
      minThreshold,
      maxThreshold,
      timeMultiplier
    );
  }

  function setupSortedOracles() public {
    sortedOracles = new MockSortedOracles();
    registry.setAddressFor("SortedOracles", address(sortedOracles));
    setupGetTimestamps(new uint256[](1));
  }

  function setupGetTimestamps(uint256[] memory timestamps) public {
    vm.mockCall(
      address(sortedOracles),
      abi.encodeWithSelector(sortedOracles.getTimestamps.selector),
      abi.encode(new address[](1), timestamps, new SortedLinkedListWithMedian.MedianRelation[](1))
    );
  }
}

contract MedianDeltaBreakerTest_constructorAndSetters is MedianDeltaBreakerTest {}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { Test } from "celo-foundry/Test.sol";
import { WithRegistry } from "../utils/WithRegistry.sol";

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import {
  SortedLinkedListWithMedian
} from "contracts/common/linkedlists/SortedLinkedListWithMedian.sol";
import { MedianDeltaBreaker } from "contracts/stability/MedianDeltaBreaker.sol";

import { MockSortedOracles } from "contracts/stability/test/MockSortedOracles.sol";
import { MockExchange } from "contracts/stability/test/MockExchange.sol";

contract MedianDeltaBreakerTest is Test, WithRegistry {
  address deployer;
  address nonDeployer;
  address testStable;

  MockExchange testExchange;
  MockSortedOracles sortedOracles;
  MedianDeltaBreaker breaker;

  uint256 threshold = 0.15 * 10**24; // 15%
  uint256 coolDownTime = 5 minutes;

  event BreakerTriggered(address indexed exchange);
  event BreakerReset(address indexed exchange);
  event CooldownTimeUpdated(uint256 newCooldownTime);
  event PriceChangeThresholdUpdated(uint256 newMinPriceChangeThreshold);

  function setUp() public {
    deployer = actor("deployer");
    nonDeployer = actor("nonDeployer");
    testStable = actor("testStable");

    changePrank(deployer);

    testExchange = new MockExchange();
    sortedOracles = new MockSortedOracles();

    registry.setAddressFor("SortedOracles", address(sortedOracles));

    vm.mockCall(
      address(testExchange),
      abi.encodeWithSelector(testExchange.stable.selector),
      abi.encode(testStable)
    );

    breaker = new MedianDeltaBreaker(address(registry), coolDownTime, threshold);
  }

  function setupSortedOracles(uint256 currentMedianRate, uint256 previousMedianRate) public {
    vm.mockCall(
      address(sortedOracles),
      abi.encodeWithSelector(sortedOracles.previousMedianRate.selector),
      abi.encode(previousMedianRate)
    );

    vm.mockCall(
      address(sortedOracles),
      abi.encodeWithSelector(sortedOracles.medianRate.selector),
      abi.encode(currentMedianRate, 1)
    );
  }
}

contract MedianDeltaBreakerTest_constructorAndSetters is MedianDeltaBreakerTest {
  /* ---------- Constructor ---------- */

  function test_constructor_shouldSetOwner() public {
    assertEq(breaker.owner(), deployer);
  }

  function test_constructor_shouldSetRegistry() public {
    assertEq(address(breaker.registry()), address(registry));
  }

  function test_constructor_shouldSetCooldownTime() public {
    assertEq(breaker.cooldownTime(), coolDownTime);
  }

  function test_constructor_shouldSetPriceChangeThreshold() public {
    assertEq(breaker.priceChangeThreshold(), threshold);
  }

  /* ---------- Setters ---------- */

  function test_setCooldownTime_whenCallerIsNotOwner_shouldRevert() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(nonDeployer);
    breaker.setCooldownTime(2 minutes);
  }

  function test_setCooldownTime_whenCallerIsOwner_shouldUpdateAndEmit() public {
    uint256 testCooldown = 39 minutes;
    vm.expectEmit(false, false, false, true);
    emit CooldownTimeUpdated(testCooldown);

    breaker.setCooldownTime(testCooldown);

    assertEq(breaker.cooldownTime(), testCooldown);
  }

  function test_setPriceChangeThreshold_whenCallerIsNotOwner_shouldRevert() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(nonDeployer);

    breaker.setPriceChangeThreshold(123456);
  }

  function test_setPriceChangeThreshold_whenValueGreaterThanOne_shouldRevert() public {
    vm.expectRevert("price change threshold must be less than 1");
    breaker.setPriceChangeThreshold(1 * 10**24);
  }

  function test_setPriceChangeThreshold_whenCallerIsOwner_shouldUpdateAndEmit() public {
    uint256 testThreshold = 0.1 * 10**24;
    vm.expectEmit(false, false, false, true);
    emit PriceChangeThresholdUpdated(testThreshold);

    breaker.setPriceChangeThreshold(testThreshold);

    assertEq(breaker.priceChangeThreshold(), testThreshold);
  }

  /* ---------- Getters ---------- */

  function test_getCooldown_shouldReturnCooldown() public {
    assertEq(breaker.getCooldown(), coolDownTime);
  }
}

contract MedianDeltaBreakerTest_shouldTrigger is MedianDeltaBreakerTest {
  function updateMedianByPercent(uint256 medianChangeScaleFactor) public {
    uint256 previousMedianRate = 0.98 * 10**24;
    uint256 currentMedianRate = (previousMedianRate * medianChangeScaleFactor) / 10**24;
    setupSortedOracles(currentMedianRate, previousMedianRate);

    vm.expectCall(address(testExchange), abi.encodeWithSelector(testExchange.stable.selector));
    vm.expectCall(
      address(sortedOracles),
      abi.encodeWithSelector(sortedOracles.previousMedianRate.selector, testStable)
    );
    vm.expectCall(
      address(sortedOracles),
      abi.encodeWithSelector(sortedOracles.medianRate.selector, testStable)
    );
  }

  function test_shouldTrigger_whenMedianDrops30Percent_shouldReturnTrue() public {
    updateMedianByPercent(0.7 * 10**24);
    assertTrue(breaker.shouldTrigger(address(testExchange)));
  }

  function test_shouldTrigger_whenMedianDrops10Percent_shouldReturnFalse() public {
    updateMedianByPercent(0.9 * 10**24);
    assertFalse(breaker.shouldTrigger(address(testExchange)));
  }

  function test_shouldTrigger_whenMedianIncreases10Percent_shouldReturnFalse() public {
    updateMedianByPercent(1.1 * 10**24);
    assertFalse(breaker.shouldTrigger(address(testExchange)));
  }

  function test_shouldTrigger_whenMedianIncreases20Percent_shouldReturnTrue() public {
    updateMedianByPercent(1.2 * 10**24);
    assertTrue(breaker.shouldTrigger(address(testExchange)));
  }
}

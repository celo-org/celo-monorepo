// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "../../../contracts/governance/EpochRewards.sol";
import "../../../contracts/common/Registry.sol";

import "forge-std/console.sol";

contract EpochRewardsFoundryTest is Test {
  event TargetVotingGoldFractionSet(uint256 fraction);

  uint256 constant targetVotingYieldParamsInitial = 160000000000000000000; //0.00016
  uint256 constant targetVotingYieldParamsMax = 500000000000000000000; // 0.0005
  uint256 constant targetVotingYieldParamsAdjustmentFactor = 1127990000000000000; // 0.00000112799

  uint256 constant rewardsMultiplierMax = 2000000000000000000000000; // 2
  uint256 constant rewardsMultiplierAdjustmentsUnderspend = 500000000000000000000000; // 0.5
  uint256 constant rewardsMultiplierAdjustmentsOverspend = 5000000000000000000000000; // 5

  uint256 constant targetVotingGoldFraction = (2 * 1e24) / uint256(3); // TODO Change all the previous
  uint256 constant targetValidatorEpochPayment = 1e13;
  uint256 constant communityRewardFraction = (1 * 1e24) / uint256(4);
  uint256 constant carbonOffsettingFraction = (1 * 1e24) / uint256(200);

  EpochRewards epochRewards;

  // mocked contracts
  Registry registry;

  address caller = address(this);
  // uint256 callerPK;

  function setUp() public {
    epochRewards = new EpochRewards(true);

    registry = new Registry(true);

    // callerPK = 0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d;
    // caller = getAddressFromPrivateKey(callerPK);

    console.log(targetVotingGoldFraction);

    vm.prank(caller);
    epochRewards.initialize(
      address(registry),
      targetVotingYieldParamsInitial,
      targetVotingYieldParamsMax,
      targetVotingYieldParamsAdjustmentFactor,
      rewardsMultiplierMax,
      rewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend,
      targetVotingGoldFraction,
      targetValidatorEpochPayment,
      communityRewardFraction,
      address(0),
      carbonOffsettingFraction
    );
  }

}

contract EpochRewardsFoundryTest_Initialize is EpochRewardsFoundryTest {
  function test_shouldHaveSetOwner() public {
    assertEq(epochRewards.owner(), caller);
  }

  function test_shouldHaveSetTargetValidatorEpochPayment() public {
    assertEq(epochRewards.targetValidatorEpochPayment(), targetValidatorEpochPayment);
  }

  function test_shouldHaveSetTargetRewardMultiplierParameter() public {
    uint256 target;
    uint256 max;
    uint256 adjustmentFactor;
    (target, max, adjustmentFactor) = epochRewards.getTargetVotingYieldParameters();

    assertEq(target, targetVotingYieldParamsInitial);
    assertEq(max, targetVotingYieldParamsMax);
    assertEq(adjustmentFactor, targetVotingYieldParamsAdjustmentFactor);
  }

  function test_shouldHaveSetRewardsMultiplier() public {
    uint256 max;
    uint256 underspend;
    uint256 overspend;
    (max, underspend, overspend) = epochRewards.getRewardsMultiplierParameters();

    assertEq(max, rewardsMultiplierMax);
    assertEq(underspend, rewardsMultiplierAdjustmentsUnderspend);
    assertEq(overspend, rewardsMultiplierAdjustmentsOverspend);
  }

  function test_shouldNotBeCallabeAgain() public {
    vm.expectRevert("contract already initialized");
    epochRewards.initialize(
      address(registry),
      targetVotingYieldParamsInitial,
      targetVotingYieldParamsMax,
      targetVotingYieldParamsAdjustmentFactor,
      rewardsMultiplierMax,
      rewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend,
      targetVotingGoldFraction,
      targetValidatorEpochPayment,
      communityRewardFraction,
      address(0),
      carbonOffsettingFraction
    );
  }

}

contract EpochRewardsFoundryTest_setTargetVotingGoldFraction is EpochRewardsFoundryTest {
  uint256 newFraction;

  function setUp() public {
    super.setUp();
    newFraction = targetVotingGoldFraction + 1;
  }

  function test_whenFractionIsDifferent_whenCalledByOwer_shouldSetTargetVotingGoldFraction()
    public
  {
    vm.prank(caller);
    epochRewards.setTargetVotingGoldFraction(newFraction);
    assertEq(epochRewards.getTargetVotingGoldFraction(), newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByOwer_shouldEmit() public {
    vm.prank(caller);
    vm.expectEmit(true, true, true, true);
    emit TargetVotingGoldFractionSet(newFraction);
    epochRewards.setTargetVotingGoldFraction(newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByNonOwer_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingGoldFraction(newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByOwer_shouldRevert() public {
    vm.expectRevert("Target voting gold fraction unchanged");
    epochRewards.setTargetVotingGoldFraction(targetVotingGoldFraction);
  }

}

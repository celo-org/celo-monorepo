// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
// import "../../../contracts/governance/EpochRewards.sol";
import "../../../contracts/common/Registry.sol";

import "../../../contracts/governance/test/MockElection.sol";
import "../../../contracts/governance/test/EpochRewardsTest.sol"; // TODO move this to test-sol? // TODO import only EpochRewardsTest

import "../../../contracts/stability/test/MockSortedOracles.sol";
import "../../../contracts/stability/test/MockStableToken.sol";
import "../../../contracts/common/test/MockGoldToken.sol";

import "forge-std/console.sol";

contract EpochRewardsFoundryTest is Test {
  event TargetVotingGoldFractionSet(uint256 fraction);
  event CommunityRewardFractionSet(uint256 fraction);
  event TargetValidatorEpochPaymentSet(uint256 payment);
  event RewardsMultiplierParametersSet(
    uint256 max,
    uint256 underspendAdjustmentFactor,
    uint256 overspendAdjustmentFactor
  );
  event TargetVotingYieldParametersSet(uint256 max, uint256 adjustmentFactor);
  event TargetVotingYieldSet(uint256 target);

  uint256 constant YEAR = 365 * 24 * 60 * 60;

  uint256 constant targetVotingYieldParamsInitial = 160000000000000000000; //0.00016
  uint256 constant targetVotingYieldParamsMax = 500000000000000000000; // 0.0005
  uint256 constant targetVotingYieldParamsAdjustmentFactor = 1127990000000000000; // 0.00000112799

  uint256 constant rewardsMultiplierMax = 2000000000000000000000000; // 2
  uint256 constant rewardsMultiplierAdjustmentsUnderspend = 500000000000000000000000; // 0.5
  uint256 constant rewardsMultiplierAdjustmentsOverspend = 5000000000000000000000000; // 5

  uint256 constant targetVotingGoldFraction = (2 * 1e24) / uint256(3); // TODO Change all the previous to scietific notation
  uint256 constant targetValidatorEpochPayment = 1e13;
  uint256 constant communityRewardFraction = (1 * 1e24) / uint256(4);
  uint256 constant carbonOffsettingFraction = (1 * 1e24) / uint256(200);

  uint256 constant exchangeRate = 7;
  uint256 constant sortedOraclesDenominator = 1e24;

  uint256 constant SUPPLY_CAP = 1e9 ether;

  EpochRewardsTest epochRewards;
  MockElection mockElection;
  MockSortedOracles mockSortedOracles;
  MockStableToken mockStableToken;
  MockGoldToken mockGoldToken;

  // mocked contracts
  Registry registry;

  address caller = address(this);

  function getExpectedTargetTotalSupply(uint256 timeDelta) internal pure returns (uint256) {
    // const getExpectedTargetTotalSupply = (timeDelta: BigNumber): BigNumber => {
    //   const genesisSupply = new BigNumber(web3.utils.toWei('600000000'))
    //   const linearRewards = new BigNumber(web3.utils.toWei('200000000'))
    //   return genesisSupply
    //     .plus(timeDelta.times(linearRewards).div(YEAR.times(15)))
    //     .integerValue(BigNumber.ROUND_FLOOR)
    // }

    uint256 genesisSupply = 600000000 ether;
    uint256 linearRewards = 200000000 ether;

    return uint256(genesisSupply + (timeDelta * linearRewards) / (YEAR * 15));

  }
  // uint256 callerPK;

  function setUp() public {
    epochRewards = new EpochRewardsTest();

    mockElection = new MockElection();
    mockSortedOracles = new MockSortedOracles();
    mockStableToken = new MockStableToken();
    mockGoldToken = new MockGoldToken();

    registry = new Registry(true);

    // TODO not all tests require all this setup, so an optimization
    // would be to generate multiple ones inheriting
    registry.setAddressFor("Election", address(mockElection));
    registry.setAddressFor("SortedOracles", address(mockSortedOracles));
    registry.setAddressFor("StableToken", address(mockStableToken));
    registry.setAddressFor("GoldToken", address(mockGoldToken));

    mockSortedOracles.setMedianRate(
      address(mockStableToken),
      sortedOraclesDenominator * exchangeRate
    );

    // callerPK = 0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d;
    // caller = getAddressFromPrivateKey(callerPK);

    console.log(targetVotingGoldFraction);

    vm.prank(caller); // TODO remove this
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

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldSetTargetVotingGoldFraction()
    public
  {
    epochRewards.setTargetVotingGoldFraction(newFraction);
    assertEq(epochRewards.getTargetVotingGoldFraction(), newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldEmit() public {
    vm.expectEmit(true, true, true, true);
    emit TargetVotingGoldFractionSet(newFraction);
    epochRewards.setTargetVotingGoldFraction(newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByNonOwner_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingGoldFraction(newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldRevert() public {
    vm.expectRevert("Target voting gold fraction unchanged");
    epochRewards.setTargetVotingGoldFraction(targetVotingGoldFraction);
  }

}

contract EpochRewardsFoundryTest_setCommunityRewardFraction is EpochRewardsFoundryTest {
  uint256 newFraction;

  function setUp() public {
    super.setUp();
    newFraction = communityRewardFraction + 1;
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldSetTargetVotingGoldFraction()
    public
  {
    epochRewards.setCommunityRewardFraction(newFraction);
    assertEq(epochRewards.getCommunityRewardFraction(), newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldEmit() public {
    vm.expectEmit(true, true, true, true);
    emit CommunityRewardFractionSet(newFraction);
    epochRewards.setCommunityRewardFraction(newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByNonOwner_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setCommunityRewardFraction(newFraction);
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldRevert() public {
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1"
    );
    epochRewards.setCommunityRewardFraction(communityRewardFraction);
  }

  function test_shouldBeLessThan1() public {
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1"
    );
    epochRewards.setCommunityRewardFraction(1000000 ether);
  }
}

contract EpochRewardsFoundryTest_setTargetValidatorEpochPayment is EpochRewardsFoundryTest {
  uint256 newPayment;

  function setUp() public {
    super.setUp();
    newPayment = targetValidatorEpochPayment + 1;
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldSetTargetVotingGoldFraction()
    public
  {
    epochRewards.setTargetValidatorEpochPayment(newPayment);
    assertEq(epochRewards.targetValidatorEpochPayment(), newPayment);
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldEmit() public {
    vm.expectEmit(true, true, true, true);
    emit TargetValidatorEpochPaymentSet(newPayment);
    epochRewards.setTargetValidatorEpochPayment(newPayment);
  }

  function test_whenFractionIsDifferent_whenCalledByNonOwner_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetValidatorEpochPayment(newPayment);
  }

  function test_whenFractionIsDifferent_whenCalledByOwner_shouldRevert() public {
    vm.expectRevert("Target validator epoch payment unchanged");
    epochRewards.setTargetValidatorEpochPayment(targetValidatorEpochPayment);
  }
}

contract EpochRewardsFoundryTest_setRewardsMultiplierParameters is EpochRewardsFoundryTest {
  uint256 newRewardsMultiplierAdjustmentsUnderspend;

  function setUp() public {
    super.setUp();
    newRewardsMultiplierAdjustmentsUnderspend = rewardsMultiplierAdjustmentsUnderspend + 1;
  }

  function test_whenCalledByOwner_shouldSetNewRewardsMultiplierAdjustmentsOverspend() public {
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      newRewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );

    uint256 max;
    uint256 underspend;
    uint256 overspend;
    (max, underspend, overspend) = epochRewards.getRewardsMultiplierParameters();

    assertEq(max, rewardsMultiplierMax);
    assertEq(underspend, newRewardsMultiplierAdjustmentsUnderspend);
    assertEq(overspend, rewardsMultiplierAdjustmentsOverspend);
  }

  function test_whenCalledByOwner_shouldEmit() public {
    vm.expectEmit(true, true, true, true);
    emit RewardsMultiplierParametersSet(
      rewardsMultiplierMax,
      newRewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      newRewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );
  }

  function test_whenCalledByOwner_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      newRewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );
  }

  function test_whenCalledByNonOwner_whenParameterAreTheSame_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      rewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );
  }
}

contract EpochRewardsFoundryTest_setTargetVotingYieldParameters is EpochRewardsFoundryTest {
  uint256 newTargetVotingYieldParamsMax; // TODO check if variable can be initialized here
  uint256 newTargetVotingYieldParamsAdjustmentFactor;

  function setUp() public {
    super.setUp();
    newTargetVotingYieldParamsMax = targetVotingYieldParamsMax + 1;
    newTargetVotingYieldParamsAdjustmentFactor = targetVotingYieldParamsAdjustmentFactor + 1;
  }

  function test_whenCalledByOwner_shouldSetNewTargetVotingYieldParameters() public {
    epochRewards.setTargetVotingYieldParameters(
      newTargetVotingYieldParamsMax,
      newTargetVotingYieldParamsAdjustmentFactor
    );

    uint256 max;
    uint256 factor;
    (, max, factor) = epochRewards.getTargetVotingYieldParameters();

    assertEq(max, newTargetVotingYieldParamsMax);
    assertEq(factor, newTargetVotingYieldParamsAdjustmentFactor);
  }

  function test_whenCalledByOwner_shouldEmit() public {
    vm.expectEmit(true, true, true, true);
    emit TargetVotingYieldParametersSet(
      newTargetVotingYieldParamsMax,
      newTargetVotingYieldParamsAdjustmentFactor
    );
    epochRewards.setTargetVotingYieldParameters(
      newTargetVotingYieldParamsMax,
      newTargetVotingYieldParamsAdjustmentFactor
    );
  }

  function test_whenCalledByOwner_whenParameterAreTheSame_shouldRevert() public {
    vm.expectRevert("Bad target voting yield parameters");
    epochRewards.setTargetVotingYieldParameters(
      targetVotingYieldParamsMax,
      targetVotingYieldParamsAdjustmentFactor
    );
  }

  function test_whenCalledByNonOwner_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingYieldParameters(
      newTargetVotingYieldParamsMax,
      newTargetVotingYieldParamsAdjustmentFactor
    );
  }
}

contract EpochRewardsFoundryTest_setTargetVotingYield is EpochRewardsFoundryTest {
  uint256 constant newTargetVotingYieldParamsInitial = targetVotingYieldParamsInitial + 1;

  function test_whenCalledByOwner_shouldSetnewTargetVotingYieldParamsInitial() public {
    epochRewards.setTargetVotingYield(newTargetVotingYieldParamsInitial);

    uint256 target;
    (target, , ) = epochRewards.getTargetVotingYieldParameters();
    assertEq(target, newTargetVotingYieldParamsInitial);
  }

  function test_whenCalledByOwner_shouldEmit() public {
    vm.expectEmit(true, true, true, true);
    emit TargetVotingYieldSet(newTargetVotingYieldParamsInitial);
    epochRewards.setTargetVotingYield(newTargetVotingYieldParamsInitial);
  }

  function test_whenCalledByNonOwner_shouldRevert() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingYield(newTargetVotingYieldParamsInitial);
  }
}

contract EpochRewardsFoundryTest_getTargetGoldTotalSupply is EpochRewardsFoundryTest {
  function test_whenLessThan15YearsSinceGenesis_shouldReturn1B() public {
    uint256 timeDelta = YEAR * 10;
    vm.warp(block.timestamp + timeDelta);
    assertEq(epochRewards.getTargetGoldTotalSupply(), getExpectedTargetTotalSupply(timeDelta));
  }

}

contract EpochRewardsFoundryTest_getTargetVoterRewards is EpochRewardsFoundryTest {
  function test_whenThereAreActiveVotes_shouldReturnAPercentageOfActiveVotes() public {
    uint256 activeVotes = 1000000;

    mockElection.setActiveVotes(activeVotes);
    // fromFixed(targetVotingYieldParams.initial).times(activeVotes)
    uint256 expected = uint256((activeVotes * targetVotingYieldParamsInitial) / 1e24);

    assertEq(epochRewards.getTargetVoterRewards(), expected);
  }

}

contract EpochRewardsFoundryTest_getTargetTotalEpochPaymentsInGold is EpochRewardsFoundryTest {
  function test_whenExchangeRateIsSet_getTargetTotalEpochPaymentsInGold() public {
    uint256 numberValidators = 100;
    epochRewards.setNumberValidatorsInCurrentSet(numberValidators);
    uint256 expected = uint256((targetValidatorEpochPayment * numberValidators) / exchangeRate);

    assertEq(epochRewards.getTargetTotalEpochPaymentsInGold(), expected);
  }

}

contract EpochRewardsFoundryTest_getRewardsMultiplier is EpochRewardsFoundryTest {
  uint256 constant timeDelta = YEAR * 10;
  uint256 expectedTargetTotalSupply;
  uint256 expectedTargetRemainingSupply;
  uint256 targetEpochReward;

  function setUp() public {
    super.setUp();
    expectedTargetTotalSupply = getExpectedTargetTotalSupply(timeDelta);
    expectedTargetRemainingSupply = SUPPLY_CAP - expectedTargetTotalSupply; // TODO check if this is repeated (initialized as zero)
    targetEpochReward =
      epochRewards.getTargetVoterRewards() +
      epochRewards.getTargetTotalEpochPaymentsInGold();
  }

  function test_whenTheTargetSupplyIsEqualToTheActualSupplyAfterRewards_shouldReturnOne() public {
    mockGoldToken.setTotalSupply(expectedTargetTotalSupply - targetEpochReward);
    vm.warp(block.timestamp + timeDelta); // TODO mabe this goes to setUp
    assertEq(epochRewards.getRewardsMultiplier(), 1e24);
  }

  function test_whenTheActualRemainingSupplyIs10pMoreThanTheTargetRemainingSupplyAfterRewards_shouldReturnOnePlus10pTimesTheUnderspendAdjustment()
    public
  {
    uint256 actualRemainingSupply = uint256((expectedTargetRemainingSupply * 11) / 10);
    uint256 totalSupply = SUPPLY_CAP - actualRemainingSupply - targetEpochReward;
    mockGoldToken.setTotalSupply(totalSupply);
    vm.warp(block.timestamp + timeDelta);

    uint256 actual = epochRewards.getRewardsMultiplier(); // fromFixed(

    uint256 expected = uint256((1e24 + (rewardsMultiplierAdjustmentsUnderspend / 10)));
    //  new BigNumber(1).plus(
    //       fromFixed(rewardsMultiplier.adjustments.underspend).times(0.1)
    //     )
    assertApproxEqRel(actual, expected, 1e6);
  }

  function test_whenTheActualRemainingSupplyIs10PLessThanTheTargetRemainingSupplyAfterRewards_shouldReturnOneMinus10pTimesTheUnderspendAdjustment()
    public
  {
    uint256 actualRemainingSupply = uint256((expectedTargetRemainingSupply * 9) / 10);
    uint256 totalSupply = SUPPLY_CAP - actualRemainingSupply - targetEpochReward;
    mockGoldToken.setTotalSupply(totalSupply);

    vm.warp(block.timestamp + timeDelta);

    uint256 actual = epochRewards.getRewardsMultiplier(); // fromFixed(

    uint256 expected = uint256((1e24 - (rewardsMultiplierAdjustmentsOverspend / 10)));

    assertApproxEqRel(actual, expected, 1e6);

  }

}

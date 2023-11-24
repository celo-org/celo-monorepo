// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
// import "../../../contracts/governance/EpochRewards.sol";
import "../../../contracts/common/Registry.sol";
import "../../../contracts/common/Freezer.sol";

import "../../../contracts/governance/test/MockElection.sol";
import "../../../contracts/governance/test/EpochRewardsTest.sol"; // TODO move this to test-sol? // TODO import only EpochRewardsTest
import { Reserve } from "../../../lib/mento-core/contracts/Reserve.sol";

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
  bytes32[] initialAssetAllocationSymbols;
  uint256[] initialAssetAllocationWeights; // check if this can be done in one line

  EpochRewardsTest epochRewards;
  MockElection mockElection;
  MockSortedOracles mockSortedOracles;
  MockStableToken mockStableToken;
  MockGoldToken mockGoldToken;
  Freezer freezer;

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
    freezer = new Freezer(true);

    registry = new Registry(true);

    // TODO not all tests require all this setup, so an optimization
    // would be to generate multiple ones inheriting
    registry.setAddressFor("Election", address(mockElection));
    registry.setAddressFor("SortedOracles", address(mockSortedOracles));
    registry.setAddressFor("StableToken", address(mockStableToken));
    registry.setAddressFor("GoldToken", address(mockGoldToken));
    registry.setAddressFor("Freezer", address(freezer));

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

    initialAssetAllocationWeights = new uint256[](1);
    initialAssetAllocationWeights[0] = 1e24;

    initialAssetAllocationSymbols = new bytes32[](1);
    initialAssetAllocationSymbols[0] = bytes32("cGLD");
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
    vm.warp(block.timestamp + timeDelta);
  }

  function test_whenTheTargetSupplyIsEqualToTheActualSupplyAfterRewards_shouldReturnOne() public {
    mockGoldToken.setTotalSupply(expectedTargetTotalSupply - targetEpochReward);
    assertEq(epochRewards.getRewardsMultiplier(), 1e24);
  }

  function test_whenTheActualRemainingSupplyIs10pMoreThanTheTargetRemainingSupplyAfterRewards_shouldReturnOnePlus10pTimesTheUnderspendAdjustment()
    public
  {
    uint256 actualRemainingSupply = uint256((expectedTargetRemainingSupply * 11) / 10);
    uint256 totalSupply = SUPPLY_CAP - actualRemainingSupply - targetEpochReward;
    mockGoldToken.setTotalSupply(totalSupply);

    uint256 actual = epochRewards.getRewardsMultiplier();
    uint256 expected = uint256((1e24 + (rewardsMultiplierAdjustmentsUnderspend / 10)));
    assertApproxEqRel(actual, expected, 1e6);
  }

  function test_whenTheActualRemainingSupplyIs10PLessThanTheTargetRemainingSupplyAfterRewards_shouldReturnOneMinus10pTimesTheUnderspendAdjustment()
    public
  {
    uint256 actualRemainingSupply = uint256((expectedTargetRemainingSupply * 9) / 10);
    uint256 totalSupply = SUPPLY_CAP - actualRemainingSupply - targetEpochReward;
    mockGoldToken.setTotalSupply(totalSupply);

    uint256 actual = epochRewards.getRewardsMultiplier();
    uint256 expected = uint256((1e24 - (rewardsMultiplierAdjustmentsOverspend / 10)));
    assertApproxEqRel(actual, expected, 1e6);

  }

}

contract EpochRewardsFoundryTest_updateTargetVotingYield is EpochRewardsFoundryTest {
  Reserve reserve;
  uint256 constant totalSupply = 6000000 ether;
  uint256 constant reserveBalance = 1000000 ether;
  uint256 constant floatingSupply = totalSupply - reserveBalance;

  function setUp() public {
    super.setUp();
    reserve = new Reserve(true);

    registry.setAddressFor("Reserve", address(reserve));

    reserve.initialize(
      address(registry),
      60,
      1e24,
      0,
      0,
      initialAssetAllocationSymbols,
      initialAssetAllocationWeights,
      5e21, // 0.005
      2e24
    );

    mockGoldToken.setTotalSupply(totalSupply);
    vm.deal(address(reserve), reserveBalance);
  }

  function test_whenThePercentageOfVotingGoldIsEqualToTheTarget_shouldNotChangeTheTargetVotingYield()
    public
  {
    uint256 totalVotes = uint256((targetVotingGoldFraction * floatingSupply) / 1e24);

    mockElection.setTotalVotes(totalVotes); // TODO make function mockElection with these three lines
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertEq(result, targetVotingYieldParamsInitial);
  }

  function test_whenThePercentageOfVotingGoldIs10pLessThanTheTarget_shouldIncreaseTheTargetVotingYieldBy10pTimesTheAdjustmentFactor()
    public
  {
    // uint256 totalVotes = uint256(((targetVotingGoldFraction* floatingSupply )/10)/1e24);
    uint256 totalVotes = ((floatingSupply * targetVotingGoldFraction) - 1e23) / 1e24;

    console.log("totalVotes");
    console.log(totalVotes);
    mockElection.setTotalVotes(totalVotes);
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 expected = targetVotingYieldParamsInitial +
      uint256((targetVotingYieldParamsAdjustmentFactor / 10));
    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e15);
  }

  function test_whenThePercentageOfVotingGoldIs10pMoreThanTheTarget_shouldDecreaseTheTargetVotingYieldBy10pTimesTheAdjustmentFactor()
    public
  {
    uint256 totalVotes = ((floatingSupply * targetVotingGoldFraction) + 1e23) / 1e24;
    mockElection.setTotalVotes(totalVotes);
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 expected = targetVotingYieldParamsInitial -
      uint256((targetVotingYieldParamsAdjustmentFactor / 10));
    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e15);
  }

  function test_whenThePercentageOfVotingCeloIs0p_shouldIncreaseTheTargetVotingYieldByTheTargetVotingGoldPercentageTimesAdjustmentFactor()
    public
  {
    mockElection.setTotalVotes(0);
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 expected = targetVotingYieldParamsInitial +
      uint256((targetVotingYieldParamsAdjustmentFactor * targetVotingGoldFraction) / 1e24);
    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e4);
  }

  function test_whenThePercentageOfVotingGoldIs30p_shouldDecreaseTheTargetVotingYieldByVotingfractionTargetVotingGoldPercentageTimesAdjustmentFactor()
    public
  {
    uint256 totalVotes = (floatingSupply * 3) / 10;
    mockElection.setTotalVotes(totalVotes);
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 expected = targetVotingYieldParamsInitial +
      uint256(
        ((targetVotingYieldParamsAdjustmentFactor * (targetVotingGoldFraction - 3 * 1e24)) / 10)
      );
    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e1);
  }

  function test_whenThePercentageOfVotingGoldIs90p_shouldDecreaseTheTargetVotingYieldByVotingfractionTargetVotingGoldPercentageTimesAdjustmentFactor()
    public
  {
    uint256 totalVotes = (floatingSupply * 9) / 10;
    mockElection.setTotalVotes(totalVotes);
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 expected = targetVotingYieldParamsInitial +
      uint256(
        ((targetVotingYieldParamsAdjustmentFactor * (targetVotingGoldFraction - 9 * 1e24)) / 10)
      );
    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e1);
  }

  function test_whenThePercentageOfVotingGoldIs100P_ShouldDecreaseTheTargetVotingYieldBy100minusTargetVotingGoldPercentageTimesAdjustmentFactor()
    public
  {
    uint256 totalVotes = floatingSupply * 1;
    mockElection.setTotalVotes(totalVotes);
    vm.prank(address(0));
    epochRewards.updateTargetVotingYield();

    uint256 expected = targetVotingYieldParamsInitial +
      uint256((targetVotingYieldParamsAdjustmentFactor * (targetVotingGoldFraction - 1e24)));
    uint256 result;
    (result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e1);
  }

}

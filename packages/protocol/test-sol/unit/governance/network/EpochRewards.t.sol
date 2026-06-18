// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/interfaces/IFreezer.sol";
import "@celo-contracts/common/interfaces/IFreezerInitializer.sol";

import "@celo-contracts/governance/test/MockElection.sol";
import { IEpochRewardsMock } from "@celo-contracts/governance/interfaces/IEpochRewardsMock.sol";
import { IEpochRewardsInitializer } from "@celo-contracts/governance/interfaces/IEpochRewardsInitializer.sol";
import { IOwnable } from "@celo-contracts/common/interfaces/IOwnable.sol";
import { MockReserve08 } from "@celo-contracts-8/stability/test/MockReserve.sol";

import { MockSortedOracles } from "@celo-contracts/stability/test/MockSortedOracles.sol";
import { MockStableToken08 } from "@celo-contracts-8/stability/test/MockStableToken.sol";
import { CeloTokenMock08 } from "@test-sol/unit/governance/network/mocks/CeloTokenMock08.sol";

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { MockEpochManager } from "@test-sol/unit/common/mocks/MockEpochManager.sol";
// Force compilation of artifacts used by deployCodeTo
import { EpochRewardsImplMock08 } from "@test-sol/unit/governance/network/mocks/EpochRewardsMocks08.sol";
import { FreezerCompile } from "@test-sol/unit/common/mocks/FreezerMocks08.sol";

contract EpochRewardsTest is TestWithUtils08 {
  uint256 constant targetVotingYieldParamsInitial = 0.00016e24; // 0.00016
  uint256 constant targetVotingYieldParamsMax = 0.0005e24; // 0.0005
  uint256 constant targetVotingYieldParamsAdjustmentFactor = 1127990000000000000; // 0.00000112799

  uint256 constant rewardsMultiplierMax = 2 * FIXED1; // 2
  uint256 constant rewardsMultiplierAdjustmentsUnderspend = 0.5e24; // 0.5
  uint256 constant rewardsMultiplierAdjustmentsOverspend = 5e24; // 5

  uint256 constant targetVotingGoldFraction = (2 * FIXED1) / uint256(3);
  uint256 constant targetValidatorEpochPayment = 1e13;
  uint256 constant communityRewardFraction = FIXED1 / 4;
  uint256 constant carbonOffsettingFraction = FIXED1 / 200;

  uint256 constant exchangeRate = 7;
  uint256 constant sortedOraclesDenominator = FIXED1;

  uint256 constant SUPPLY_CAP = 1e9 ether;
  bytes32[] initialAssetAllocationSymbols;
  uint256[] initialAssetAllocationWeights;

  // Mocked contracts
  IEpochRewardsMock epochRewards;
  address epochRewardsAddress;
  MockElection election;
  MockSortedOracles mockSortedOracles;
  MockStableToken08 mockStableToken;
  CeloTokenMock08 mockCeloToken;
  MockReserve08 reserve;
  IFreezer freezer;
  MockEpochManager mockEpochManagerForRewards;

  address celoUnreleasedTreasuryAddress;
  address caller = address(this);

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

  function setUp() public virtual override {
    super.setUp();
    preEpochRewardsSetup();
    whenL2WithEpochManagerInitialization();

    IEpochRewardsInitializer(epochRewardsAddress).initialize(
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

  function preEpochRewardsSetup() public {
    // Deploy EpochRewardsImplMock08 (0.8) via deployCodeTo at a deterministic address.
    epochRewardsAddress = actor("epochRewards");
    deployCodeTo("EpochRewardsImplMock08", epochRewardsAddress);
    epochRewards = IEpochRewardsMock(epochRewardsAddress);

    election = new MockElection();
    mockSortedOracles = new MockSortedOracles();
    mockStableToken = new MockStableToken08();

    mockCeloToken = new CeloTokenMock08();
    mockCeloToken.setRegistry(REGISTRY_ADDRESS);

    // Derive a fresh freezer address per call (keyed on the freshly-created
    // epochRewards) so re-running preEpochRewardsSetup deploys a new,
    // uninitialized Freezer instead of re-initializing one at a fixed address.
    address freezerAddress = address(
      uint160(uint256(keccak256(abi.encodePacked("freezer", epochRewardsAddress))))
    );
    deployCodeTo("FreezerCompile", freezerAddress);
    freezer = IFreezer(freezerAddress);
    IFreezerInitializer(freezerAddress).initialize();

    celoUnreleasedTreasuryAddress = actor("celoUnreleasedTreasury");
    deployCodeTo("CeloUnreleasedTreasury.sol", abi.encode(false), celoUnreleasedTreasuryAddress);
    registry.setAddressFor(CeloUnreleasedTreasuryContract, celoUnreleasedTreasuryAddress);

    vm.deal(celoUnreleasedTreasuryAddress, L2_INITIAL_STASH_BALANCE);
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(SortedOraclesContract, address(mockSortedOracles));
    registry.setAddressFor(StableTokenContract, address(mockStableToken));
    registry.setAddressFor(CeloTokenContract, address(mockCeloToken));
    registry.setAddressFor(FreezerContract, address(freezer));

    mockSortedOracles.setMedianRate(
      address(mockStableToken),
      sortedOraclesDenominator * exchangeRate
    );

    // Deploy a MockEpochManager so EpochRewards.getEpochManager() works
    mockEpochManagerForRewards = new MockEpochManager();
    registry.setAddressFor(EpochManagerContract, address(mockEpochManagerForRewards));
  }

  function _setNumberOfElectedInCurrentSetBaseOnLayer(uint256 numberValidators) internal {
    mockEpochManagerForRewards.setNumberOfElectedInCurrentSet(numberValidators);
  }

  function _updateTargetVotingYieldBasedOnLayer() internal {
    vm.prank(address(mockEpochManagerForRewards));
    epochRewards.updateTargetVotingYield();
  }

  function getExpectedTargetTotalSupply(uint256 timeDelta) internal pure returns (uint256) {
    uint256 genesisSupply = 600000000 ether;
    uint256 linearRewards = 200000000 ether;
    return uint256(genesisSupply + (timeDelta * linearRewards) / (YEAR * 15));
  }
}

contract EpochRewardsTest_initialize is EpochRewardsTest {
  // Base setUp already deploys and initializes EpochRewardsMock08 once (owner = this).
  function test_ShouldHaveSetOwner() public {
    assertEq(IOwnable(epochRewardsAddress).owner(), caller);
  }

  function test_ShouldHaveSetTargetValidatorEpochPayment() public {
    assertEq(epochRewards.targetValidatorEpochPayment(), targetValidatorEpochPayment);
  }

  function test_ShouldHaveSetTargetRewardMultiplierParameter() public {
    uint256 target;
    uint256 max;
    uint256 adjustmentFactor;
    (target, max, adjustmentFactor) = epochRewards.getTargetVotingYieldParameters();

    assertEq(target, targetVotingYieldParamsInitial);
    assertEq(max, targetVotingYieldParamsMax);
    assertEq(adjustmentFactor, targetVotingYieldParamsAdjustmentFactor);
  }

  function test_ShouldHaveSetRewardsMultiplier() public {
    uint256 max;
    uint256 underspend;
    uint256 overspend;
    (max, underspend, overspend) = epochRewards.getRewardsMultiplierParameters();

    assertEq(max, rewardsMultiplierMax);
    assertEq(underspend, rewardsMultiplierAdjustmentsUnderspend);
    assertEq(overspend, rewardsMultiplierAdjustmentsOverspend);
  }

  function test_shouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    IEpochRewardsInitializer(epochRewardsAddress).initialize(
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

contract EpochRewardsTest_setTargetVotingGoldFraction is EpochRewardsTest {
  uint256 newFraction;

  function setUp() public override {
    super.setUp();
    newFraction = targetVotingGoldFraction + 1;
  }

  function test_ShouldSetTargetVotingGoldFraction_WhenFractionIsDifferent_WhenCalledByOwner()
    public
  {
    epochRewards.setTargetVotingGoldFraction(newFraction);
    assertEq(epochRewards.getTargetVotingGoldFraction(), newFraction);
  }

  function test_Emits_TargetVotingGoldFractionSet_WhenFractionIsDifferent_WhenCalledByOwner()
    public
  {
    vm.expectEmit(true, true, true, true);
    emit TargetVotingGoldFractionSet(newFraction);
    epochRewards.setTargetVotingGoldFraction(newFraction);
  }

  function test_Reverts_WhenFractionIsDifferent_WhenCalledByNonOwner() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingGoldFraction(newFraction);
  }

  function test_Reverts_WhenFractionIsSame_WhenCalledByOwner() public {
    vm.expectRevert("Target voting gold fraction unchanged");
    epochRewards.setTargetVotingGoldFraction(targetVotingGoldFraction);
  }
}

contract EpochRewardsTest_setCommunityRewardFraction is EpochRewardsTest {
  uint256 newFraction = communityRewardFraction + 1;

  function test_ShouldSetTargetVotingGoldFraction_WhenFractionIsDifferent_WhenCalledByOwner()
    public
  {
    epochRewards.setCommunityRewardFraction(newFraction);
    assertEq(epochRewards.getCommunityRewardFraction(), newFraction);
  }

  function test_Emits_CommunityRewardFractionSet_WhenFractionIsDifferent_WhenCalledByOwner()
    public
  {
    vm.expectEmit(true, true, true, true);
    emit CommunityRewardFractionSet(newFraction);
    epochRewards.setCommunityRewardFraction(newFraction);
  }

  function test_Reverts_WhenFractionIs1() public {
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1"
    );
    epochRewards.setCommunityRewardFraction(FIXED1);
  }

  function test_Reverts_WhenFractionIsDifferent_WhenCalledByNonOwner() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setCommunityRewardFraction(newFraction);
  }

  function test_Reverts_WhenFractionIsDifferent_WhenCalledByOwner() public {
    vm.expectRevert(
      "Value must be different from existing community reward fraction and less than 1"
    );
    epochRewards.setCommunityRewardFraction(communityRewardFraction);
  }
}

contract EpochRewardsTest_setTargetValidatorEpochPayment is EpochRewardsTest {
  uint256 newPayment = targetValidatorEpochPayment + 1;

  function test_ShouldSetTargetVotingGoldFraction_WhenPaymentIsDifferent_WhenCalledByOwner()
    public
  {
    epochRewards.setTargetValidatorEpochPayment(newPayment);
    assertEq(epochRewards.targetValidatorEpochPayment(), newPayment);
  }

  function test_Emits_TargetValidatorEpochPaymentSet_WhenPaymentIsDifferent_WhenCalledByOwner()
    public
  {
    vm.expectEmit(true, true, true, true);
    emit TargetValidatorEpochPaymentSet(newPayment);
    epochRewards.setTargetValidatorEpochPayment(newPayment);
  }

  function test_Reverts_WhenPaymentIsDifferent_WhenCalledByNonOwner() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetValidatorEpochPayment(newPayment);
  }

  function test_Reverts_WhenFractionIsDifferent_WhenCalledByOwner() public {
    vm.expectRevert("Target validator epoch payment unchanged");
    epochRewards.setTargetValidatorEpochPayment(targetValidatorEpochPayment);
  }
}

contract EpochRewardsTest_setRewardsMultiplierParameters is EpochRewardsTest {
  uint256 newRewardsMultiplierAdjustmentsUnderspend = rewardsMultiplierAdjustmentsUnderspend + 1;

  function test_ShouldSetNewRewardsMultiplierAdjustmentsOverspend_WhenCalledByOwner() public {
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      newRewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );

    (uint256 max, uint256 underspend, uint256 overspend) = epochRewards
      .getRewardsMultiplierParameters();

    assertEq(max, rewardsMultiplierMax);
    assertEq(underspend, newRewardsMultiplierAdjustmentsUnderspend);
    assertEq(overspend, rewardsMultiplierAdjustmentsOverspend);
  }

  function test_Emits_RewardsMultiplierParametersSet_WhenCalledByOwner() public {
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

  function test_Reverts_WhenCalledByOwner() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      newRewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );
  }

  function test_Reverts_WhenCalledByNonOwner_WhenParameterAreTheSame() public {
    vm.expectRevert("Bad rewards multiplier parameters");
    epochRewards.setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      rewardsMultiplierAdjustmentsUnderspend,
      rewardsMultiplierAdjustmentsOverspend
    );
  }
}

contract EpochRewardsTest_setTargetVotingYieldParameters is EpochRewardsTest {
  uint256 newTargetVotingYieldParamsMax = targetVotingYieldParamsMax + 1;
  uint256 newTargetVotingYieldParamsAdjustmentFactor = targetVotingYieldParamsAdjustmentFactor + 1;

  function test_ShouldSetNewTargetVotingYieldParameters_WhenCalledByOwner() public {
    epochRewards.setTargetVotingYieldParameters(
      newTargetVotingYieldParamsMax,
      newTargetVotingYieldParamsAdjustmentFactor
    );

    (, uint256 max, uint256 factor) = epochRewards.getTargetVotingYieldParameters();

    assertEq(max, newTargetVotingYieldParamsMax);
    assertEq(factor, newTargetVotingYieldParamsAdjustmentFactor);
  }

  function test_Emits_TargetVotingYieldParametersSet_WhenCalledByOwner() public {
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

  function test_Reverts_WhenCalledByOwner_WhenParameterAreTheSame() public {
    vm.expectRevert("Bad target voting yield parameters");
    epochRewards.setTargetVotingYieldParameters(
      targetVotingYieldParamsMax,
      targetVotingYieldParamsAdjustmentFactor
    );
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingYieldParameters(
      newTargetVotingYieldParamsMax,
      newTargetVotingYieldParamsAdjustmentFactor
    );
  }
}

contract EpochRewardsTest_setTargetVotingYield is EpochRewardsTest {
  uint256 constant newTargetVotingYieldParamsInitial = targetVotingYieldParamsInitial + 1;

  function test_ShouldSetNewTargetVotingYieldParamsInitial_WhenCalledByOwner() public {
    epochRewards.setTargetVotingYield(newTargetVotingYieldParamsInitial);

    (uint256 target, , ) = epochRewards.getTargetVotingYieldParameters();
    assertEq(target, newTargetVotingYieldParamsInitial);
  }

  function test_Emits_TargetVotingYieldSet_WhenCalledByOwner() public {
    vm.expectEmit(true, true, true, true);
    emit TargetVotingYieldSet(newTargetVotingYieldParamsInitial);
    epochRewards.setTargetVotingYield(newTargetVotingYieldParamsInitial);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.prank(msg.sender);
    vm.expectRevert("Ownable: caller is not the owner");
    epochRewards.setTargetVotingYield(newTargetVotingYieldParamsInitial);
  }
}

contract EpochRewardsTest_getTargetGoldTotalSupply is EpochRewardsTest {
  function test_ShouldReturn1B_WhenLessThan15YearsSinceGenesis() public {
    uint256 timeDelta = YEAR * 10;
    timeTravel(timeDelta);
    assertEq(epochRewards.getTargetGoldTotalSupply(), getExpectedTargetTotalSupply(timeDelta));
  }
}

contract EpochRewardsTest_getTargetVoterRewards is EpochRewardsTest {
  function test_ShouldReturnAPercentageOfActiveVotes_WhenThereAreActiveVotes() public {
    uint256 activeVotes = 1000000;
    election.setActiveVotes(activeVotes);

    uint256 expected = uint256((activeVotes * targetVotingYieldParamsInitial) / FIXED1);
    assertEq(epochRewards.getTargetVoterRewards(), expected);
  }
}

contract EpochRewardsTest_getTargetTotalEpochPaymentsInGold is EpochRewardsTest {
  function test_ShouldgetTargetTotalEpochPaymentsInGold_WhenExchangeRateIsSet() public {
    uint256 numberValidators = 100;
    _setNumberOfElectedInCurrentSetBaseOnLayer(numberValidators);

    uint256 expected = uint256((targetValidatorEpochPayment * numberValidators) / exchangeRate);
    assertEq(epochRewards.getTargetTotalEpochPaymentsInGold(), expected);
  }
}

contract EpochRewardsTest_getRewardsMultiplier is EpochRewardsTest {
  uint256 constant timeDelta = YEAR * 10;
  uint256 expectedTargetTotalSupply;
  uint256 expectedTargetRemainingSupply;
  uint256 targetEpochReward;

  function setUp() public override {
    super.setUp();

    expectedTargetTotalSupply = getExpectedTargetTotalSupply(timeDelta);
    expectedTargetRemainingSupply = SUPPLY_CAP - expectedTargetTotalSupply;
    targetEpochReward =
      epochRewards.getTargetVoterRewards() +
      epochRewards.getTargetTotalEpochPaymentsInGold();
    timeTravel(timeDelta);
  }

  function test_ShouldReturnOne_WhenTheTargetSupplyIsEqualToTheActualSupplyAfterRewards() public {
    uint256 celoUnreleasedTreasuryBalance = SUPPLY_CAP - expectedTargetTotalSupply;
    vm.deal(celoUnreleasedTreasuryAddress, celoUnreleasedTreasuryBalance - targetEpochReward);

    assertEq(epochRewards.getRewardsMultiplier(), FIXED1);
  }

  function test_ShouldReturnOnePlus10pTimesTheUnderspendAdjustment_WhenTheActualRemainingSupplyIs10pMoreThanTheTargetRemainingSupplyAfterRewards()
    public
  {
    uint256 actualRemainingSupply = uint256((expectedTargetRemainingSupply * 11) / 10);

    vm.deal(celoUnreleasedTreasuryAddress, actualRemainingSupply - targetEpochReward);

    uint256 actual = epochRewards.getRewardsMultiplier();
    uint256 expected = uint256((FIXED1 + (rewardsMultiplierAdjustmentsUnderspend / 10)));
    assertApproxEqRel(actual, expected, 1e6);
  }

  function test_ShouldReturnOneMinus10pTimesTheUnderspendAdjustment_WhenTheActualRemainingSupplyIs10PLessThanTheTargetRemainingSupplyAfterRewards()
    public
  {
    uint256 actualRemainingSupply = uint256((expectedTargetRemainingSupply * 9) / 10);

    vm.deal(celoUnreleasedTreasuryAddress, actualRemainingSupply - targetEpochReward);

    uint256 actual = epochRewards.getRewardsMultiplier();
    uint256 expected = uint256((FIXED1 - (rewardsMultiplierAdjustmentsOverspend / 10)));
    assertApproxEqRel(actual, expected, 1e6);
  }
}

contract EpochRewardsTest_updateTargetVotingYield is EpochRewardsTest {
  uint256 constant totalSupplyL1 = 6000000 ether;
  uint256 constant celoUnreleasedTreasuryBalance = SUPPLY_CAP - totalSupplyL1;
  uint256 constant reserveBalance = 1000000 ether;
  uint256 constant floatingSupply = totalSupplyL1 - reserveBalance;

  function setUp() public override {
    super.setUp();
    reserve = new MockReserve08();

    registry.setAddressFor("Reserve", address(reserve));

    vm.deal(celoUnreleasedTreasuryAddress, celoUnreleasedTreasuryBalance);
    vm.deal(address(reserve), reserveBalance);
  }

  function test_ShouldNotChangeTheTargetVotingYield_WhenThePercentageOfVotingGoldIsEqualToTheTarget()
    public
  {
    uint256 totalVotes = uint256((targetVotingGoldFraction * floatingSupply) / FIXED1);
    mockVotes(totalVotes);

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertEq(result, targetVotingYieldParamsInitial);
  }

  function test_ShouldIncreaseTheTargetVotingYieldBy10pTimesTheAdjustmentFactor_WhenThePercentageOfVotingGoldIs10pLessThanTheTarget()
    public
  {
    uint256 totalVotes = ((floatingSupply * targetVotingGoldFraction) - 0.1e24) / FIXED1;
    mockVotes(totalVotes);

    uint256 expected = targetVotingYieldParamsInitial +
      uint256((targetVotingYieldParamsAdjustmentFactor / 10));
    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e15);
  }

  function test_ShouldDecreaseTheTargetVotingYieldBy10pTimesTheAdjustmentFactor_WhenThePercentageOfVotingGoldIs10pMoreThanTheTarget()
    public
  {
    uint256 totalVotes = ((floatingSupply * targetVotingGoldFraction) + 0.1e24) / FIXED1;
    mockVotes(totalVotes);
    uint256 expected = targetVotingYieldParamsInitial -
      uint256((targetVotingYieldParamsAdjustmentFactor / 10));

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e15);
  }

  function test_ShouldIncreaseTheTargetVotingYieldByTheTargetVotingGoldPercentageTimesAdjustmentFactor_WhenThePercentageOfVotingCeloIs0p()
    public
  {
    mockVotes(0);
    uint256 expected = targetVotingYieldParamsInitial +
      uint256((targetVotingYieldParamsAdjustmentFactor * targetVotingGoldFraction) / FIXED1);

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e4);
  }

  // At 30% voting (< 66.7% target), yield INCREASES.
  // delta = (targetVotingGoldFraction - 0.3*FIXED1) * adjustmentFactor / FIXED1
  function test_ShouldIncreaseTheTargetVotingYieldWhenThePercentageOfVotingGoldIs30p() public {
    uint256 totalVotes = (floatingSupply * 3) / 10;
    mockVotes(totalVotes);

    uint256 votingFraction = (3 * FIXED1) / 10; // 0.3 * FIXED1
    uint256 delta = (targetVotingYieldParamsAdjustmentFactor *
      (targetVotingGoldFraction - votingFraction)) / FIXED1;
    uint256 expected = targetVotingYieldParamsInitial + delta;

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    // FixidityLib.multiply uses mulPrecision() intermediate truncation which may differ
    // slightly from simple (a*b)/FIXED1; use 1e6 (1e-12 relative) tolerance.
    assertApproxEqRel(result, expected, 1e6);
  }

  // At 90% voting (> 66.7% target), yield DECREASES.
  // delta = (0.9*FIXED1 - targetVotingGoldFraction) * adjustmentFactor / FIXED1
  function test_ShouldDecreaseTheTargetVotingYieldWhenThePercentageOfVotingGoldIs90p() public {
    uint256 totalVotes = (floatingSupply * 9) / 10;
    mockVotes(totalVotes);

    uint256 votingFraction = (9 * FIXED1) / 10; // 0.9 * FIXED1
    uint256 delta = (targetVotingYieldParamsAdjustmentFactor *
      (votingFraction - targetVotingGoldFraction)) / FIXED1;
    uint256 expected = targetVotingYieldParamsInitial - delta;

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e6);
  }

  // At 100% voting (> 66.7% target), yield DECREASES.
  // delta = (FIXED1 - targetVotingGoldFraction) * adjustmentFactor / FIXED1
  function test_ShouldDecreaseTheTargetVotingYieldWhenThePercentageOfVotingGoldIs100P() public {
    uint256 totalVotes = floatingSupply * 1; // explicit one
    mockVotes(totalVotes);

    uint256 delta = (targetVotingYieldParamsAdjustmentFactor *
      (FIXED1 - targetVotingGoldFraction)) / FIXED1;
    uint256 expected = targetVotingYieldParamsInitial - delta;

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e6);
  }

  function test_ShouldEnforceMaximumTargetVotingYield_WhenTargetVotingYieldIsIncreasedByAdjustmentFactor()
    public
  {
    uint256 totalVotes = floatingSupply / 10;
    mockVotes(totalVotes);

    for (uint256 i = 0; i < 600; i++) {
      // naive time travel: mining takes too long, just repeatedly update target voting yield. One call is one epoch travelled
      // time travel alone is not enough, updateTargetVotingYield needs to be called
      _updateTargetVotingYieldBasedOnLayer();
    }

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();

    assertApproxEqRel(result, targetVotingYieldParamsMax, 1e1);
  }

  function test_ShouldEnfordMinimumTargetVotingYieldOf0_WhenTargetVotingYieldIsDecreasedByAdjustmentFactor()
    public
  {
    uint256 totalVotes = (floatingSupply * 98) / 100;
    election.setTotalVotes(totalVotes);
    // naive time travel: mining takes too long, just repeatedly update target voting yield. One call is one epoch travelled
    for (uint256 i = 0; i < 800; i++) {
      _updateTargetVotingYieldBasedOnLayer();
    }

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertEq(result, 0);
  }

  function test_ShouldIncreasTargetVotingYield5Times_WhenVotingFractionRemainsBelowTarget5EpochsInARow()
    public
  {
    uint256 totalVotes = (floatingSupply * 3) / 10;
    election.setTotalVotes(totalVotes);
    // naive time travel: mining takes too long, just repeatedly update target voting yield. One call is one epoch travelled
    for (uint256 i = 0; i < 5; i++) {
      _updateTargetVotingYieldBasedOnLayer();
    }

    // delta per epoch = (targetVotingGoldFraction - 0.3*FIXED1) * adjustmentFactor / FIXED1
    uint256 votingFraction = (3 * FIXED1) / 10;
    uint256 deltaPerEpoch = (targetVotingYieldParamsAdjustmentFactor *
      (targetVotingGoldFraction - votingFraction)) / FIXED1;
    uint256 expected = targetVotingYieldParamsInitial + deltaPerEpoch * 5;

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e7);
  }

  function test_WhenVotingFractionRemainsAboveTarget5EpochsInARow_ShouldDecrease5TimesTargetVotingYield()
    public
  {
    uint256 totalVotes = (floatingSupply * 8) / 10;
    election.setTotalVotes(totalVotes);
    // naive time travel: mining takes too long, just repeatedly update target voting yield. One call is one epoch travelled
    for (uint256 i = 0; i < 5; i++) {
      _updateTargetVotingYieldBasedOnLayer();
    }

    // delta per epoch = (0.8*FIXED1 - targetVotingGoldFraction) * adjustmentFactor / FIXED1
    uint256 votingFraction = (8 * FIXED1) / 10;
    uint256 deltaPerEpoch = (targetVotingYieldParamsAdjustmentFactor *
      (votingFraction - targetVotingGoldFraction)) / FIXED1;
    uint256 expected = targetVotingYieldParamsInitial - deltaPerEpoch * 5;

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e6);
  }

  function test_ShouldAdjustTargetVotingYield_WhenVotingFractionFluctuatesAroundTheTarget() public {
    uint256[] memory votingNumeratorArray = new uint256[](3);
    uint256[] memory votingDenominatorArray = new uint256[](3);

    votingNumeratorArray[0] = 8;
    votingNumeratorArray[1] = 3;
    votingNumeratorArray[2] = 2;

    votingDenominatorArray[0] = 10;
    votingDenominatorArray[1] = 10;
    votingDenominatorArray[2] = 3;

    uint256 expected = targetVotingYieldParamsInitial;
    for (uint256 i = 0; i < votingNumeratorArray.length; i++) {
      uint256 totalVotes = (floatingSupply * votingNumeratorArray[i]) / votingDenominatorArray[i];
      mockVotes(totalVotes);

      uint256 actualFraction = (votingNumeratorArray[i] * FIXED1) / votingDenominatorArray[i];
      if (actualFraction > targetVotingGoldFraction) {
        uint256 delta = (targetVotingYieldParamsAdjustmentFactor *
          (actualFraction - targetVotingGoldFraction)) / FIXED1;
        expected = expected > delta ? expected - delta : 0;
      } else if (actualFraction < targetVotingGoldFraction) {
        uint256 delta = (targetVotingYieldParamsAdjustmentFactor *
          (targetVotingGoldFraction - actualFraction)) / FIXED1;
        expected = expected + delta;
        if (expected > targetVotingYieldParamsMax) {
          expected = targetVotingYieldParamsMax;
        }
      }
    }

    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e6);
  }

  function test_ShouldChangeTargetVotingYield_WhenTargetVotingYieldIsIncreasedOver365EpochsByAdjustmentFactor()
    public
  {
    uint256 totalVotes = (floatingSupply * (targetVotingGoldFraction - 0.1e24)) / FIXED1;
    election.setTotalVotes(totalVotes);
    for (uint256 i = 0; i < 356; i++) {
      _updateTargetVotingYieldBasedOnLayer();
    }

    uint256 expected = targetVotingYieldParamsInitial +
      ((targetVotingYieldParamsAdjustmentFactor * 365) / 10);
    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e16);
  }

  function test_ShouldChangeTargetVotingYield_WhenTargetVotingYieldIsDecreasedOver365EpochsByAdjustmentFactor()
    public
  {
    uint256 totalVotes = (floatingSupply * (targetVotingGoldFraction + 0.1e24)) / FIXED1;
    election.setTotalVotes(totalVotes);
    for (uint256 i = 0; i < 356; i++) {
      _updateTargetVotingYieldBasedOnLayer();
    }

    uint256 expected = targetVotingYieldParamsInitial -
      ((targetVotingYieldParamsAdjustmentFactor * 365) / 10);
    (uint256 result, , ) = epochRewards.getTargetVotingYieldParameters();
    assertApproxEqRel(result, expected, 1e16);
  }

  function mockVotes(uint256 votes) internal {
    election.setTotalVotes(votes);
    _updateTargetVotingYieldBasedOnLayer();
  }
}

contract EpochRewardsTest_WhenThereAreActiveVotesAStableTokenExchangeRateIsSetAndTheActualRemainingSupplyIs10pMoreThanTheTargetRemainingSupplyAfterRewards_calculateTargetEpochRewards is
  EpochRewardsTest
{
  uint256 constant NUM_VALIDATORS = 100;
  uint256 constant activeVotes = 102398474 ether;
  uint256 constant timeDelta = YEAR * 10;
  uint256 expectedMultiplier;
  uint256 validatorReward;
  uint256 votingReward;

  function setUp() public override {
    super.setUp();

    _setNumberOfElectedInCurrentSetBaseOnLayer(NUM_VALIDATORS);
    election.setActiveVotes(activeVotes);
    uint256 expectedTargetTotalEpochPaymentsInGold = (targetValidatorEpochPayment *
      NUM_VALIDATORS) / exchangeRate;

    uint256 expectedTargetEpochRewards = (targetVotingYieldParamsInitial * activeVotes) / FIXED1;

    uint256 expectedTargetGoldSupplyIncrease = expectedTargetEpochRewards +
      ((expectedTargetTotalEpochPaymentsInGold /
        (FIXED1 - communityRewardFraction - carbonOffsettingFraction)) / FIXED1);
    uint256 expectedTargetTotalSupply = getExpectedTargetTotalSupply(timeDelta);
    uint256 expectedTargetRemainingSupply = SUPPLY_CAP - expectedTargetTotalSupply;
    uint256 actualRemainingSupply = (expectedTargetRemainingSupply * 11) / 10;

    vm.deal(
      celoUnreleasedTreasuryAddress,
      actualRemainingSupply + expectedTargetGoldSupplyIncrease
    );
    expectedMultiplier = (FIXED1 + rewardsMultiplierAdjustmentsUnderspend / 10);

    validatorReward = (targetValidatorEpochPayment * NUM_VALIDATORS) / exchangeRate;
    votingReward = (targetVotingYieldParamsInitial * activeVotes) / FIXED1;

    timeTravel(timeDelta);
  }

  function test_ShouldFetchTheExpectedRewardsMultiplier() public {
    assertApproxEqRel(epochRewards.getRewardsMultiplier(), expectedMultiplier, 6e13);
  }

  function test_ShouldReturnTheTargetValidatorEpochPaymentTimesTheRewardsMultiplier() public {
    uint256 expected = (targetValidatorEpochPayment * expectedMultiplier) / FIXED1;
    (uint256 result, , , ) = epochRewards.calculateTargetEpochRewards();
    assertApproxEqRel(result, expected, 1e14);
  }

  function test_ShouldReturnTheTargetYieldTimesTheNumberOfActiveVotesTimesTheRewardsMultiplier()
    public
  {
    uint256 expected = (targetVotingYieldParamsInitial * activeVotes * expectedMultiplier) / 1e48;
    (, uint256 result, , ) = epochRewards.calculateTargetEpochRewards();
    assertApproxEqRel(result, expected, 5e13);
  }

  function test_ShouldReturnTheCorrectAmountForTheCommunityReward() public {
    uint256 expected = (((validatorReward + votingReward)) *
      communityRewardFraction *
      expectedMultiplier) /
      ((FIXED1 - communityRewardFraction - carbonOffsettingFraction) * FIXED1);

    (, , uint256 result, ) = epochRewards.calculateTargetEpochRewards();

    assertApproxEqRel(result, expected, 5e13);
  }

  function test_ShouldReturnTheCorrectAmountForTheCarbonOffsettingFund() public {
    uint256 expected = (((validatorReward + votingReward)) *
      carbonOffsettingFraction *
      expectedMultiplier) /
      ((FIXED1 - communityRewardFraction - carbonOffsettingFraction) * FIXED1);

    (, , , uint256 result) = epochRewards.calculateTargetEpochRewards();
    assertApproxEqRel(result, expected, 5e13);
  }
}

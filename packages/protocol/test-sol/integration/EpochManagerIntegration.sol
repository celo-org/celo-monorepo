// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/EpochManager.sol";

// import "@celo-contracts-8/common/interfaces/ICeloToken.sol";
import "@celo-contracts-8/common/ScoreManager.sol";
import "@celo-contracts-8/common/CeloUnreleasedTreasure.sol";
import "@celo-contracts/common/interfaces/ICeloUnreleasedTreasure.sol";

import { TestConstants } from "@test-sol/constants.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IFreezer.sol";
import "@celo-contracts/governance/interfaces/IEpochRewards.sol";
import "@celo-contracts/governance/interfaces/IEpochRewardsInitializer.sol";

import { ValidatorsMock08 } from "@celo-contracts-8/governance/test/ValidatorsMock.sol";
import { MockElection08 } from "@celo-contracts-8/governance/test/MockElection.sol";
import { MockReserve08 } from "@celo-contracts-8/stability/test/MockReserve.sol";
import { MockStableToken08 } from "@celo-contracts-8/stability/test/MockStableToken.sol";
import { MockCeloToken08 } from "@celo-contracts-8/common/test/MockCeloToken.sol";

contract EpochManagerIntegrationTest is Test, TestConstants, Utils08 {
  EpochManager epochManager;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  MockCeloToken08 celoToken;
  MockReserve08 reserve;

  ValidatorsMock08 validators;
  MockElection08 election;

  address epochManagerInitializer;
  address carbonOffsettingPartner;
  address communityRewardFund;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  address[] firstElected;

  IRegistry registry;
  IEpochRewards epochRewards;
  IEpochRewardsInitializer epochRewardsInitializer;
  IFreezer freezer;
  CeloUnreleasedTreasure celoUnreleasedTreasure;
  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  uint256 constant L1_MINTED_CELO_SUPPLY = 692702432463315819704447326; // as of May 15 2024

  uint256 constant CELO_SUPPLY_CAP = 1000000000 ether; // 1 billion Celo
  uint256 constant GENESIS_CELO_SUPPLY = 600000000 ether; // 600 million Celo

  uint256 constant FIFTEEN_YEAR_LINEAR_REWARD = (CELO_SUPPLY_CAP - GENESIS_CELO_SUPPLY) / 2; // 200 million Celo

  uint256 constant FIFTEEN_YEAR_CELO_SUPPLY = GENESIS_CELO_SUPPLY + FIFTEEN_YEAR_LINEAR_REWARD; // 800 million Celo (includes GENESIS_CELO_SUPPLY)

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY; // 107.2 million Celo

  uint256 constant L2_INITIAL_STASH_BALANCE = FIFTEEN_YEAR_LINEAR_REWARD + MAX_L2_DISTRIBUTION; // leftover from L1 target supply plus the 2nd 15 year term.

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

  function setUp() public virtual {
    epochManager = new EpochManager(true);
    sortedOracles = new MockSortedOracles();

    election = new MockElection08();
    validators = new ValidatorsMock08();
    reserve = new MockReserve08();
    stableToken = new MockStableToken08();
    celoToken = new MockCeloToken08();

    celoUnreleasedTreasure = new CeloUnreleasedTreasure(false);

    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    // address celoTokenAddress = actor("celoTokenAddress");
    address scoreManagerAddress = actor("scoreManagerAddress");
    address epochRewardsAddress = actor("epochRewardsAddress");
    address freezerAddress = actor("freezerAddress");

    epochManagerInitializer = actor("initializer");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    // deployCodeTo("GoldToken.sol", abi.encode(false), celoTokenAddress);
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);
    deployCodeTo("Freezer.sol", abi.encode(false), freezerAddress);
    deployCodeTo("EpochRewards.sol", abi.encode(true), epochRewardsAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
    // celoToken = IERC20(celoTokenAddress);
    epochRewardsInitializer = IEpochRewardsInitializer(epochRewardsAddress);
    epochRewards = IEpochRewards(epochRewardsAddress);
    freezer = IFreezer(freezerAddress);
    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManager));
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(CeloUnreleasedTreasureContract, address(celoUnreleasedTreasure));
    registry.setAddressFor(ReserveContract, address(reserve));
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(FreezerContract, address(freezer));

    celoToken.setTotalSupply(CELO_SUPPLY_CAP);
    vm.deal(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);
    vm.deal(address(reserve), L1_MINTED_CELO_SUPPLY);

    bool res1 = sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    (uint256 res0, uint256 res00) = sortedOracles.medianRate(address(stableToken));

    scoreManager.setValidatorScore(actor("validator1"), 1);
    uint256 res = scoreManager.getValidatorScore(actor("validator1"));

    epochRewardsInitializer.initialize(
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

    uint256 res2 = epochRewards.getCommunityRewardFraction();

    console2.log("### res2", res2);

    epochManager.initialize(
      REGISTRY_ADDRESS,
      DAY,
      carbonOffsettingPartner,
      epochManagerInitializer
    );

    blockTravel(vm, firstEpochBlock);
    // makes sure test know this is L2.
    deployCodeTo("Registry.sol", abi.encode(false), PROXY_ADMIN_ADDRESS);
  }
}

contract EpochManagerIntegrationTest_initialize is EpochManagerIntegrationTest {
  function test_initialize() public virtual {
    assertEq(address(epochManager.registry()), REGISTRY_ADDRESS);
    assertEq(epochManager.epochDuration(), DAY);
    assertEq(epochManager.carbonOffsettingPartner(), carbonOffsettingPartner);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManager.initialize(
      REGISTRY_ADDRESS,
      DAY,
      carbonOffsettingPartner,
      epochManagerInitializer
    );
  }
}

contract EpochManagerIntegrationTest_initializeSystem is EpochManagerIntegrationTest {
  function test_processCanBeStarted() public virtual {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    vm.prank(address(0));
    vm.expectRevert("Epoch system already initialized");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_WhenSystemInitializedByOtherContract() public virtual {
    vm.expectRevert("msg.sender is not Initializer");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }
}

contract EpochManagerIntegrationTest_startNextEpochProcess is EpochManagerIntegrationTest {
  function test_Reverts_whenSystemNotInitialized() public {
    vm.expectRevert("Epoch system not initialized");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    vm.expectRevert("Epoch is not ready to start");
    epochManager.startNextEpochProcess();
  }

  function test_Succeeds() public {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    blockTravel(vm, 43200);
    timeTravel(vm, DAY);
    console2.log("current epoch timestamp", block.timestamp);

    uint256 _currentEpoch = epochManager.currentEpochNumber();
    console2.log("### Current epoch duration:", epochManager.epochDuration());

    epochManager.startNextEpochProcess();

    (, , , uint256 _currentRewardsBlock) = epochManager
      .getCurrentEpoch();

    console2.log("### Done");
    assertEq(_currentRewardsBlock, block.number - 1);
  }
}

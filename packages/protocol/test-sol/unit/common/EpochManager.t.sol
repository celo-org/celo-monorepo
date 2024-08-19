// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/EpochManager.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";
import "@celo-contracts-8/common/interfaces/ICeloToken.sol";
import "@celo-contracts-8/common/ScoreManager.sol";
import "@celo-contracts/common/interfaces/ICeloDistributionSchedule.sol";

import { TestConstants } from "@test-sol/constants.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import { ValidatorsMock08 } from "@celo-contracts-8/governance/test/ValidatorsMock.sol";

contract EpochManagerTest is Test, TestConstants {
  EpochManager epochManager;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  EpochRewardsMock08 epochRewards;
  ValidatorsMock08 validators;

  address epochManagerInitializer;
  address carbonOffsettingPartner;
  address communityRewardFund;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  address[] firstElected;

  IRegistry registry;
  ICeloToken celoToken;
  ICeloDistributionSchedule celoDistributionSchedule;
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

  function setUp() public virtual {
    epochManager = new EpochManager(true);
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = new ValidatorsMock08();
    stableToken = new MockStableToken08();

    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    address celoTokenAddress = actor("celoTokenAddress");
    address celoDistributionScheduleAddress = actor("celoDistributionScheduleAddress");
    address scoreManagerAddress = actor("scoreManagerAddress");
    address reserveAddress = actor("reserve");

    epochManagerInitializer = actor("initializer");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("GoldToken.sol", abi.encode(false), celoTokenAddress);
    deployCodeTo(
      "CeloDistributionSchedule.sol",
      abi.encode(false),
      celoDistributionScheduleAddress
    );
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
    celoToken = ICeloToken(celoTokenAddress);
    celoDistributionSchedule = ICeloDistributionSchedule(celoDistributionScheduleAddress);
    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerInitializerContract, epochManagerInitializer);
    registry.setAddressFor(EpochManagerContract, address(epochManager));
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(CeloDistributionScheduleContract, address(celoDistributionSchedule));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(ReserveContract, reserveAddress);

    vm.deal(address(celoDistributionSchedule), L2_INITIAL_STASH_BALANCE);

    bool res1 = sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    (uint256 res0, uint256 res00) = sortedOracles.medianRate(address(stableToken));

    scoreManager.setValidatorScore(actor("validator1"), 1);
    uint256 res = scoreManager.getValidatorScore(actor("validator1"));
    uint256 res2 = epochRewards.getCommunityRewardFraction();

    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner);
  }
}

contract EpochManagerTest_initialize is EpochManagerTest {
  function test_initialize() public virtual {
    assertEq(address(epochManager.registry()), REGISTRY_ADDRESS);
    assertEq(epochManager.epochDuration(), 10);
    assertEq(epochManager.carbonOffsettingPartner(), carbonOffsettingPartner);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner);
  }
}

contract EpochManagerTest_initializeSystem is EpochManagerTest {
  function test_processCanBeStarted() public virtual {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.startPrank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    vm.expectRevert("Epoch system already initialized");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_WhenSystemInitializedByOtherContract() public virtual {
    vm.expectRevert("msg.sender is not Initializer");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }
}

contract EpochManagerTest_startNextEpochProcess is EpochManagerTest {
  function test_Reverts_whenSystemNotInitialized() public {
    uint256 _currentEpoch = epochManager.currentEpochNumber();
    (, , , uint256 _currentEpochEndTimestamp, ) = epochManager.getCurrentEpoch();

    vm.expectRevert("Elected length must be greater than 0.");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    uint256 _currentEpoch = epochManager.currentEpochNumber();
    (, , , uint256 _currentEpochEndTimestamp, ) = epochManager.getCurrentEpoch();

    vm.expectRevert("Epoch is not ready to start");
    epochManager.startNextEpochProcess();
  }
}

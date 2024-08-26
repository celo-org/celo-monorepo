// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/EpochManager.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";
import "@celo-contracts-8/common/interfaces/ICeloToken.sol";
import "@celo-contracts-8/common/ScoreManager.sol";
import { CeloUnreleasedTreasure } from "@celo-contracts-8/common/CeloUnreleasedTreasure.sol";
import { ICeloUnreleasedTreasure } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasure.sol";

import { TestConstants } from "@test-sol/constants.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import { ValidatorsMock08 } from "@celo-contracts-8/governance/test/ValidatorsMock08.sol";

contract EpochManagerTest is Test, TestConstants, Utils08 {
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
  CeloUnreleasedTreasure celoUnreleasedTreasure;
  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  function setUp() public virtual {
    epochManager = new EpochManager(true);
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = new ValidatorsMock08();
    stableToken = new MockStableToken08();
    celoUnreleasedTreasure = new CeloUnreleasedTreasure(false);

    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    address celoTokenAddress = actor("celoTokenAddress");
    address scoreManagerAddress = actor("scoreManagerAddress");
    address reserveAddress = actor("reserve");

    epochManagerInitializer = actor("initializer");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("GoldToken.sol", abi.encode(false), celoTokenAddress);
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
    celoToken = ICeloToken(celoTokenAddress);
    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManager));
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(CeloUnreleasedTreasureContract, address(celoUnreleasedTreasure));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(ReserveContract, reserveAddress);

    vm.deal(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);

    bool res1 = sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    (uint256 res0, uint256 res00) = sortedOracles.medianRate(address(stableToken));

    scoreManager.setValidatorScore(actor("validator1"), 1);
    uint256 res = scoreManager.getValidatorScore(actor("validator1"));
    uint256 res2 = epochRewards.getCommunityRewardFraction();

    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, epochManagerInitializer);

    blockTravel(vm, firstEpochBlock);
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
    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, epochManagerInitializer);
  }
}

contract EpochManagerTest_initializeSystem is EpochManagerTest {
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

contract EpochManagerTest_startNextEpochProcess is EpochManagerTest {
  function test_Reverts_whenSystemNotInitialized() public {
    vm.expectRevert("Epoch system not initialized");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    uint256 _currentEpoch = epochManager.getCurrentEpochNumber();
    (, , , uint256 _currentEpochEndTimestamp, ) = epochManager.getCurrentEpoch();

    vm.expectRevert("Epoch is not ready to start");
    epochManager.startNextEpochProcess();
  }
}

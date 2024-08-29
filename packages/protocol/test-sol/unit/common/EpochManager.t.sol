// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/EpochManager.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";
import "@celo-contracts-8/common/test/MockCeloToken.sol";
import "@celo-contracts/common/interfaces/ICeloToken.sol";
import "@celo-contracts-8/common/ScoreManager.sol";
import { CeloUnreleasedTreasure } from "@celo-contracts-8/common/CeloUnreleasedTreasure.sol";
import { ICeloUnreleasedTreasure } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasure.sol";

import { TestConstants } from "@test-sol/constants.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import { ValidatorsMock08 } from "@celo-contracts-8/governance/test/ValidatorsMock08.sol";
import { MockCeloUnreleasedTreasure } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasure.sol";

contract EpochManagerTest is Test, TestConstants, Utils08 {
  EpochManager epochManager;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  EpochRewardsMock08 epochRewards;
  ValidatorsMock08 validators;

  address epochManagerEnabler;
  address carbonOffsettingPartner;
  address communityRewardFund;
  address reserveAddress;
  address scoreManagerAddress;
  address nonOwner;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  uint256 epochDuration = DAY;
  address[] firstElected;

  IRegistry registry;
  MockCeloToken08 celoToken;
  MockCeloUnreleasedTreasure celoUnreleasedTreasure;
  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  event EpochProcessingStarted(uint256 indexed epochNumber);

  function setUp() public virtual {
    epochManager = new EpochManager(true);
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = new ValidatorsMock08();
    stableToken = new MockStableToken08();
    celoToken = new MockCeloToken08();
    celoUnreleasedTreasure = new MockCeloUnreleasedTreasure();

    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    scoreManagerAddress = actor("scoreManagerAddress");

    reserveAddress = actor("reserve");

    epochManagerEnabler = actor("epochManagerEnabler");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");
    nonOwner = actor("nonOwner");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);

    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
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

    celoToken.setTotalSupply(CELO_SUPPLY_CAP);
    vm.deal(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);
    celoToken.setBalanceOf(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);

    celoUnreleasedTreasure.setRegistry(REGISTRY_ADDRESS);

    sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);

    scoreManager.setValidatorScore(actor("validator1"), 1);

    epochManager.initialize(
      REGISTRY_ADDRESS,
      epochDuration,
      carbonOffsettingPartner,
      epochManagerEnabler
    );

    blockTravel(vm, firstEpochBlock);
  }

  function initializeEpochManagerSystem() public {
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    blockTravel(vm, 43200);
    timeTravel(vm, DAY);
  }
}

contract EpochManagerTest_initialize is EpochManagerTest {
  function test_initialize() public virtual {
    assertEq(address(epochManager.registry()), REGISTRY_ADDRESS);
    assertEq(epochManager.epochDuration(), epochDuration);
    assertEq(epochManager.carbonOffsettingPartner(), carbonOffsettingPartner);
    assertEq(epochManager.epochManagerEnabler(), epochManagerEnabler);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, epochManagerEnabler);
  }
}

contract EpochManagerTest_initializeSystem is EpochManagerTest {
  function test_processCanBeStarted() public virtual {
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    (
      uint256 _firstEpochBlock,
      uint256 _lastEpochBlock,
      uint256 _startTimestamp,
      uint256 _currentRewardsBlock
    ) = epochManager.getCurrentEpoch();
    assertEq(epochManager.epochManagerEnabler(), address(0));
    assertEq(epochManager.firstKnownEpoch(), firstEpochNumber);
    assertEq(_firstEpochBlock, firstEpochBlock);
    assertEq(_lastEpochBlock, 0);
    assertEq(_startTimestamp, block.timestamp);
    assertEq(_currentRewardsBlock, 0);
    assertEq(epochManager.getElected(), firstElected);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.prank(epochManagerEnabler);
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
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    vm.expectRevert("Epoch is not ready to start");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEpochProcessingAlreadyStarted() public {
    initializeEpochManagerSystem();

    epochManager.startNextEpochProcess();
    vm.expectRevert("Epoch process is already started");
    epochManager.startNextEpochProcess();
  }

  function test_Emits_EpochProcessingStartedEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit EpochProcessingStarted(firstEpochNumber);
    epochManager.startNextEpochProcess();
  }

  function test_SetsTheEpochRewardBlock() public {
    initializeEpochManagerSystem();

    epochManager.startNextEpochProcess();
    (, , , uint256 _currentRewardsBlock) = epochManager.getCurrentEpoch();
    assertEq(_currentRewardsBlock, block.number);
  }

  function test_SetsTheEpochRewardAmounts() public {
    initializeEpochManagerSystem();

    epochManager.startNextEpochProcess();
    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVoter,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManager.getEpochProcessingState();
    assertEq(status, 1);
    assertEq(perValidatorReward, 5);
    assertEq(totalRewardsVoter, 5);
    assertEq(totalRewardsCommunity, 5);
    assertEq(totalRewardsCarbonFund, 5);
  }

  function test_ShouldMintTotalValidatorStableRewardsToEpochManager() public {
    initializeEpochManagerSystem();
    uint256 beforeBalance = stableToken.balanceOf(address(epochManager));
    epochManager.startNextEpochProcess();

    uint256 afterBalance = stableToken.balanceOf(address(epochManager));
    assertEq(afterBalance, 2);
  }

  function test_ShouldReleaseCorrectAmountToReserve() public {
    initializeEpochManagerSystem();
    uint256 reserveBalanceBefore = celoToken.balanceOf(reserveAddress);
    epochManager.startNextEpochProcess();
    uint256 reserveBalanceAfter = celoToken.balanceOf(reserveAddress);
    assertEq(reserveBalanceAfter, reserveBalanceBefore + 4);
  }
}


contract EpochManagerTest_setEpochMangerEnabler is EpochManagerTest {
  function test_setEpochMangerEnabler() public {
    vm.prank(epochManager.owner());
    address newEpochManagerEnabler = actor("newEpochManagerEnabler"); 
    epochManager.setEpochMangerEnabler(newEpochManagerEnabler);
    assertEq(epochManager.epochManagerEnabler(), newEpochManagerEnabler);
  }

  function test_Reverts_WhenNotCalledByEpochManagerEnabler() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    epochManager.setEpochMangerEnabler(actor("newEpochManagerEnabler"));
  }
}

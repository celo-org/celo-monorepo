// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/EpochManager.sol";
import { TestConstants } from "@test-sol/constants.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

contract EpochManagerTest is Test, TestConstants {
  EpochManager epochManager;
  MockSortedOracles sortedOracles;
  address epochManagerInitializer;
  address carbonOffsettingPartner;
  address communityRewardFund;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  address[] firstElected;

  IRegistry registry;

  function setUp() public virtual {
    epochManager = new EpochManager(true);
    sortedOracles = new MockSortedOracles();



    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    epochManagerInitializer = actor("initializer");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    registry = IRegistry(REGISTRY_ADDRESS);

    registry.setAddressFor("EpochManagerInitializer", epochManagerInitializer);
    registry.setAddressFor("SortedOracles", address(sortedOracles));


    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, communityRewardFund);
  }
}

contract EpochManagerInitialize is EpochManagerTest {
  function test_initialize() public virtual {
    assertEq(address(epochManager.registry()), REGISTRY_ADDRESS);
    assertEq(epochManager.epochDuration(), 10);
    assertEq(epochManager.carbonOffsettingPartner(), carbonOffsettingPartner);
    assertEq(epochManager.communityRewardFund(), communityRewardFund);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, communityRewardFund);
  }
}

contract EpochManagerinitializeSystem is EpochManagerTest {

  function test_processCanBeStarted() public virtual{
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

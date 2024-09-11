// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol";

import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@test-sol/utils/ECDSAHelper08.sol";

contract E2E_EpochManager is Test, Devchain, Utils08, ECDSAHelper08 {
  address epochManagerOwner;
  address epochManagerEnabler;
  address[] firstElected;

  uint256 epochDuration;

  struct VoterWithPK {
    address voter;
    uint256 privateKey;
  }

  mapping(address => uint256) addressToPrivateKeys;
  mapping(address => VoterWithPK) validatorToVoter;

  function setUp() public virtual {
    uint256 totalVotes = election.getTotalVotes();

    epochManagerOwner = Ownable(address(epochManager)).owner();
    epochManagerEnabler = epochManager.epochManagerEnabler();
    firstElected = getValidators().getRegisteredValidators();

    epochDuration = epochManager.epochDuration();

    vm.deal(address(celoUnreleasedTreasure), 800_000_000 ether); // 80% of the total supply to the treasure - whis will be yet distributed
  }

  function activateValidators() public {
    uint256[] memory valKeys = new uint256[](2);
    valKeys[0] = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    valKeys[1] = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

    for (uint256 i = 0; i < valKeys.length; i++) {
      address account = vm.addr(valKeys[i]);
      addressToPrivateKeys[account] = valKeys[i];
    }

    address[] memory registeredValidators = getValidators().getRegisteredValidators();
    for (uint256 i = 0; i < registeredValidators.length; i++) {
      (, , address validatorGroup, , ) = getValidators().getValidator(registeredValidators[i]);
      travelEpochL1(vm);
      travelEpochL1(vm);
      travelEpochL1(vm);
      vm.startPrank(validatorGroup);
      election.activate(validatorGroup);
      vm.stopPrank();
    }
  }

  function authorizeVoteSigner(uint256 signerPk, address account) internal {
    bytes32 messageHash = keccak256(abi.encodePacked(account));
    bytes32 prefixedHash = ECDSAHelper08.toEthSignedMessageHash(messageHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, prefixedHash);
    vm.prank(account);
    accounts.authorizeVoteSigner(vm.addr(signerPk), v, r, s);
  }
}

contract E2E_EpochManager_InitializeSystem is E2E_EpochManager {
  function setUp() public override {
    super.setUp();
    whenL2(vm);
  }

  function test_shouldRevert_WhenCalledByNonEnabler() public {
    vm.expectRevert("msg.sender is not Initializer");
    epochManager.initializeSystem(1, 1, firstElected);
  }

  function test_ShouldInitializeSystem() public {
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(42, 43, firstElected);

    assertEq(epochManager.firstKnownEpoch(), 42);
    assertEq(epochManager.getCurrentEpochNumber(), 42);

    (
      uint256 firstBlock,
      uint256 lastBlock,
      uint256 startTimestamp,
      uint256 rewardsBlock
    ) = epochManager.getCurrentEpoch();
    assertEq(firstBlock, 43);
    assertEq(lastBlock, 0);
    assertEq(startTimestamp, block.timestamp);
    assertEq(rewardsBlock, 0);
  }
}

contract E2E_EpochManager_StartNextEpochProcess is E2E_EpochManager {
  function setUp() public override {
    super.setUp();
    activateValidators();
    whenL2(vm);

    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(1, 1, firstElected);
  }

  function test_shouldHaveInitialValues() public {
    assertEq(epochManager.firstKnownEpoch(), 1);
    assertEq(epochManager.getCurrentEpochNumber(), 1);

    // get getEpochProcessingState
    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVote,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManager.getEpochProcessingState();
    assertEq(status, 0); // Not started
    assertEq(perValidatorReward, 0);
    assertEq(totalRewardsVote, 0);
    assertEq(totalRewardsCommunity, 0);
    assertEq(totalRewardsCarbonFund, 0);
  }

  function test_shouldStartNextEpochProcessing() public {
    timeTravel(vm, epochDuration + 1);

    epochManager.startNextEpochProcess();

    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVote,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManager.getEpochProcessingState();
    assertEq(status, 1); // Started
    assertGt(perValidatorReward, 0, "perValidatorReward");
    assertGt(totalRewardsVote, 0, "totalRewardsVote");
    assertGt(totalRewardsCommunity, 0, "totalRewardsCommunity");
    assertGt(totalRewardsCarbonFund, 0, "totalRewardsCarbonFund");
  }
}

contract E2E_EpochManager_FinishNextEpochProcess is E2E_EpochManager {
  address[] groups;

  function setUp() public override {
    super.setUp();
    activateValidators();
    whenL2(vm);

    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(1, 1, firstElected);

    timeTravel(vm, epochDuration + 1);
    epochManager.startNextEpochProcess();

    groups = getValidators().getRegisteredValidatorGroups();

    vm.prank(scoreManager.owner());
    scoreManager.setGroupScore(groups[0], 1e24);
  }

  function test_shouldFinishNextEpochProcessing() public {
    uint256[] memory groupActiveBalances = new uint256[](groups.length);
    for (uint256 i = 0; i < groups.length; i++) {
      groupActiveBalances[i] = election.getActiveVotesForGroup(groups[i]);
    }

    address[] memory lessers = new address[](1);
    lessers[0] = address(0);

    address[] memory greaters = new address[](1);
    greaters[0] = address(0);

    uint256 currentEpoch = epochManager.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManager.getElected();

    epochManager.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(currentEpoch + 1, epochManager.getCurrentEpochNumber());

    address[] memory newlyElected = epochManager.getElected();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(currentlyElected[i], newlyElected[i]);
    }

    for (uint256 i = 0; i < groups.length; i++) {
      assertGt(election.getActiveVotesForGroup(groups[i]), groupActiveBalances[i]);
    }
  }
}

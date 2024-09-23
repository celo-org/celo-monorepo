// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol";

import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@test-sol/utils/ECDSAHelper08.sol";
import "@openzeppelin/contracts8/utils/structs/EnumerableSet.sol";

contract E2E_EpochManager is Test, Devchain, Utils08, ECDSAHelper08 {
  struct VoterWithPK {
    address voter;
    uint256 privateKey;
  }

  struct GroupWithVotes {
    address group;
    uint256 votes;
  }

  address epochManagerOwner;
  address epochManagerEnabler;
  address[] firstElected;

  uint256 epochDuration;

  address[] groups;
  address[] validatorsArray;

  uint256[] groupScore = [5e23, 7e23, 1e24, 4e23];
  uint256[] validatorScore = [1e23, 1e23, 1e23, 1e23, 1e23, 1e23, 1e23];

  mapping(address => uint256) addressToPrivateKeys;
  mapping(address => VoterWithPK) validatorToVoter;

  function setUp() public virtual {
    uint256 totalVotes = election.getTotalVotes();

    epochManagerOwner = Ownable(address(epochManager)).owner();
    epochManagerEnabler = registry.getAddressForOrDie(EPOCH_MANAGER_ENABLER_REGISTRY_ID);
    firstElected = getValidators().getRegisteredValidators();

    epochDuration = epochManager.epochDuration();

    vm.deal(address(celoUnreleasedTreasure), 800_000_000 ether); // 80% of the total supply to the treasure - whis will be yet distributed
  }

  function activateValidators() public {
    uint256[] memory valKeys = new uint256[](9);
    valKeys[0] = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    valKeys[1] = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    valKeys[2] = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    valKeys[3] = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
    valKeys[4] = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;
    valKeys[5] = 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e;
    valKeys[6] = 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356;
    valKeys[7] = 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97;
    valKeys[8] = 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6;

    for (uint256 i = 0; i < valKeys.length; i++) {
      address account = vm.addr(valKeys[i]);
      addressToPrivateKeys[account] = valKeys[i];
    }

    address[] memory registeredValidators = getValidators().getRegisteredValidators();
    travelEpochL1(vm);
    travelEpochL1(vm);
    travelEpochL1(vm);
    travelEpochL1(vm);
    for (uint256 i = 0; i < registeredValidators.length; i++) {
      (, , address validatorGroup, , ) = getValidators().getValidator(registeredValidators[i]);
      if (getElection().getPendingVotesForGroup(validatorGroup) == 0) {
        continue;
      }
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
    vm.expectRevert("msg.sender is not Enabler");
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

    validatorsArray = getValidators().getRegisteredValidators();
    groups = getValidators().getRegisteredValidatorGroups();

    address scoreManagerOwner = scoreManager.owner();

    vm.startPrank(scoreManagerOwner);
    scoreManager.setGroupScore(groups[0], groupScore[0]);
    scoreManager.setGroupScore(groups[1], groupScore[1]);
    scoreManager.setGroupScore(groups[2], groupScore[2]);

    scoreManager.setValidatorScore(validatorsArray[0], validatorScore[0]);
    scoreManager.setValidatorScore(validatorsArray[1], validatorScore[1]);
    scoreManager.setValidatorScore(validatorsArray[2], validatorScore[2]);
    scoreManager.setValidatorScore(validatorsArray[3], validatorScore[3]);
    scoreManager.setValidatorScore(validatorsArray[4], validatorScore[4]);
    scoreManager.setValidatorScore(validatorsArray[5], validatorScore[5]);

    vm.stopPrank();

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
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet internal originalyElected;

  function setUp() public override {
    super.setUp();
    activateValidators();
    whenL2(vm);

    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(1, 1, firstElected);

    validatorsArray = getValidators().getRegisteredValidators();
    groups = getValidators().getRegisteredValidatorGroups();

    address scoreManagerOwner = scoreManager.owner();

    vm.startPrank(scoreManagerOwner);
    scoreManager.setGroupScore(groups[0], groupScore[0]);
    scoreManager.setGroupScore(groups[1], groupScore[1]);
    scoreManager.setGroupScore(groups[2], groupScore[2]);

    scoreManager.setValidatorScore(validatorsArray[0], validatorScore[0]);
    scoreManager.setValidatorScore(validatorsArray[1], validatorScore[1]);
    scoreManager.setValidatorScore(validatorsArray[2], validatorScore[2]);
    scoreManager.setValidatorScore(validatorsArray[3], validatorScore[3]);
    scoreManager.setValidatorScore(validatorsArray[4], validatorScore[4]);
    scoreManager.setValidatorScore(validatorsArray[5], validatorScore[5]);

    vm.stopPrank();

    timeTravel(vm, epochDuration + 1);
    epochManager.startNextEpochProcess();
  }

  function assertGroupWithVotes(GroupWithVotes[] memory groupWithVotes) internal {
    for (uint256 i = 0; i < groupWithVotes.length; i++) {
      uint256 expected = election.getTotalVotesForGroup(groupWithVotes[i].group);
      assertEq(election.getTotalVotesForGroup(groupWithVotes[i].group), groupWithVotes[i].votes);
    }
  }

  function test_shouldFinishNextEpochProcessing() public {
    address[] memory lessers;
    address[] memory greaters;
    address[] memory groupsEligible;
    GroupWithVotes[] memory groupWithVotes;
    uint256[] memory groupActiveBalances;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    uint256 currentEpoch = epochManager.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManager.getElected();
    for (uint256 i = 0; i < currentlyElected.length; i++) {
      originalyElected.add(currentlyElected[i]);
    }

    // wait some time before finishing
    timeTravel(vm, epochDuration / 2);
    blockTravel(vm, 100);

    epochManager.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(currentEpoch + 1, epochManager.getCurrentEpochNumber());

    address[] memory newlyElected = epochManager.getElected();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(currentlyElected[i]), true);
    }

    timeTravel(vm, epochDuration + 1);
    epochManager.startNextEpochProcess();

    // wait some time before finishing
    timeTravel(vm, epochDuration / 2);
    blockTravel(vm, 100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManager.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(currentEpoch + 2, epochManager.getCurrentEpochNumber());

    address[] memory newlyElected2 = epochManager.getElected();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(newlyElected2[i]), true);
    }

    // add new validator group and validator
    (address newValidatorGroup, address newValidator) = registerNewValidatorGroupWithValidator();

    timeTravel(vm, epochDuration + 1);
    epochManager.startNextEpochProcess();

    timeTravel(vm, epochDuration / 2);
    blockTravel(vm, 100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManager.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    groups.push(newValidatorGroup);
    validatorsArray.push(newValidator);

    assertEq(epochManager.getElected().length, validators.getRegisteredValidators().length);
    assertEq(groups.length, validators.getRegisteredValidatorGroups().length);

    timeTravel(vm, epochDuration + 1);
    epochManager.startNextEpochProcess();
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManager.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(epochManager.getElected().length, validatorsArray.length);

    // lower the number of electable validators
    vm.prank(election.owner());
    election.setElectableValidators(1, validatorsArray.length - 1);

    timeTravel(vm, epochDuration + 1);
    epochManager.startNextEpochProcess();
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManager.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(epochManager.getElected().length, validatorsArray.length - 1);
  }

  function registerNewValidatorGroupWithValidator()
    internal
    returns (address newValidatorGroup, address newValidator)
  {
    (, GroupWithVotes[] memory groupWithVotes) = getGroupsWithVotes();
    uint256 newGroupPK = uint256(keccak256(abi.encodePacked("newGroup")));
    uint256 newValidatorPK = uint256(keccak256(abi.encodePacked("newValidator")));

    vm.deal(vm.addr(newGroupPK), 100_000_000 ether);
    vm.deal(vm.addr(newValidatorPK), 100_000_000 ether);

    (uint256 validatorLockedGoldRequirement, ) = validators.getValidatorLockedGoldRequirements();
    (uint256 groupLockedGoldRequirement, ) = validators.getGroupLockedGoldRequirements();

    newValidatorGroup = registerValidatorGroup(
      "newGroup",
      newGroupPK,
      groupLockedGoldRequirement,
      100000000000000000000000
    );
    newValidator = registerValidator(
      newValidatorPK,
      validatorLockedGoldRequirement,
      newValidatorGroup
    );
    vm.prank(newValidatorGroup);
    validators.addFirstMember(newValidator, address(0), groupWithVotes[0].group);
    uint256 nonVotingLockedGold = lockedCelo.getAccountNonvotingLockedGold(newValidator);
    vm.prank(newValidatorGroup);
    election.vote(newValidatorGroup, nonVotingLockedGold, address(0), groupWithVotes[0].group);

    vm.startPrank(scoreManager.owner());
    scoreManager.setGroupScore(newValidatorGroup, groupScore[3]);
    scoreManager.setValidatorScore(newValidator, validatorScore[6]);
    vm.stopPrank();
  }

  function getGroupsWithVotes()
    internal
    returns (address[] memory groupsInOrder, GroupWithVotes[] memory groupWithVotes)
  {
    uint256[] memory votesTotal;
    (groupsInOrder, votesTotal) = election.getTotalVotesForEligibleValidatorGroups();

    groupWithVotes = new GroupWithVotes[](groupsInOrder.length);
    for (uint256 i = 0; i < groupsInOrder.length; i++) {
      groupWithVotes[i] = GroupWithVotes(groupsInOrder[i], votesTotal[i]);
    }
  }

  function getValidatorGroupsFromElected() internal returns (address[] memory) {
    address[] memory elected = epochManager.getElected();
    address[] memory validatorGroups = new address[](elected.length);
    for (uint256 i = 0; i < elected.length; i++) {
      (, , address group, , ) = validators.getValidator(elected[i]);
      validatorGroups[i] = group;
    }
    return validatorGroups;
  }

  function getLessersAndGreaters(
    address[] memory groups
  )
    private
    returns (
      address[] memory lessers,
      address[] memory greaters,
      GroupWithVotes[] memory groupWithVotes
    )
  {
    (, , uint256 maxTotalRewards, , ) = epochManager.getEpochProcessingState();
    uint256 totalRewards = 0;

    (, groupWithVotes) = getGroupsWithVotes();

    lessers = new address[](groups.length);
    greaters = new address[](groups.length);

    uint256[] memory rewards = new uint256[](groups.length);

    for (uint256 i = 0; i < groups.length; i++) {
      uint256 groupScore = scoreManager.getGroupScore(groups[i]);
      rewards[i] = election.getGroupEpochRewardsBasedOnScore(
        groups[i],
        maxTotalRewards,
        groupScore
      );
    }
    for (uint256 i = 0; i < groups.length; i++) {
      uint256 rewards = rewards[i];

      for (uint256 j = 0; j < groupWithVotes.length; j++) {
        if (groupWithVotes[j].group == groups[i]) {
          groupWithVotes[j].votes += rewards;
          break;
        }
      }
      sort(groupWithVotes);

      address lesser = address(0);
      address greater = address(0);

      for (uint256 j = 0; j < groupWithVotes.length; j++) {
        if (groupWithVotes[j].group == groups[i]) {
          greater = j == 0 ? address(0) : groupWithVotes[j - 1].group;
          lesser = j == groupWithVotes.length - 1 ? address(0) : groupWithVotes[j + 1].group;
          break;
        }
      }

      lessers[i] = lesser;
      greaters[i] = greater;
    }
  }

  function registerValidatorGroup(
    string memory groupName,
    uint256 privateKey,
    uint256 amountToLock,
    uint256 commission
  ) public returns (address accountAddress) {
    accountAddress = vm.addr(privateKey);
    vm.startPrank(accountAddress);
    lockGold(amountToLock);
    getAccounts().setName(groupName);
    getValidators().registerValidatorGroup(commission);
    vm.stopPrank();
  }

  function registerValidator(
    uint256 privateKey,
    uint256 amountToLock,
    address groupToAffiliate
  ) public returns (address) {
    address accountAddress = vm.addr(privateKey);
    vm.startPrank(accountAddress);
    lockGold(amountToLock);

    (bytes memory ecdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(accountAddress, privateKey);
    getValidators().registerValidatorNoBls(ecdsaPubKey);
    getValidators().affiliate(groupToAffiliate);

    vm.stopPrank();
    return accountAddress;
  }

  function _generateEcdsaPubKeyWithSigner(
    address _validator,
    uint256 _signerPk
  ) internal returns (bytes memory ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) {
    (v, r, s) = getParsedSignatureOfAddress(_validator, _signerPk);

    bytes32 addressHash = keccak256(abi.encodePacked(_validator));
    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function lockGold(uint256 value) public {
    getAccounts().createAccount();
    getLockedGold().lock{ value: value }();
  }

  // Bubble sort algorithm since it is a small array
  function sort(GroupWithVotes[] memory items) public {
    uint length = items.length;
    for (uint i = 0; i < length; i++) {
      for (uint j = 0; j < length - 1; j++) {
        if (items[j].votes < items[j + 1].votes) {
          // Swap
          GroupWithVotes memory temp = items[j];
          items[j] = items[j + 1];
          items[j + 1] = temp;
        }
      }
    }
  }
}

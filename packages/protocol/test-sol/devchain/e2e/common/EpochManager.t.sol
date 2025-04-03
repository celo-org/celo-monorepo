// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { Devchain } from "@test-sol/devchain/e2e/utils.sol";

import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@test-sol/utils/ECDSAHelper08.sol";
import "@openzeppelin/contracts8/utils/structs/EnumerableSet.sol";
import { console } from "forge-std-8/console.sol";

import { Validators } from "@celo-contracts-8/governance/Validators.sol";
import { EpochManagerEnabler } from "@celo-contracts-8/common/EpochManagerEnabler.sol";

contract E2E_EpochManager is ECDSAHelper08, Devchain {
  using EnumerableSet for EnumerableSet.AddressSet;

  struct VoterWithPK {
    address voter;
    uint256 privateKey;
  }

  struct GroupWithVotes {
    address group;
    uint256 votes;
  }

  address epochManagerOwner;
  address epochManagerEnablerAddress;
  address[] firstElected;

  uint256 epochDuration;

  address[] groups;
  address[] validatorsArray;

  uint256[] groupScore = [5e23, 7e23, 1e24, 4e23];
  uint256[] validatorScore = [1e23, 1e23, 1e23, 1e23, 1e23, 1e23, 1e23];

  mapping(address => uint256) addressToPrivateKeys;
  mapping(address => VoterWithPK) validatorToVoter;

  EnumerableSet.AddressSet internal electedGroupsHelper;

  function setUp() public virtual override(TestWithUtils08, Devchain) {
    epochManagerOwner = Ownable(address(epochManagerContract)).owner();
    epochManagerEnablerAddress = registryContract.getAddressForOrDie(
      EPOCH_MANAGER_ENABLER_REGISTRY_ID
    );
    firstElected = getValidators().getRegisteredValidators();

    epochDuration = epochManagerContract.epochDuration();

    vm.deal(address(celoUnreleasedTreasuryContract), L2_INITIAL_STASH_BALANCE); // 80% of the total supply to the treasury - whis will be yet distributed
    vm.prank(address(0));
    celoTokenContract.mint(address(celoUnreleasedTreasuryContract), L2_INITIAL_STASH_BALANCE);
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
    travelNEpochL1(4);

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

  function getLessersAndGreaters(
    address[] memory _groups
  )
    internal
    view
    returns (
      address[] memory lessers,
      address[] memory greaters,
      GroupWithVotes[] memory groupWithVotes
    )
  {
    (, , uint256 maxTotalRewards, , ) = epochManagerContract.getEpochProcessingState();
    (, groupWithVotes) = getGroupsWithVotes();

    lessers = new address[](_groups.length);
    greaters = new address[](_groups.length);

    uint256[] memory rewards = new uint256[](_groups.length);

    for (uint256 i = 0; i < _groups.length; i++) {
      uint256 _groupScore = scoreManager.getGroupScore(_groups[i]);
      rewards[i] = election.getGroupEpochRewardsBasedOnScore(
        _groups[i],
        maxTotalRewards,
        _groupScore
      );
    }
    for (uint256 i = 0; i < _groups.length; i++) {
      for (uint256 j = 0; j < groupWithVotes.length; j++) {
        if (groupWithVotes[j].group == _groups[i]) {
          groupWithVotes[j].votes += rewards[i];
          break;
        }
      }
      sort(groupWithVotes);

      address lesser = address(0);
      address greater = address(0);

      for (uint256 j = 0; j < groupWithVotes.length; j++) {
        if (groupWithVotes[j].group == _groups[i]) {
          greater = j == 0 ? address(0) : groupWithVotes[j - 1].group;
          lesser = j == groupWithVotes.length - 1 ? address(0) : groupWithVotes[j + 1].group;
          break;
        }
      }

      lessers[i] = lesser;
      greaters[i] = greater;
    }
  }

  function getGroupsWithVotes()
    internal
    view
    returns (address[] memory groupsInOrder, GroupWithVotes[] memory groupWithVotes)
  {
    uint256[] memory votesTotal;
    (groupsInOrder, votesTotal) = election.getTotalVotesForEligibleValidatorGroups();

    groupWithVotes = new GroupWithVotes[](groupsInOrder.length);
    for (uint256 i = 0; i < groupsInOrder.length; i++) {
      groupWithVotes[i] = GroupWithVotes(groupsInOrder[i], votesTotal[i]);
    }
  }

  // Bubble sort algorithm since it is a small array
  function sort(GroupWithVotes[] memory items) internal pure {
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

  function assertGroupWithVotes(GroupWithVotes[] memory groupWithVotes) internal {
    for (uint256 i = 0; i < groupWithVotes.length; i++) {
      assertEq(election.getTotalVotesForGroup(groupWithVotes[i].group), groupWithVotes[i].votes, "assertGroupWithVotes");
    }
  }

  function registerNewValidatorGroupWithValidator(
    uint256 index,
    uint256 validatorCount
  ) internal returns (address newValidatorGroup, address newValidator) {
    require(validatorCount > 0, "validatorCount must be at least 1");
    (, GroupWithVotes[] memory groupWithVotes) = getGroupsWithVotes();
    uint256 newGroupPK = uint256(keccak256(abi.encodePacked("newGroup", index + 1)));

    address[] memory validatorAddresses = new address[](validatorCount);

    (uint256 validatorLockedGoldRequirement, ) = validators.getValidatorLockedGoldRequirements();
    (uint256 groupLockedGoldRequirement, ) = validators.getGroupLockedGoldRequirements();

    vm.deal(vm.addr(newGroupPK), 100_000_000 ether);

    newValidatorGroup = registerValidatorGroup(
      "newGroup",
      newGroupPK,
      groupLockedGoldRequirement + validatorCount * validatorLockedGoldRequirement,
      100000000000000000000000
    );

    for (uint256 i = 0; i < validatorCount; i++) {
      uint256 newValidatorPK = uint256(keccak256(abi.encodePacked("newValidator", index, i + 1)));
      validatorAddresses[i] = vm.addr(newValidatorPK);
      vm.deal(vm.addr(newValidatorPK), 100_000_000 ether);

      newValidator = registerValidator(
        newValidatorPK,
        validatorLockedGoldRequirement,
        newValidatorGroup
      );

      vm.prank(scoreManager.owner());
      scoreManager.setValidatorScore(validatorAddresses[i], validatorScore[6]);
    }

    vm.prank(newValidatorGroup);
    validators.addFirstMember(validatorAddresses[0], address(0), groupWithVotes[0].group);
    uint256 nonVotingLockedGold = lockedCelo.getAccountNonvotingLockedGold(validatorAddresses[0]);
    vm.prank(newValidatorGroup);
    election.vote(newValidatorGroup, nonVotingLockedGold, address(0), groupWithVotes[0].group);

    for (uint256 i = 1; i < validatorAddresses.length; i++) {
      vm.prank(validatorAddresses[i]);
      validators.affiliate(newValidatorGroup);
      vm.prank(newValidatorGroup);
      validators.addMember(validatorAddresses[i]);
    }

    vm.prank(scoreManager.owner());
    scoreManager.setGroupScore(newValidatorGroup, groupScore[3]);
  }

  function getValidatorGroupsFromElected() internal view returns (address[] memory) {
    address[] memory elected = epochManagerContract.getElectedAccounts();
    address[] memory validatorGroups = new address[](elected.length);
    for (uint256 i = 0; i < elected.length; i++) {
      (, , address group, , ) = validators.getValidator(elected[i]);
      validatorGroups[i] = group;
    }
    return validatorGroups;
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

  function getCurrentlyElectedGroups() internal returns (address[] memory) {
    address[] memory currentlyElected = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      (, , address group, , ) = validators.getValidator(currentlyElected[i]);
      electedGroupsHelper.add(group);
    }
    return electedGroupsHelper.values();
  }
}

contract E2E_EpochManager_InitializeSystem is E2E_EpochManager {
  function setUp() public override {
    super.setUp();
    whenL2();
  }

  function test_shouldRevert_WhenCalledByNonEnabler() public {
    vm.expectRevert("msg.sender is not Enabler");
    epochManagerContract.initializeSystem(1, 1, firstElected);
  }

  function test_ShouldInitializeSystem() public {
    vm.prank(epochManagerEnablerAddress);
    epochManagerContract.initializeSystem(42, 43, firstElected);

    assertEq(epochManagerContract.firstKnownEpoch(), 42);
    assertEq(epochManagerContract.getCurrentEpochNumber(), 42);

    assertTrue(epochManagerContract.systemAlreadyInitialized());
  }
}
contract E2E_EpochManager_GetCurrentEpoch is E2E_EpochManager {
  function setUp() public override {
    super.setUp();
    whenL2();
  }

  function test_Revert_WhenSystemNotInitialized() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getCurrentEpoch();
  }

  function test_ReturnExpectedValues() public {
    vm.prank(epochManagerEnablerAddress);
    epochManagerContract.initializeSystem(42, 43, firstElected);

    assertEq(epochManagerContract.firstKnownEpoch(), 42);
    assertEq(epochManagerContract.getCurrentEpochNumber(), 42);

    (
      uint256 firstBlock,
      uint256 lastBlock,
      uint256 startTimestamp,
      uint256 rewardsBlock
    ) = epochManagerContract.getCurrentEpoch();
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
    whenL2();

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

    vm.prank(epochManagerEnablerAddress);
    epochManagerContract.initializeSystem(1, 1, firstElected);
  }

  function test_shouldHaveInitialValues() public {
    assertEq(epochManagerContract.firstKnownEpoch(), 1);
    assertEq(epochManagerContract.getCurrentEpochNumber(), 1);

    // get getEpochProcessingState
    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVote,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManagerContract.getEpochProcessingState();
    assertEq(status, 0); // Not started
    assertEq(perValidatorReward, 0);
    assertEq(totalRewardsVote, 0);
    assertEq(totalRewardsCommunity, 0);
    assertEq(totalRewardsCarbonFund, 0);
  }

  function test_shouldStartNextEpochProcessing() public {
    timeTravel(epochDuration + 1);

    epochManagerContract.startNextEpochProcess();

    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVote,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManagerContract.getEpochProcessingState();
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

    EpochManagerEnabler epochManagerEnabler = EpochManagerEnabler(epochManagerEnablerAddress);
    epochManagerEnabler.captureEpochAndValidators();

    whenL2();

    epochManagerEnabler.initEpochManager();

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

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();
  }

  function test_shouldFinishNextEpochProcessing() public {
    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    uint256 currentEpoch = epochManagerContract.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManagerContract.getElectedAccounts();
    for (uint256 i = 0; i < currentlyElected.length; i++) {
      originalyElected.add(currentlyElected[i]);
    }

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(currentEpoch + 1, epochManagerContract.getCurrentEpochNumber());

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(currentlyElected[i]), true);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(currentEpoch + 2, epochManagerContract.getCurrentEpochNumber());

    address[] memory newlyElected2 = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(newlyElected2[i]), true);
    }

    // add new validator group and validator
    (address newValidatorGroup, address newValidator) = registerNewValidatorGroupWithValidator(
      0,
      1
    );

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    groups.push(newValidatorGroup);
    validatorsArray.push(newValidator);

    assertEq(
      epochManagerContract.getElectedAccounts().length,
      validators.getRegisteredValidators().length
    );
    assertEq(groups.length, validators.getRegisteredValidatorGroups().length);

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(epochManagerContract.getElectedAccounts().length, validatorsArray.length);

    // lower the number of electable validators
    vm.prank(election.owner());
    election.setElectableValidators(1, validatorsArray.length - 1);

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    (
      ,
      uint256 perValidatorReward,
      uint256 totalRewardsVoter,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManagerContract.getEpochProcessingState();

    assertEq(perValidatorReward, 0, "perValidatorReward");
    assertEq(totalRewardsVoter, 0, "totalRewardsVoter");
    assertEq(totalRewardsCommunity, 0, "totalRewardsCommunity");
    assertEq(totalRewardsCarbonFund, 0, "totalRewardsCarbonFund");

    assertEq(epochManagerContract.getElectedAccounts().length, validatorsArray.length - 1);
  }

  function test_shouldFinishNextEpochProcessing_WhenValidatorDeaffiliatesBeforeStart() public {
    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    uint256 currentEpoch = epochManagerContract.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManagerContract.getElectedAccounts();
    for (uint256 i = 0; i < currentlyElected.length; i++) {
      originalyElected.add(currentlyElected[i]);
    }

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(currentEpoch + 1, epochManagerContract.getCurrentEpochNumber());

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(currentlyElected[i]), true);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(currentEpoch + 2, epochManagerContract.getCurrentEpochNumber());

    address[] memory newlyElected2 = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(newlyElected2[i]), true);
    }

    // add new validator group and validator
    (address newValidatorGroup, address newValidator) = registerNewValidatorGroupWithValidator(
      0,
      1
    );

    vm.prank(currentlyElected[0]);
    console.log("deaffiliate");
    validators.deaffiliate();

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    groups.push(newValidatorGroup);
    validatorsArray.push(newValidator);

    assertEq(
      epochManagerContract.getElectedAccounts().length,
      validators.getRegisteredValidators().length - 1 // -1 because the validator deaffiliated
    );
    assertEq(groups.length, validators.getRegisteredValidatorGroups().length ); 

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(epochManagerContract.getElectedAccounts().length, validatorsArray.length - 1); // -1 because the validator deaffiliated

  }

  function test_shouldFinishNextEpochProcessing_WhenValidatorDeaffiliatesBeforeFinish() public {
    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    uint256 currentEpoch = epochManagerContract.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManagerContract.getElectedAccounts();
    for (uint256 i = 0; i < currentlyElected.length; i++) {
      originalyElected.add(currentlyElected[i]);
    }

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(currentEpoch + 1, epochManagerContract.getCurrentEpochNumber());

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(currentlyElected[i]), true);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(currentEpoch + 2, epochManagerContract.getCurrentEpochNumber());

    address[] memory newlyElected2 = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(newlyElected2[i]), true);
    }

    // add new validator group and validator
    (address newValidatorGroup, address newValidator) = registerNewValidatorGroupWithValidator(
      0,
      1
    );

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    vm.prank(currentlyElected[0]);
    validators.deaffiliate();

    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    groups.push(newValidatorGroup);
    validatorsArray.push(newValidator);

    assertEq(
      epochManagerContract.getElectedAccounts().length,
      validators.getRegisteredValidators().length - 1 // -1 because the validator deaffiliated
    , "getElectedAccounts != getRegisteredValidators");
    assertEq(groups.length, validators.getRegisteredValidatorGroups().length, "groups != registeredValidatorGroups");

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(epochManagerContract.getElectedAccounts().length, validatorsArray.length - 1); // -1 because the validator deaffiliated
  }

  function clearElectedGroupsHelper() internal {
    address[] memory values = electedGroupsHelper.values();

    for (uint256 i = 0; i < values.length; i++) {
      electedGroupsHelper.remove(values[i]);
    }
  }
}

contract E2E_GasTest_Setup is E2E_EpochManager {
  using EnumerableSet for EnumerableSet.AddressSet;
  EnumerableSet.AddressSet internal originalyElected;

  function setUpHelper(uint256 validatorGroupCount, uint256 validatorPerGroupCount) internal {
    activateValidators();
    whenL2();

    vm.prank(epochManagerEnablerAddress);
    epochManagerContract.initializeSystem(1, 1, firstElected);

    validatorsArray = getValidators().getRegisteredValidators();
    groups = getValidators().getRegisteredValidatorGroups();

    vm.startPrank(scoreManager.owner());
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

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    uint256 currentEpoch = epochManagerContract.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManagerContract.getElectedAccounts();
    for (uint256 i = 0; i < currentlyElected.length; i++) {
      originalyElected.add(currentlyElected[i]);
    }

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(currentEpoch + 1, epochManagerContract.getCurrentEpochNumber());

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(currentlyElected[i]), true);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    assertGroupWithVotes(groupWithVotes);

    assertEq(currentEpoch + 2, epochManagerContract.getCurrentEpochNumber());

    address[] memory newlyElected2 = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(newlyElected2[i]), true);
    }

    for (uint256 i = 0; i < validatorGroupCount; i++) {
      registerNewValidatorGroupWithValidator(i, validatorPerGroupCount);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    activateValidators();

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    groups = getCurrentlyElectedGroups();

    timeTravel(epochDuration / 2);
    blockTravel(100);
  }
}

contract E2E_GasTest1_FinishNextEpochProcess is E2E_GasTest_Setup {
  function setUp() public override {
    super.setUp();
    super.setUpHelper(120, 2);
  }

  /**
    * @notice Test the gas used by finishNextEpochProcess
    This test is trying to measure gas used by finishNextEpochProcess in a real life worst case. We have 126 validators and 123 groups.
    There are two main loops in the function, one for calculating rewards and the other for updating the elected validators.
    FinishNextEpochProcess is called twice, first time with going from 6 -> 110 validators which consumes approx. 6M gas and the second time with going from 110 -> 110 validators which consumes approx. 19M gas. 
     */
  function test_shouldFinishNextEpochProcessing_GasTest() public {
    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    uint256 gasLeftBefore1 = gasleft();
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    uint256 gasLeftAfter1 = gasleft();
    console.log("validator groups: 120");
    console.log("validators per group: 2");
    console.log("finishNextEpochProcess gas used 2: ", gasLeftBefore1 - gasLeftAfter1);
    console.log("elected count2: ", epochManagerContract.getElectedAccounts().length);
  }
}

contract E2E_GasTest2_FinishNextEpochProcess is E2E_GasTest_Setup {
  function setUp() public override {
    super.setUp();
    super.setUpHelper(60, 2);
  }

  /**
    * @notice Test the gas used by finishNextEpochProcess
    This test is trying to measure gas used by finishNextEpochProcess in a real life worst case. We have 126 validators and 123 groups.
    There are two main loops in the function, one for calculating rewards and the other for updating the elected validators.
    FinishNextEpochProcess is called twice, first time with going from 6 -> 110 validators which consumes approx. 6M gas and the second time with going from 110 -> 110 validators which consumes approx. 19M gas. 
     */
  function test_shouldFinishNextEpochProcessing_GasTest() public {
    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    uint256 gasLeftBefore1 = gasleft();
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    uint256 gasLeftAfter1 = gasleft();
    console.log("validator groups: 60");
    console.log("validators per group: 2");
    console.log("finishNextEpochProcess gas used 2: ", gasLeftBefore1 - gasLeftAfter1);
    console.log("elected count2: ", epochManagerContract.getElectedAccounts().length);
  }
}

contract E2E_FinishNextEpochProcess_Split is E2E_GasTest_Setup {
  using EnumerableSet for EnumerableSet.AddressSet;

  function setUp() public override {
    super.setUp();

    activateValidators();
    whenL2();

    vm.prank(epochManagerEnablerAddress);
    epochManagerContract.initializeSystem(1, 1, firstElected);

    validatorsArray = getValidators().getRegisteredValidators();
    groups = getValidators().getRegisteredValidatorGroups();

    vm.startPrank(scoreManager.owner());
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

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    uint256 currentEpoch = epochManagerContract.getCurrentEpochNumber();
    address[] memory currentlyElected = epochManagerContract.getElectedAccounts();
    for (uint256 i = 0; i < currentlyElected.length; i++) {
      originalyElected.add(currentlyElected[i]);
    }

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    epochManagerContract.setToProcessGroups();
    for (uint256 i = 0; i < groups.length; i++) {
      epochManagerContract.processGroup(groups[i], lessers[i], greaters[i]);
    }

    assertEq(currentEpoch + 1, epochManagerContract.getCurrentEpochNumber());

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(currentlyElected[i]), true);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    // wait some time before finishing
    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.setToProcessGroups();
    for (uint256 i = 0; i < groups.length; i++) {
      epochManagerContract.processGroup(groups[i], lessers[i], greaters[i]);
    }
    assertGroupWithVotes(groupWithVotes);

    assertEq(currentEpoch + 2, epochManagerContract.getCurrentEpochNumber());

    address[] memory newlyElected2 = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < currentlyElected.length; i++) {
      assertEq(originalyElected.contains(newlyElected2[i]), true);
    }
    uint256 validatorGroupCount = 60;
    uint256 validatorPerGroupCount = 2;

    for (uint256 i = 0; i < validatorGroupCount; i++) {
      registerNewValidatorGroupWithValidator(i, validatorPerGroupCount);
    }

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    timeTravel(epochDuration / 2);
    blockTravel(100);

    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);

    epochManagerContract.setToProcessGroups();
    for (uint256 i = 0; i < groups.length; i++) {
      epochManagerContract.processGroup(groups[i], lessers[i], greaters[i]);
    }

    activateValidators();

    timeTravel(epochDuration + 1);
    epochManagerContract.startNextEpochProcess();

    groups = getCurrentlyElectedGroups();

    timeTravel(epochDuration / 2);
    blockTravel(100);
  }

  /**
    * @notice Test the gas used by finishNextEpochProcess
    This test is trying to measure gas used by finishNextEpochProcess in a real life worst case. We have 126 validators and 123 groups.
    There are two main loops in the function, one for calculating rewards and the other for updating the elected validators.
    FinishNextEpochProcess is called twice, first time with going from 6 -> 110 validators which consumes approx. 6M gas and the second time with going from 110 -> 110 validators which consumes approx. 19M gas. 
     */
  function test_shouldFinishNextEpochProcessing_GasTest_Split() public {
    address[] memory lessers;
    address[] memory greaters;
    GroupWithVotes[] memory groupWithVotes;
    (lessers, greaters, groupWithVotes) = getLessersAndGreaters(groups);
    epochManagerContract.setToProcessGroups();

    for (uint256 i = 0; i < groups.length; i++) {
      uint256 gasLeftBefore1 = gasleft();
      epochManagerContract.processGroup(groups[i], lessers[i], greaters[i]);
      uint256 gasLeftAfter1 = gasleft();
      console.log("processGroup gas used: ", gasLeftBefore1 - gasLeftAfter1);
    }
  }
}

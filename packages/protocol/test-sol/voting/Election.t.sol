// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";
import { TestSortedLinkedList } from "../../contracts/stability/TestSortedLinkedList.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/governance/Election.sol";
import "../../contracts/governance/test/MockLockedGold.sol";
import "../../contracts/governance/test/MockValidators.sol";
import "../../contracts/common/Accounts.sol";
import "../../contracts/common/linkedlists/AddressSortedLinkedList.sol";
import "../../contracts/identity/test/MockRandom.sol";
import "../../contracts/common/Freezer.sol";
import { Constants } from "../constants.sol";
import "../utils.sol";
import "forge-std/console.sol";

contract ElectionTest is Election(true) {
  function distributeEpochRewards(address group, uint256 value, address lesser, address greater)
    external
  {
    return _distributeEpochRewards(group, value, lesser, greater);
  }
}

contract ElectionTestFoundry is Utils, Constants {
  using FixidityLib for FixidityLib.Fraction;

  event ElectableValidatorsSet(uint256 min, uint256 max);
  event MaxNumGroupsVotedForSet(uint256 maxNumGroupsVotedFor);
  event ElectabilityThresholdSet(uint256 electabilityThreshold);
  event AllowedToVoteOverMaxNumberOfGroups(address indexed account, bool flag);
  event ValidatorGroupMarkedEligible(address indexed group);
  event ValidatorGroupMarkedIneligible(address indexed group);
  event ValidatorGroupVoteCast(address indexed account, address indexed group, uint256 value);
  event ValidatorGroupVoteActivated(
    address indexed account,
    address indexed group,
    uint256 value,
    uint256 units
  );
  event ValidatorGroupPendingVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value
  );
  event ValidatorGroupActiveVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value,
    uint256 units
  );
  event EpochRewardsDistributedToVoters(address indexed group, uint256 value);

  Accounts accounts;
  ElectionTest election;
  Freezer freezer;
  MockLockedGold lockedGold;
  MockValidators validators;
  MockRandom random;
  IRegistry registry;

  address registryAddress = 0x000000000000000000000000000000000000ce10;
  address nonOwner = actor("nonOwner");
  address owner = address(this);
  uint256 electableValidatorsMin = 4;
  uint256 electableValidatorsMax = 6;
  uint256 maxNumGroupsVotedFor = 3;
  uint256 electabilityThreshold = FixidityLib.newFixedFraction(1, 100).unwrap();

  address account1 = actor("account1");
  address account2 = actor("account2");
  address account3 = actor("account3");
  address account4 = actor("account4");
  address account5 = actor("account5");
  address account6 = actor("account6");
  address account7 = actor("account7");
  address account8 = actor("account8");
  address account9 = actor("account9");
  address account10 = actor("account10");

  address[] accountsArray;

  function createAccount(address account) public {
    vm.prank(account);
    accounts.createAccount();
  }

  function setupGroupAndVote(
    address newGroup,
    address oldGroup,
    address[] memory members,
    bool vote
  ) public {
    validators.setMembers(newGroup, members);
    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(newGroup, oldGroup, address(0));
    registry.setAddressFor("Validators", address(validators));
    if (vote) {
      election.vote(newGroup, 1, oldGroup, address(0));
    }
  }

  function setUp() public {
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    accounts = new Accounts(true);

    accountsArray.push(account1);
    accountsArray.push(account2);
    accountsArray.push(account3);
    accountsArray.push(account4);
    accountsArray.push(account5);
    accountsArray.push(account6);
    accountsArray.push(account7);
    accountsArray.push(account8);
    accountsArray.push(account9);
    accountsArray.push(account10);

    for (uint256 i = 0; i < accountsArray.length; i++) {
      createAccount(accountsArray[i]);
    }

    createAccount(address(this));

    election = new ElectionTest();
    freezer = new Freezer(true);
    lockedGold = new MockLockedGold();
    validators = new MockValidators();
    registry = IRegistry(registryAddress);
    random = new MockRandom();

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("Random", address(random));

    election.initialize(
      registryAddress,
      electableValidatorsMin,
      electableValidatorsMax,
      maxNumGroupsVotedFor,
      electabilityThreshold
    );
  }
}

contract Election_Initialize is ElectionTestFoundry {
  function test_shouldHaveSetOwner() public {
    assertEq(election.owner(), owner);
  }

  function test_ShouldHaveSetElectableValidators() public {
    (uint256 min, uint256 max) = election.getElectableValidators();
    assertEq(min, electableValidatorsMin);
    assertEq(max, electableValidatorsMax);
  }

  function test_ShouldHaveSetMaxNumGroupsVotedFor() public {
    assertEq(election.maxNumGroupsVotedFor(), maxNumGroupsVotedFor);
  }

  function test_ShouldHaveSetElectabilityThreshold() public {
    assertEq(election.electabilityThreshold(), electabilityThreshold);
  }

  function test_shouldRevertWhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    election.initialize(
      registryAddress,
      electableValidatorsMin,
      electableValidatorsMax,
      maxNumGroupsVotedFor,
      electabilityThreshold
    );
  }
}

contract Election_SetElectabilityThreshold is ElectionTestFoundry {
  function test_shouldSetElectabilityThreshold() public {
    uint256 newElectabilityThreshold = FixidityLib.newFixedFraction(1, 200).unwrap();
    election.setElectabilityThreshold(newElectabilityThreshold);
    assertEq(election.electabilityThreshold(), newElectabilityThreshold);
  }

  function test_ShouldRevertWhenThresholdLargerThan100Percent() public {
    vm.expectRevert("Electability threshold must be lower than 100%");
    election.setElectabilityThreshold(FixidityLib.fixed1().unwrap() + 1);
  }
}

contract Election_SetElectableValidators is ElectionTestFoundry {
  function test_shouldSetElectableValidators() public {
    uint256 newElectableValidatorsMin = 2;
    uint256 newElectableValidatorsMax = 4;
    election.setElectableValidators(newElectableValidatorsMin, newElectableValidatorsMax);
    (uint256 min, uint256 max) = election.getElectableValidators();
    assertEq(min, newElectableValidatorsMin);
    assertEq(max, newElectableValidatorsMax);
  }

  function test_ShouldEmitTHeElectableValidatorsSetEvent() public {
    uint256 newElectableValidatorsMin = 2;
    uint256 newElectableValidatorsMax = 4;
    vm.expectEmit(true, false, false, false);
    emit ElectableValidatorsSet(newElectableValidatorsMin, newElectableValidatorsMax);
    election.setElectableValidators(newElectableValidatorsMin, newElectableValidatorsMax);
  }

  function test_ShouldRevertWhenMinElectableValidatorsIsZero() public {
    vm.expectRevert("Minimum electable validators cannot be zero");
    election.setElectableValidators(0, electableValidatorsMax);
  }

  function test_ShouldRevertWhenTHeminIsGreaterThanMax() public {
    vm.expectRevert("Maximum electable validators cannot be smaller than minimum");
    election.setElectableValidators(electableValidatorsMax, electableValidatorsMin);
  }

  function test_ShouldRevertWhenValuesAreUnchanged() public {
    vm.expectRevert("Electable validators not changed");
    election.setElectableValidators(electableValidatorsMin, electableValidatorsMax);
  }

  function test_ShouldRevertWhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    election.setElectableValidators(1, 2);
  }
}

contract Election_SetMaxNumGroupsVotedFor is ElectionTestFoundry {
  function test_shouldSetMaxNumGroupsVotedFor() public {
    uint256 newMaxNumGroupsVotedFor = 4;
    election.setMaxNumGroupsVotedFor(newMaxNumGroupsVotedFor);
    assertEq(election.maxNumGroupsVotedFor(), newMaxNumGroupsVotedFor);
  }

  function test_ShouldEmitMaxNumGroupsVotedForSetEvent() public {
    uint256 newMaxNumGroupsVotedFor = 4;
    vm.expectEmit(true, false, false, false);
    emit MaxNumGroupsVotedForSet(newMaxNumGroupsVotedFor);
    election.setMaxNumGroupsVotedFor(newMaxNumGroupsVotedFor);
  }

  function test_ShouldRevertWhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    election.setMaxNumGroupsVotedFor(1);
  }
}

contract Election_SetAllowedToVoteOverMaxNumberOfGroups is ElectionTestFoundry {
  function test_shouldSetAllowedToVoteOverMaxNumberOfGroups() public {
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
    assertEq(election.allowedToVoteOverMaxNumberOfGroups(address(this)), true);
  }

  function test_ShouldRevertWhenCalledByValidator() public {
    validators.setValidator(address(this));
    vm.expectRevert("Validators cannot vote for more than max number of groups");
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
  }

  function test_ShouldRevertWhenCalledByValidatorGroup() public {
    validators.setValidatorGroup(address(this));
    vm.expectRevert("Validator groups cannot vote for more than max number of groups");
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
  }

  function test_ShouldEmitAllowedToVoteOverMaxNumberOfGroupsEvent() public {
    vm.expectEmit(true, false, false, false);
    emit AllowedToVoteOverMaxNumberOfGroups(address(this), true);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
  }

  function test_ShouldSwitchAllowedToVoteOVerMaxNumberOfGroupsOff_WhenTurnedOn() public {
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
    assertEq(election.allowedToVoteOverMaxNumberOfGroups(address(this)), true);
    election.setAllowedToVoteOverMaxNumberOfGroups(false);
    assertEq(election.allowedToVoteOverMaxNumberOfGroups(address(this)), false);
  }

  function test_ShouldEmitAllowedToVoteOverMaxNumberOfGroupsEvent_WhenTurnedOn() public {
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
    vm.expectEmit(true, false, false, false);
    emit AllowedToVoteOverMaxNumberOfGroups(address(this), false);
    election.setAllowedToVoteOverMaxNumberOfGroups(false);
  }

}

contract Election_MarkGroupEligible is ElectionTestFoundry {
  function setUp() public {
    super.setUp();

    registry.setAddressFor("Validators", address(address(this)));
  }

  function test_shouldMarkGroupEligible() public {
    address group = address(this);
    election.markGroupEligible(group, address(0), address(0));
    address[] memory eligibleGroups = election.getEligibleValidatorGroups();
    assertEq(eligibleGroups.length, 1);
    assertEq(eligibleGroups[0], group);
  }

  function test_ShouldEmitValidatorGroupMarkedEligibleEvent() public {
    address group = address(this);
    vm.expectEmit(true, false, false, false);
    emit ValidatorGroupMarkedEligible(group);
    election.markGroupEligible(group, address(0), address(0));
  }

  function test_ShouldRevertWhenAlreadyMarkedEligible() public {
    address group = address(this);
    election.markGroupEligible(group, address(0), address(0));
    vm.expectRevert("invalid key");
    election.markGroupEligible(group, address(0), address(0));
  }

  function test_ShouldRevertWhenCalledByNonValidator() public {
    vm.expectRevert("only registered contract");
    vm.prank(nonOwner);
    election.markGroupEligible(address(this), address(0), address(0));
  }
}

contract Election_MarkGroupInEligible is ElectionTestFoundry {
  function setUp() public {
    super.setUp();

    registry.setAddressFor("Validators", address(address(this)));
  }

  function test_shouldMarkGroupIneligible() public {
    address group = address(this);
    election.markGroupEligible(group, address(0), address(0));
    election.markGroupIneligible(group);
    address[] memory eligibleGroups = election.getEligibleValidatorGroups();
    assertEq(eligibleGroups.length, 0);
  }

  function test_ShouldEmitValidatorGroupMarkedIneligibleEvent() public {
    address group = address(this);
    election.markGroupEligible(group, address(0), address(0));
    vm.expectEmit(true, false, false, false);
    emit ValidatorGroupMarkedIneligible(group);
    election.markGroupIneligible(group);
  }

  function test_ShouldRevertWhenAlreadyMarkedIneligible() public {
    address group = address(this);
    vm.expectRevert("key not in list");
    election.markGroupIneligible(group);
  }

  function test_ShouldRevertWhenCalledByNonValidator() public {
    vm.expectRevert("only registered contract");
    vm.prank(nonOwner);
    election.markGroupIneligible(address(this));
  }
}

contract Election_Vote is ElectionTestFoundry {
  address voter = address(this);
  address group = account1;
  uint256 value = 1000;

  uint256 originallyNotVotedWithAmount = 1;
  uint256 voterFirstGroupVote = value - maxNumGroupsVotedFor - originallyNotVotedWithAmount;
  uint256 rewardValue = 1000000;

  function setUp() public {
    super.setUp();

    address[] memory members = new address[](1);
    members[0] = account9;
    validators.setMembers(group, members);
  }

  function WhenGroupEligible() public {
    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));
  }

  function WhenGroupCanReceiveVotes() public {
    WhenGroupEligible();
    lockedGold.setTotalLockedGold(value);
    validators.setNumRegisteredValidators(1);
  }

  function WhenTheVoterCanVoteForAnAdditionalGroup() public {
    lockedGold.incrementNonvotingAccountBalance(voter, value);
  }

  function WhenTheVoterHasNotAlreadyVotedForThisGroup() public {
    WhenGroupCanReceiveVotes();
    WhenTheVoterCanVoteForAnAdditionalGroup();
    election.vote(group, value, address(0), address(0));
  }

  function test_ShouldAddTheGroupToLIstOfGroupsTheAccountHasVotedFor_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    address[] memory groupsVotedFor = election.getGroupsVotedForByAccount(voter);
    assertEq(groupsVotedFor.length, 1);
    assertEq(groupsVotedFor[0], group);
  }

  function test_ShouldIncrementTheAccountsPendingVotesForTheGroup_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldIncrementTheAccountsTotalVotesForTheGroup_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldIncrementTheACcountsTotalVotes_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    assertEq(election.getTotalVotesByAccount(voter), value);
  }

  function test_ShouldIncrementTheTotalVotesForTheGroup_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    assertEq(election.getTotalVotesForGroup(group), value);
  }

  function test_ShouldIncrementTheTotalVotes_WhenTheVoterHasNotAlreadyVotedForThisGroup() public {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    assertEq(election.getTotalVotes(), value);
  }

  function test_ShouldDecrementTheACcountsNonVotingLockedGoldBalance_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenTheVoterHasNotAlreadyVotedForThisGroup();
    assertEq(lockedGold.nonvotingAccountBalance(voter), 0);
  }

  function test_ShouldEmitTheValidatorGroupVoteCastEvent_WhenTheVoterHasNotAlreadyVotedForThisGroup()
    public
  {
    WhenGroupCanReceiveVotes();
    WhenTheVoterCanVoteForAnAdditionalGroup();
    vm.expectEmit(true, false, false, false);
    emit ValidatorGroupVoteCast(voter, group, value);
    election.vote(group, value, address(0), address(0));
  }

  function test_ShouldRevert_WhenTheVOterDoesNotHaveSufficientNonVotingBalance() public {
    WhenGroupEligible();
    lockedGold.incrementNonvotingAccountBalance(voter, value - 1);
    vm.expectRevert("SafeMath: subtraction overflow");
    election.vote(group, value, address(0), address(0));
  }

  function WhenVotedForMaxNumberOfGroups() public returns (address newGroup) {
    WhenGroupEligible();
    lockedGold.incrementNonvotingAccountBalance(voter, value);

    for (uint256 i = 0; i < maxNumGroupsVotedFor; i++) {
      address[] memory members = new address[](1);
      members[0] = accountsArray[9];
      newGroup = accountsArray[i + 2];
      setupGroupAndVote(newGroup, group, members, true);
    }
  }

  function test_ShouldRevert_WhenTheVoterCannotVoteForAnAdditionalGroup() public {
    address newGroup = WhenVotedForMaxNumberOfGroups();

    vm.expectRevert("Voted for too many groups");
    election.vote(group, value - maxNumGroupsVotedFor, newGroup, address(0));
  }

  function test_ShouldAllowToVoteForAnotherGroup_WhenTheVoterIsOVerMaxNumberGroupsVotedForButCanVoteForAdditionalGroup()
    public
  {
    address newGroup = WhenVotedForMaxNumberOfGroups();
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    vm.expectEmit(true, true, true, true);
    emit ValidatorGroupVoteCast(voter, group, value - maxNumGroupsVotedFor);
    election.vote(group, value - maxNumGroupsVotedFor, newGroup, address(0));
    assertEq(election.getPendingVotesForGroupByAccount(group, voter), value - maxNumGroupsVotedFor);
  }

  function test_ShouldSetTotalVotesByAccount_WhenMaxNumberOfGroupsWasNotReached() public {
    WhenVotedForMaxNumberOfGroups();
    assertEq(election.getTotalVotesByAccount(voter), maxNumGroupsVotedFor);
  }

  function WhenVotedForMoreThanMaxNumberOfGroups() public returns (address newGroup) {
    newGroup = WhenVotedForMaxNumberOfGroups();
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
    election.vote(group, voterFirstGroupVote, newGroup, address(0));
  }

  function test_ShouldRevert_WhenTurningOffSetAllowedToVoteOverMaxNUmberOfGroups() public {
    WhenVotedForMoreThanMaxNumberOfGroups();

    vm.expectRevert("Too many groups voted for!");
    election.setAllowedToVoteOverMaxNumberOfGroups(false);
  }

  function test_ShouldReturnOnlyLastVotedWithSinceVotesWereNotManuallyCounted() public {
    WhenVotedForMoreThanMaxNumberOfGroups();
    assertEq(election.getTotalVotesByAccount(voter), voterFirstGroupVote);
  }

  function manuallyUpdateTotalVotesForAllGroups(address _voter) public {
    for (uint256 i = 0; i < maxNumGroupsVotedFor; i++) {
      election.updateTotalVotesByAccountForGroup(_voter, accountsArray[i + 2]);
    }
    election.updateTotalVotesByAccountForGroup(_voter, group);
  }

  function WhenTotalVotesWereManuallyCounted() public {
    WhenVotedForMoreThanMaxNumberOfGroups();
    manuallyUpdateTotalVotesForAllGroups(voter);
  }

  function test_ShouldReturnTotalVotesByAccount_WhenTotalVotesAreManuallyCounted() public {
    WhenTotalVotesWereManuallyCounted();
    assertEq(election.getTotalVotesByAccount(voter), value - originallyNotVotedWithAmount);
  }

  function test_ShouldReturnLoweredTotalNumberOfVotes_WhenVotesRevoked_WhenTotalVotesWereManuallyCounted()
    public
  {
    uint256 revokeDiff = 100;
    uint256 revokeValue = voterFirstGroupVote - revokeDiff;

    WhenTotalVotesWereManuallyCounted();
    election.revokePending(group, revokeValue, accountsArray[4], address(0), 3);
    assertEq(election.getTotalVotesByAccount(voter), maxNumGroupsVotedFor + revokeDiff);
  }

  function WhenVotesAreBeingActivated() public returns (address newGroup) {
    newGroup = WhenVotedForMoreThanMaxNumberOfGroups();
    vm.roll(EPOCH_SIZE + 1);
    election.activateForAccount(group, voter);
  }

  function test_ShouldIncrementTheAccountsActiveVotesForGroup_WhenVotesAreBeingActivated() public {
    WhenVotesAreBeingActivated();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter), voterFirstGroupVote);
  }

  function test_ShouldReturnCorrectValueWhenManuallyCounted_WhenVotesAreBeingActivated() public {
    WhenVotesAreBeingActivated();
    manuallyUpdateTotalVotesForAllGroups(voter);

    assertEq(election.getTotalVotesByAccount(voter), value - originallyNotVotedWithAmount);
  }

  function WhenAwardsAreDistributed() public returns (address newGroup) {
    newGroup = WhenVotesAreBeingActivated();
    election.distributeEpochRewards(group, rewardValue, newGroup, address(0));
  }

  function test_ShouldRevokeActiveVotes_WhenAwardsAreDistributed() public {
    // (more then original votes without rewards)
    address newGroup = WhenAwardsAreDistributed();
    election.revokeActive(group, value, newGroup, address(0), 3);
    assertEq(
      election.getActiveVotesForGroupByAccount(group, voter),
      rewardValue - maxNumGroupsVotedFor - originallyNotVotedWithAmount
    );
  }

  function test_ShouldReturnCorrectValueWhenManuallyCounted_WhenMoreVotesThanActiveIsRevoked_WhenAwardsAreDistributed()
    public
  {
    address newGroup = WhenAwardsAreDistributed();
    election.revokeActive(group, value, newGroup, address(0), 3);
    manuallyUpdateTotalVotesForAllGroups(voter);

    assertEq(election.getTotalVotesByAccount(voter), rewardValue - originallyNotVotedWithAmount);
  }

  function test_ShouldReturnTotalVotesByAccount_WhenTotalVotesAreManuallyCountedOnReward_WhenAwardsAreDistributed()
    public
  {
    WhenAwardsAreDistributed();
    manuallyUpdateTotalVotesForAllGroups(voter);

    assertEq(
      election.getTotalVotesByAccount(voter),
      value + rewardValue - originallyNotVotedWithAmount
    );
  }

  function test_ShouldIncreaseTotalVotesCountOnceVoted_WhenTotalVotesAreManuallyCountedOnReward_WhenAwardsAreDistributed()
    public
  {
    address newGroup = WhenAwardsAreDistributed();
    manuallyUpdateTotalVotesForAllGroups(voter);

    election.vote(newGroup, originallyNotVotedWithAmount, account4, group);

    assertEq(election.getTotalVotes(), value + rewardValue);
  }

  function test_ShouldRevert_WhenTheGroupCannotReceiveVotes() public {
    WhenGroupEligible();
    lockedGold.setTotalLockedGold(value / 2 - 1);
    address[] memory members = new address[](1);
    members[0] = account9;
    validators.setMembers(group, members);
    validators.setNumRegisteredValidators(1);
    assertEq(election.getNumVotesReceivable(group), value - 2);

    vm.expectRevert("Group cannot receive votes");
    election.vote(group, value, address(0), address(0));
  }

  function test_ShouldRevert_WhenTheGroupIsNotEligible() public {
    vm.expectRevert("Group not eligible");
    election.vote(group, value, address(0), address(0));
  }

}

contract Election_Activate is ElectionTestFoundry {
  address voter = address(this);
  address group = account1;
  uint256 value = 1000;

  function setUp() public {
    super.setUp();

    address[] memory members = new address[](1);
    members[0] = account9;
    validators.setMembers(group, members);

    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));

    lockedGold.setTotalLockedGold(value);
    validators.setMembers(group, members);
    validators.setNumRegisteredValidators(1);
    lockedGold.incrementNonvotingAccountBalance(voter, value);
  }

  function WhenVoterHasPendingVotes() public {
    election.vote(group, value, address(0), address(0));
  }

  function WhenEpochBoundaryHasPassed() public {
    WhenVoterHasPendingVotes();
    vm.roll(EPOCH_SIZE + 1);
    election.activate(group);
  }

  function test_ShouldDecrementTheAccountsPendingVotesForTheGroup_WhenEpochBoundaryHasPassed()
    public
  {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter), 0);
  }

  function test_ShouldIncrementTheAccountsActiveVotesForTheGroup_WhenEpochBoundaryHasPassed()
    public
  {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheAccountsTotalVotesForTheGroup_WhenEpochBoundaryHasPassed()
    public
  {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheAccountsTotalVotes_WhenEpochBoundaryHasPassed() public {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotesByAccount(voter), value);
  }

  function test_ShouldNotModifyTotalVotesForGroup_WhenEpochBoundaryHasPassed() public {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotesForGroup(group), value);
  }

  function test_ShouldNotModifyTotalVotes_WhenEpochBoundaryHasPassed() public {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotes(), value);
  }

  function test_ShouldEmitValidatorGroupVoteActivatedEvent_WhenEpochBoundaryHasPassed() public {
    WhenVoterHasPendingVotes();
    vm.roll(EPOCH_SIZE + 1);
    vm.expectEmit(true, true, true, false);
    emit ValidatorGroupVoteActivated(voter, group, value, value * 100000000000000000000);
    election.activate(group);
  }

  address voter2 = account2;
  uint256 value2 = 573;

  function WhenAnotherVoterActivatesVotes() public {
    WhenEpochBoundaryHasPassed();
    lockedGold.incrementNonvotingAccountBalance(voter2, value2);
    vm.prank(voter2);
    election.vote(group, value2, address(0), address(0));
    vm.roll(2 * EPOCH_SIZE + 2);
    vm.prank(voter2);
    election.activate(group);
  }

  function test_ShouldNotModifyTheFirstAccountActiveVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheFirstAccountTotalVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheFirstAccountTotalVotes_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesByAccount(voter), value);
  }

  function test_ShouldDecrementTheSecondAccountsPendingVotesFOrTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter2), 0);
  }

  function test_ShouldIncrementTheSecondAccountActiveVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter2), value2);
  }

  function test_ShouldNotModifyTheSecondsAccountTotalVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter2), value2);
  }

  function test_ShouldNotMOdifyTheSecondAccountTotalVotes_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesByAccount(voter2), value2);
  }

  function test_ShouldNotModifyTotalVotesForGroup_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesForGroup(group), value + value2);
  }

  function test_ShouldNotModifyTotalVotes_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotes(), value + value2);
  }

  function test_ShouldRevert_WhenAnEpochBoundaryHadNotPassedSinceThePendingVotesWereMade() public {
    WhenVoterHasPendingVotes();
    vm.expectRevert("Pending vote epoch not passed");
    election.activateForAccount(group, voter);
  }

  function test_ShouldRevert_WhenTheVoterDoesNotHavePendingVotes() public {
    vm.expectRevert("Vote value cannot be zero");
    election.activate(group);
  }
}

contract Election_ActivateForAccount is ElectionTestFoundry {
  address voter = address(this);
  address group = account1;
  uint256 value = 1000;

  function setUp() public {
    super.setUp();

    address[] memory members = new address[](1);
    members[0] = account9;
    validators.setMembers(group, members);

    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));

    lockedGold.setTotalLockedGold(value);
    validators.setMembers(group, members);
    validators.setNumRegisteredValidators(1);
    lockedGold.incrementNonvotingAccountBalance(voter, value);
  }

  function WhenVoterHasPendingVotes() public {
    election.vote(group, value, address(0), address(0));
  }

  function WhenEpochBoundaryHasPassed() public {
    WhenVoterHasPendingVotes();
    vm.roll(EPOCH_SIZE + 1);
    election.activateForAccount(group, voter);
  }

  function test_ShouldDecrementTheAccountsPendingVotesForTheGroup_WhenEpochBoundaryHasPassed()
    public
  {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter), 0);
  }

  function test_ShouldIncrementTheAccountsActiveVotesForTheGroup_WhenEpochBoundaryHasPassed()
    public
  {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheAccountsTotalVotesForTheGroup_WhenEpochBoundaryHasPassed()
    public
  {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheAccountsTotalVotes_WhenEpochBoundaryHasPassed() public {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotesByAccount(voter), value);
  }

  function test_ShouldNotModifyTotalVotesForGroup_WhenEpochBoundaryHasPassed() public {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotesForGroup(group), value);
  }

  function test_ShouldNotModifyTotalVotes_WhenEpochBoundaryHasPassed() public {
    WhenEpochBoundaryHasPassed();
    assertEq(election.getTotalVotes(), value);
  }

  function test_ShouldEmitValidatorGroupVoteActivatedEvent_WhenEpochBoundaryHasPassed() public {
    WhenVoterHasPendingVotes();
    vm.roll(EPOCH_SIZE + 1);
    vm.expectEmit(true, true, true, false);
    emit ValidatorGroupVoteActivated(voter, group, value, value * 100000000000000000000);
    election.activate(group);
  }

  address voter2 = account2;
  uint256 value2 = 573;

  function WhenAnotherVoterActivatesVotes() public {
    WhenEpochBoundaryHasPassed();
    lockedGold.incrementNonvotingAccountBalance(voter2, value2);
    vm.prank(voter2);
    election.vote(group, value2, address(0), address(0));
    vm.roll(2 * EPOCH_SIZE + 2);
    election.activateForAccount(group, voter2);
  }

  function test_ShouldNotModifyTheFirstAccountActiveVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheFirstAccountTotalVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), value);
  }

  function test_ShouldNotModifyTheFirstAccountTotalVotes_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesByAccount(voter), value);
  }

  function test_ShouldDecrementTheSecondAccountsPendingVotesFOrTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter2), 0);
  }

  function test_ShouldIncrementTheSecondAccountActiveVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter2), value2);
  }

  function test_ShouldNotModifyTheSecondsAccountTotalVotesForTheGroup_WhenAnotherVoterActivatesVotes()
    public
  {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter2), value2);
  }

  function test_ShouldNotMOdifyTheSecondAccountTotalVotes_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesByAccount(voter2), value2);
  }

  function test_ShouldNotModifyTotalVotesForGroup_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotesForGroup(group), value + value2);
  }

  function test_ShouldNotModifyTotalVotes_WhenAnotherVoterActivatesVotes() public {
    WhenAnotherVoterActivatesVotes();
    assertEq(election.getTotalVotes(), value + value2);
  }

  function test_ShouldRevert_WhenEpochBoundaryHasNotPassedSinceThePendingVotesWereMade() public {
    WhenVoterHasPendingVotes();
    vm.expectRevert("Pending vote epoch not passed");
    election.activateForAccount(group, voter);
  }

  function test_ShouldRevert_WhenTheVoterDoesNotHavePendingVotes() public {
    vm.expectRevert("Vote value cannot be zero");
    election.activateForAccount(group, voter);
  }

}

contract Election_RevokePending is ElectionTestFoundry {
  address voter = address(this);
  address group = account1;
  uint256 value = 1000;

  uint256 index = 0;
  uint256 revokedValue = value - 1;
  uint256 remaining = value - revokedValue;

  function setUp() public {
    super.setUp();

    address[] memory members = new address[](1);
    members[0] = account9;
    validators.setMembers(group, members);

    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));

    lockedGold.setTotalLockedGold(value);
    validators.setMembers(group, members);
    validators.setNumRegisteredValidators(1);
    lockedGold.incrementNonvotingAccountBalance(voter, value);
    election.vote(group, value, address(0), address(0));
  }

  function WhenValidatorGroupHasVotesButIsIneligible() public {
    registry.setAddressFor("Validators", address(this));
    election.markGroupIneligible(group);
    election.revokePending(group, revokedValue, address(0), address(0), index);
  }

  function test_ShouldDecrementTheAccountsPendingVotesForTheGroup_WhenValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter), remaining);
  }

  function test_ShouldDecrementAccountsTotalVotesForTheGroup_WhenValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), remaining);
  }

  function test_ShouldDecrementTheAccountsTotalVotes_WhenValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotesByAccount(voter), remaining);
  }

  function test_ShouldDecrementTotalVotesForTheGroup_WhenValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotesForGroup(group), remaining);
  }

  function test_ShouldDecrementTotalVotes_WhenValidatorGroupHasVotesButIsIneligible() public {
    WhenValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotes(), remaining);
  }

  function test_ShouldIncrementTheAccountsNonvotingLockedGoldBalance_WhenValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenValidatorGroupHasVotesButIsIneligible();
    assertEq(lockedGold.nonvotingAccountBalance(voter), revokedValue);
  }

  function test_ShouldEmitValidatorGroupPendingVoteRevokedEvent_WhenValidatorGroupHasVotesButIsIneligible()
    public
  {
    registry.setAddressFor("Validators", address(this));
    election.markGroupIneligible(group);
    vm.expectEmit(true, true, true, false);
    emit ValidatorGroupPendingVoteRevoked(voter, group, revokedValue);
    election.revokePending(group, revokedValue, address(0), address(0), index);
  }

  function WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible() public {
    election.revokePending(group, revokedValue, address(0), address(0), index);
  }

  function test_ShouldDecrementTheAccountsPendingVotesForTheGroup_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible();
    assertEq(election.getPendingVotesForGroupByAccount(group, voter), remaining);
  }

  function test_ShouldDecrementAccountsTotalVotesForTheGroup_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter), remaining);
  }

  function test_ShouldDecrementTheAccountsTotalVotes_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible();
    assertEq(election.getTotalVotesByAccount(voter), remaining);
  }

  function test_ShouldDecrementTotalVotesForTheGroup_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible();
    assertEq(election.getTotalVotesForGroup(group), remaining);
  }

  function test_ShouldDecrementTotalVotes_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible();
    assertEq(election.getTotalVotes(), remaining);
  }

  function test_ShouldIncrementTheAccountsNonvotingLockedGoldBalance_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible();
    assertEq(lockedGold.nonvotingAccountBalance(voter), revokedValue);
  }

  function test_ShouldEmitValidatorGroupPendingVoteRevokedEvent_WhenRevokedValueIsLessThanPendingVotesButGroupIsEligible()
    public
  {
    registry.setAddressFor("Validators", address(this));
    election.markGroupIneligible(group);
    vm.expectEmit(true, true, true, false);
    emit ValidatorGroupPendingVoteRevoked(voter, group, revokedValue);
    election.revokePending(group, revokedValue, address(0), address(0), index);
  }

  function test_ShouldRemoveTheGroup_WhenCorrectIndexProvided_WhenRevokedValueIsEqualToPendingVotes()
    public
  {
    election.revokePending(group, value, address(0), address(0), index);
    assertEq(election.getGroupsVotedForByAccount(voter).length, 0);
  }

  function test_ShouldRevert_WhenWrongIndexIsProvided() public {
    vm.expectRevert("Bad index");
    election.revokePending(group, value, address(0), address(0), index + 1);
  }

  function test_ShouldRevert_WhenRevokedValuesIsGreaterThanThePendingVotes() public {
    vm.expectRevert("Vote value larger than pending votes");
    election.revokePending(group, value + 1, address(0), address(0), index);
  }
}

contract Election_RevokeActive is ElectionTestFoundry {
  address voter0 = address(this);
  address voter1 = account1;
  address group = account2;
  uint256 voteValue0 = 1000;
  uint256 reward0 = 111;
  uint256 voteValue1 = 1000;

  uint256 index = 0;
  uint256 remaining = 1;
  uint256 revokedValue = voteValue0 + reward0 - remaining;

  function assertConsistentSums() public {
    uint256 activeTotal = election.getActiveVotesForGroupByAccount(group, voter0) +
      election.getActiveVotesForGroupByAccount(group, voter1);
    uint256 pendingTotal = election.getPendingVotesForGroupByAccount(group, voter0) +
      election.getPendingVotesForGroupByAccount(group, voter1);
    uint256 totalGroup = election.getTotalVotesForGroup(group);
    assertAlmostEqual(election.getActiveVotesForGroup(group), activeTotal, 1);
    assertAlmostEqual(totalGroup, activeTotal + pendingTotal, 1);
    assertEq(election.getTotalVotes(), totalGroup);
  }

  function setUp() public {
    super.setUp();

    address[] memory members = new address[](1);
    members[0] = account9;
    validators.setMembers(group, members);

    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));

    lockedGold.setTotalLockedGold(voteValue0 + voteValue1);
    validators.setNumRegisteredValidators(1);
    lockedGold.incrementNonvotingAccountBalance(voter0, voteValue0);
    lockedGold.incrementNonvotingAccountBalance(voter1, voteValue1);

    // Gives 1000 units to voter 0
    election.vote(group, voteValue0, address(0), address(0));
    assertConsistentSums();
    vm.roll(EPOCH_SIZE + 1);
    election.activate(group);
    assertConsistentSums();

    // Makes those 1000 units represent 1111 votes.
    election.distributeEpochRewards(group, reward0, address(0), address(0));
    assertConsistentSums();

    // Gives 900 units to voter 1.
    vm.prank(voter1);
    election.vote(group, voteValue1, address(0), address(0));
    assertConsistentSums();
    vm.roll(2 * EPOCH_SIZE + 2);
    vm.prank(voter1);
    election.activate(group);
    assertConsistentSums();
  }

  function WhenTheValidatorGroupHasVotesButIsIneligible() public {
    registry.setAddressFor("Validators", address(this));
    election.markGroupIneligible(group);
    election.revokeActive(group, revokedValue, address(0), address(0), 0);
  }

  function test_ShouldBeConsistent_WhenTheValidatorGroupHasVotesButIsIneligible() public {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertConsistentSums();
  }

  function test_ShouldDecrementTheAccountsActiveVotesForTheGroup_WhenTheValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter0), remaining);
  }

  function test_ShouldDecrementTheAccountsTotalVotesForTheGroup_WhenTheValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter0), remaining);
  }

  function test_ShouldDecrementTheAccountsTotalVotes_WhenTheValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotesByAccount(voter0), remaining);
  }

  function test_ShouldDecrementTotalVotesForTheGroup_WhenTheValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertEq(
      election.getTotalVotesForGroup(group),
      voteValue0 + reward0 + voteValue1 - revokedValue
    );
  }

  function test_ShouldDecrementTotalVotes_WhenTheValidatorGroupHasVotesButIsIneligible() public {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertEq(election.getTotalVotes(), voteValue0 + reward0 + voteValue1 - revokedValue);
  }

  function test_ShouldIncrementTheAccountsNonvotingLockedGoldBalance_WhenTheValidatorGroupHasVotesButIsIneligible()
    public
  {
    WhenTheValidatorGroupHasVotesButIsIneligible();
    assertEq(lockedGold.nonvotingAccountBalance(voter0), revokedValue);
  }

  function test_ShouldEmitValidatorGroupActiveVoteRevokedEvent_WhenTheValidatorGroupHasVotesButIsIneligible()
    public
  {
    registry.setAddressFor("Validators", address(this));
    election.markGroupIneligible(group);
    vm.expectEmit(true, true, true, false);
    emit ValidatorGroupActiveVoteRevoked(
      voter0,
      group,
      revokedValue,
      revokedValue * 100000000000000000000
    );
    election.revokeActive(group, revokedValue, address(0), address(0), 0);
  }

  function WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible() public {
    election.revokeActive(group, revokedValue, address(0), address(0), 0);
  }

  function test_ShouldBeConsistent_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertConsistentSums();
  }

  function test_ShouldDecrementTheAccountsActiveVotesForTheGroup_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter0), remaining);
  }

  function test_ShouldDecrementTheAccountsTotalVotesForTheGroup_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter0), remaining);
  }

  function test_ShouldDecrementTheAccountsTotalVotes_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertEq(election.getTotalVotesByAccount(voter0), remaining);
  }

  function test_ShouldDecrementTotalVotesForTheGroup_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertEq(
      election.getTotalVotesForGroup(group),
      voteValue0 + reward0 + voteValue1 - revokedValue
    );
  }

  function test_ShouldDecrementTotalVotes_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertEq(election.getTotalVotes(), voteValue0 + reward0 + voteValue1 - revokedValue);
  }

  function test_ShouldIncrementTheAccountsNonvotingLockedGoldBalance_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible();
    assertEq(lockedGold.nonvotingAccountBalance(voter0), revokedValue);
  }

  function test_ShouldEmitValidatorGroupActiveVoteRevokedEvent_WhenRevokedValueIsLessThanTheActiveVotesButGroupIsEligible()
    public
  {
    registry.setAddressFor("Validators", address(this));
    election.markGroupIneligible(group);
    vm.expectEmit(true, true, true, false);
    emit ValidatorGroupActiveVoteRevoked(
      voter0,
      group,
      revokedValue,
      revokedValue * 100000000000000000000
    );
    election.revokeActive(group, revokedValue, address(0), address(0), 0);
  }

  function test_ShouldBeConsistent_WhenRevokeAllActive() public {
    election.revokeAllActive(group, address(0), address(0), 0);
    assertConsistentSums();
  }

  function test_ShouldDecrementAllOfTheAccountsActiveVotesForTheGroup_WhenRevokeAllActive() public {
    election.revokeAllActive(group, address(0), address(0), 0);
    assertEq(election.getActiveVotesForGroupByAccount(group, voter0), 0);
  }

  function WhenCorrectIndexIsProvided() public {
    election.revokeActive(group, voteValue0 + reward0, address(0), address(0), index);
  }

  function test_ShouldBeConsistent_WhenCorrectIndexIsProvided() public {
    WhenCorrectIndexIsProvided();
    assertConsistentSums();
  }

  function test_ShouldDecrementTheAccountsActiveVotesForTheGroup_WhenCorrectIndexIsProvided()
    public
  {
    WhenCorrectIndexIsProvided();
    assertEq(election.getActiveVotesForGroupByAccount(group, voter0), 0);
  }

  function test_ShouldDecrementTheAccountsTotalVotesForTheGroup_WhenCorrectIndexIsProvided()
    public
  {
    WhenCorrectIndexIsProvided();
    assertEq(election.getTotalVotesForGroupByAccount(group, voter0), 0);
  }

  function test_ShouldDecrementTheAccountsTotalVotes_WhenCorrectIndexIsProvided() public {
    WhenCorrectIndexIsProvided();
    assertEq(election.getTotalVotesByAccount(voter0), 0);
  }

  function test_ShouldDecrementTotalVotesForTheGroup_WhenCorrectIndexIsProvided() public {
    WhenCorrectIndexIsProvided();
    assertEq(election.getTotalVotesForGroup(group), voteValue1);
  }

  function test_ShouldDecrementTotalVotes_WhenCorrectIndexIsProvided() public {
    WhenCorrectIndexIsProvided();
    assertEq(election.getTotalVotes(), voteValue1);
  }

  function test_ShouldIncrementTheAccountsNonvotingLockedGoldBalance_WhenCorrectIndexIsProvided()
    public
  {
    WhenCorrectIndexIsProvided();
    assertEq(lockedGold.nonvotingAccountBalance(voter0), voteValue0 + reward0);
  }

  function test_ShouldRemoveTheGroupFromTheListOfGroupsTheAccountHasVotedFor_WhenCorrectIndexIsProvided()
    public
  {
    WhenCorrectIndexIsProvided();
    assertEq(election.getGroupsVotedForByAccount(voter0).length, 0);
  }

  function test_ShouldRevert_WhenWrongIndexIsProvided() public {
    vm.expectRevert("Bad index");
    election.revokeActive(group, voteValue0 + reward0, address(0), address(0), index + 1);
  }

  function test_ShouldRevert_WhenRevokedValueIsGreaterThanTheActiveVotes() public {
    vm.expectRevert("Vote value larger than active votes");
    election.revokeActive(group, voteValue0 + reward0 + 1, address(0), address(0), index);
  }

}

contract Election_ElectionValidatorSigners is ElectionTestFoundry {
  address group1 = address(this);
  address group2 = account1;
  address group3 = account2;

  address validator1 = account3;
  address validator2 = account4;
  address validator3 = account5;
  address validator4 = account6;
  address validator5 = account7;
  address validator6 = account8;
  address validator7 = account9;

  bytes32 hash = 0xa5b9d60f32436310afebcfda832817a68921beb782fabf7915cc0460b443116a;

  // If voterN votes for groupN:
  //   group1 gets 20 votes per member
  //   group2 gets 25 votes per member
  //   group3 gets 30 votes per member
  // We cannot make any guarantee with respect to their ordering.
  address voter1 = address(this);
  address voter2 = account1;
  address voter3 = account2;

  uint256 voter1Weight = 80;
  uint256 voter2Weight = 50;
  uint256 voter3Weight = 30;

  uint256 totalLockedGold = voter1Weight + voter2Weight + voter3Weight;

  struct MemberWithVotes {
    address member;
    uint256 votes;
  }

  mapping(address => uint256) votesConsideredForElection;

  MemberWithVotes[] membersWithVotes;

  function setRandomness(uint256 randomness) public {
    random.addTestRandomness(block.number + 1, hash);
  }

  // Helper function to sort an array of uint256
  function sort(uint256[] memory data) internal pure returns (uint256[] memory) {
    uint256 length = data.length;
    for (uint256 i = 0; i < length; i++) {
      for (uint256 j = i + 1; j < length; j++) {
        if (data[i] > data[j]) {
          uint256 temp = data[i];
          data[i] = data[j];
          data[j] = temp;
        }
      }
    }
    return data;
  }

  function sortMembersWithVotesDesc(MemberWithVotes[] memory data)
    internal
    pure
    returns (MemberWithVotes[] memory)
  {
    uint256 length = data.length;
    for (uint256 i = 0; i < length; i++) {
      for (uint256 j = i + 1; j < length; j++) {
        if (data[i].votes < data[j].votes) {
          MemberWithVotes memory temp = data[i];
          data[i] = data[j];
          data[j] = temp;
        }
      }
    }
    return data;
  }

  function WhenThereIsALargeNumberOfGroups() public {
    lockedGold.setTotalLockedGold(1e25);
    validators.setNumRegisteredValidators(400);
    lockedGold.incrementNonvotingAccountBalance(voter1, 1e25);
    election.setElectabilityThreshold(0);
    election.setElectableValidators(10, 100);

    election.setMaxNumGroupsVotedFor(200);

    address prev = address(0);
    uint256[] memory randomVotes = new uint256[](100);
    for (uint256 i = 0; i < 100; i++) {
      randomVotes[i] = uint256(keccak256(abi.encodePacked(i))) % 1e14;
    }
    randomVotes = sort(randomVotes);
    for (uint256 i = 0; i < 100; i++) {
      address group = actor(string(abi.encodePacked("group", i)));
      address[] memory members = new address[](4);
      for (uint256 j = 0; j < 4; j++) {
        members[j] = actor(string(abi.encodePacked("group", i, "member", j)));
        // If there are already n elected members in a group, the votes for the next member
        // are total votes of group divided by n+1
        votesConsideredForElection[members[j]] = randomVotes[i] / (j + 1);
        membersWithVotes.push(MemberWithVotes(members[j], votesConsideredForElection[members[j]]));
      }
      validators.setMembers(group, members);
      registry.setAddressFor("Validators", address(this));
      election.markGroupEligible(group, address(0), prev);
      registry.setAddressFor("Validators", address(validators));
      vm.prank(voter1);
      election.vote(group, randomVotes[i], prev, address(0));
      prev = group;
    }
  }

  function test_ShouldElectCorrectValidators_WhenThereIsALargeNumberOfGroups() public {
    WhenThereIsALargeNumberOfGroups();
    address[] memory elected = election.electValidatorSigners();
    MemberWithVotes[] memory sortedMembersWithVotes = sortMembersWithVotesDesc(membersWithVotes);
    MemberWithVotes[] memory electedUnsorted = new MemberWithVotes[](100);

    for (uint256 i = 0; i < 100; i++) {
      electedUnsorted[i] = MemberWithVotes(elected[i], votesConsideredForElection[elected[i]]);
    }
    MemberWithVotes[] memory electedSorted = sortMembersWithVotesDesc(electedUnsorted);

    for (uint256 i = 0; i < 100; i++) {
      assertEq(electedSorted[i].member, sortedMembersWithVotes[i].member);
      assertEq(electedSorted[i].votes, sortedMembersWithVotes[i].votes);
    }
  }

}

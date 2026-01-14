// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/governance/Governance.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockValidators.sol";

contract GovernanceHarness is Governance(true) {
  address[] internal validatorSet;

  function addValidator(address validator) external {
    validatorSet.push(validator);
  }

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return validatorSet.length;
  }

  function numberValidatorsInSet(uint256) public view returns (uint256) {
    return validatorSet.length;
  }

  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    return validatorSet[index];
  }
}

contract GovernanceDelegationTest is TestWithUtils {
  using FixidityLib for FixidityLib.Fraction;

  Accounts accounts;
  LockedGold lockedGold;
  GovernanceHarness governance;
  MockElection election;
  MockValidators validators;

  address delegator = actor("delegator");
  address delegatee1 = actor("delegatee1");
  address delegatee2 = actor("delegatee2");
  address approver = actor("approver");

  uint256 constant LOCKED_AMOUNT = 1000 ether;
  uint256 constant SMALL_LOCK = 1;
  uint256 constant MIN_DEPOSIT = 1 ether;
  uint256 constant QUEUE_EXPIRY = 30 days;
  uint256 constant DEQUEUE_FREQUENCY = 1 seconds;
  uint256 constant REFERENDUM_DURATION = 3 days;
  uint256 constant EXECUTION_DURATION = 3 days;

  function setUp() public {
    super.setUp();

    accounts = new Accounts(true);
    lockedGold = new LockedGold(true);
    governance = new GovernanceHarness();
    election = new MockElection();
    validators = new MockValidators();

    registry.setAddressFor(AccountsContract, address(accounts));
    registry.setAddressFor(LockedGoldContract, address(lockedGold));
    registry.setAddressFor(GovernanceContract, address(governance));
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(ValidatorsContract, address(validators));

    accounts.initialize(address(registry));
    lockedGold.initialize(address(registry), 1 weeks);
    governance.initialize(
      address(registry),
      approver,
      1,
      MIN_DEPOSIT,
      QUEUE_EXPIRY,
      DEQUEUE_FREQUENCY,
      REFERENDUM_DURATION,
      EXECUTION_DURATION,
      FixidityLib.newFixedFraction(5, 10).unwrap(),
      FixidityLib.newFixedFraction(5, 10).unwrap(),
      FixidityLib.newFixedFraction(1, 5).unwrap(),
      FixidityLib.newFixedFraction(1, 2).unwrap()
    );

    governance.addValidator(actor("validator"));

    vm.deal(delegator, LOCKED_AMOUNT + 10 ether);
    vm.deal(delegatee1, SMALL_LOCK + 1 ether);
    vm.deal(delegatee2, 1 ether);
    vm.deal(approver, 1 ether);

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee1);
    accounts.createAccount();
    vm.prank(delegatee2);
    accounts.createAccount();

    vm.prank(delegator);
    lockedGold.lock.value(LOCKED_AMOUNT)();
    vm.prank(delegatee1);
    lockedGold.lock.value(SMALL_LOCK)();
  }

  function test_ShouldReturnCorrectVotingAmount_WhenBothQueueAndReferendumActive() public {
    uint256 prop1 = _makeProposal(delegator);
    uint256 prop2 = _makeProposal(delegator);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    vm.warp(block.timestamp + DEQUEUE_FREQUENCY + 1);
    governance.dequeueProposalsIfReady();
    uint256 idx = _getDequeuedIndex(prop1);
    vm.prank(approver);
    governance.approve(prop1, idx);

    vm.prank(delegatee1);
    governance.upvote(prop2, 0, 0);

    vm.prank(delegatee1);
    governance.votePartially(prop1, idx, LOCKED_AMOUNT, 0, 0);

    uint256 reported = governance.getAmountOfGoldUsedForVoting(delegatee1);
    assertEq(reported, LOCKED_AMOUNT + SMALL_LOCK);
  }

  function test_ShouldReduceVotes_WhenRevokingDelegation() public {
    uint256 prop1 = _makeProposal(delegator);
    uint256 prop2 = _makeProposal(delegator);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    vm.warp(block.timestamp + DEQUEUE_FREQUENCY + 1);
    governance.dequeueProposalsIfReady();
    uint256 idx = _getDequeuedIndex(prop1);
    vm.prank(approver);
    governance.approve(prop1, idx);

    vm.prank(delegatee1);
    governance.upvote(prop2, 0, 0);

    vm.prank(delegatee1);
    governance.votePartially(prop1, idx, LOCKED_AMOUNT, 0, 0);

    (uint256 before, , ) = governance.getVoteTotals(prop1);
    assertEq(before, LOCKED_AMOUNT);

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    (uint256 after_, , ) = governance.getVoteTotals(prop1);
    assertEq(after_, SMALL_LOCK);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), SMALL_LOCK);
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), 0);
  }

  function test_ShouldMaintainCorrectTotals_WhenRedelegating() public {
    uint256 prop1 = _makeProposal(delegator);
    uint256 prop2 = _makeProposal(delegator);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    vm.warp(block.timestamp + DEQUEUE_FREQUENCY + 1);
    governance.dequeueProposalsIfReady();
    uint256 idx = _getDequeuedIndex(prop1);
    vm.prank(approver);
    governance.approve(prop1, idx);

    vm.prank(delegatee1);
    governance.upvote(prop2, 0, 0);

    vm.prank(delegatee1);
    governance.votePartially(prop1, idx, LOCKED_AMOUNT, 0, 0);

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.fixed1().unwrap());

    vm.prank(delegatee2);
    governance.votePartially(prop1, idx, LOCKED_AMOUNT, 0, 0);

    (uint256 total, , ) = governance.getVoteTotals(prop1);
    assertEq(total, LOCKED_AMOUNT + SMALL_LOCK);
  }

  function test_ShouldReduceVotes_WhenRevokingWithoutQueueUpvote() public {
    uint256 prop1 = _makeProposal(delegator);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    vm.warp(block.timestamp + DEQUEUE_FREQUENCY + 1);
    governance.dequeueProposalsIfReady();
    uint256 idx = _getDequeuedIndex(prop1);
    vm.prank(approver);
    governance.approve(prop1, idx);

    vm.prank(delegatee1);
    governance.votePartially(prop1, idx, LOCKED_AMOUNT, 0, 0);

    (uint256 before, , ) = governance.getVoteTotals(prop1);
    assertEq(before, LOCKED_AMOUNT);

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    (uint256 after_, , ) = governance.getVoteTotals(prop1);
    assertEq(after_, SMALL_LOCK);
  }

  function _makeProposal(address proposer) private returns (uint256) {
    uint256[] memory vals = new uint256[](0);
    address[] memory dests = new address[](0);
    bytes memory data = "";
    uint256[] memory lens = new uint256[](0);
    vm.prank(proposer);
    return governance.propose.value(MIN_DEPOSIT)(vals, dests, data, lens, "url");
  }

  function _getDequeuedIndex(uint256 propId) private view returns (uint256) {
    uint256[] memory ids = governance.getDequeue();
    for (uint256 i = 0; i < ids.length; i++) {
      if (ids[i] == propId) return i;
    }
    revert("not dequeued");
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IAccountsTest.sol";
import { ILockedGoldTest } from "@test-sol/unit/governance/voting/interfaces/ILockedGoldTest.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import { MockValidators08 } from "@test-sol/unit/governance/voting/mocks/MockValidators08.sol";
import { LockedGoldCompile } from "@test-sol/unit/governance/voting/mocks/LockedGoldCompile.sol";

// Minimal governance interface for GovernanceDelegation tests — avoids importing
// Proposals.sol (^0.5.13) which would conflict with the 0.8 compiler.
interface IGovernanceDelegationTest {
  function initialize(
    address registryAddress,
    address _approver,
    uint256 _concurrentProposals,
    uint256 _minDeposit,
    uint256 _queueExpiry,
    uint256 _dequeueFrequency,
    uint256 referendumStageDuration,
    uint256 executionStageDuration,
    uint256 participationBaseline,
    uint256 participationFloor,
    uint256 baselineUpdateFactor,
    uint256 baselineQuorumFactor
  ) external;
  function addValidator(address validator) external;
  function propose(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    string calldata descriptionUrl
  ) external payable returns (uint256);
  function upvote(uint256 proposalId, uint256 lesser, uint256 greater) external returns (bool);
  function approve(uint256 proposalId, uint256 index) external returns (bool);
  function votePartially(
    uint256 proposalId,
    uint256 index,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) external returns (bool);
  function dequeueProposalsIfReady() external;
  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256);
  function getDequeue() external view returns (uint256[] memory);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);
}

contract GovernanceDelegationTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  IAccountsTest accounts;
  ILockedGoldTest lockedGold;
  IGovernanceDelegationTest governance;
  MockElection election;
  MockValidators08 validators;

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

  function setUp() public override {
    super.setUp();

    address accountsAddress = actor("Accounts");
    deployCodeTo("Accounts.sol", abi.encode(true), accountsAddress);
    accounts = IAccountsTest(accountsAddress);

    LockedGoldCompile lockedGoldImpl = new LockedGoldCompile();
    lockedGold = ILockedGoldTest(address(lockedGoldImpl));

    address governanceAddress = actor("Governance");
    deployCodeTo("GovernanceMock08", governanceAddress);
    governance = IGovernanceDelegationTest(governanceAddress);

    election = new MockElection();
    validators = new MockValidators08();

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
    lockedGold.lock{ value: LOCKED_AMOUNT }();
    vm.prank(delegatee1);
    lockedGold.lock{ value: SMALL_LOCK }();
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
    assertEq(reported, LOCKED_AMOUNT, "should return referendum votes (higher than queue upvote)");
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

  function test_ShouldReturnLockedGold_WhenDelegatorUpvotesAfterDelegating() public {
    uint256 prop1 = _makeProposal(delegator);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.fixed1().unwrap());

    vm.prank(delegator);
    governance.upvote(prop1, 0, 0);

    uint256 reported = governance.getAmountOfGoldUsedForVoting(delegator);
    assertEq(reported, LOCKED_AMOUNT, "delegator upvote should report locked gold weight");
  }

  function _makeProposal(address proposer) private returns (uint256) {
    uint256[] memory vals = new uint256[](0);
    address[] memory dests = new address[](0);
    bytes memory data = "";
    uint256[] memory lens = new uint256[](0);
    vm.prank(proposer);
    return governance.propose{ value: MIN_DEPOSIT }(vals, dests, data, lens, "url");
  }

  function _getDequeuedIndex(uint256 propId) private view returns (uint256) {
    uint256[] memory ids = governance.getDequeue();
    for (uint256 i = 0; i < ids.length; i++) {
      if (ids[i] == propId) return i;
    }
    revert("not dequeued");
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.9.0;

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
  function getProposal(
    uint256 proposalId
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool);
  function getVoteRecord(
    address account,
    uint256 index
  ) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
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

  // --- Delegation accounting: a delegator's recorded votes stay in step with its
  // --- voting power when it unlocks.

  // When a delegator unlocks the delegated slice after voting, its own recorded
  // referendum votes are brought down to its reduced voting power, just like the
  // delegatee's, so recorded votes never exceed the stake backing them.
  function test_ShouldClampDelegatorOwnVotes_WhenUnlockingAfterVoting() public {
    uint256 half = FixidityLib.newFixedFraction(1, 2).unwrap();
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    // delegator (1000 locked) delegates 50% to delegatee2 (no own lock).
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, half);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 500 ether);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), 500 ether);

    vm.prank(delegator);
    governance.votePartially(prop, idx, 500 ether, 0, 0);
    vm.prank(delegatee2);
    governance.votePartially(prop, idx, 500 ether, 0, 0);

    (uint256 yesBefore, , ) = governance.getVoteTotals(prop);
    assertEq(yesBefore, 1000 ether, "both sides voted");

    // Unlock the whole delegated slice.
    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    // Delegator power halved, and its recorded vote is clamped to match.
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 250 ether, "power");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 250 ether, "own vote clamped");
    // Delegatee clamp (pre-existing behaviour) still applies.
    assertEq(governance.getAmountOfGoldUsedForVoting(delegatee2), 250 ether, "delegatee clamped");

    // The tally equals the voting power still backed by locked CELO.
    (uint256 yesAfter, , ) = governance.getVoteTotals(prop);
    assertEq(yesAfter, 500 ether, "tally matches backed voting power");
    assertEq(
      yesAfter,
      lockedGold.getAccountTotalGovernanceVotingPower(delegator) +
        lockedGold.getAccountTotalGovernanceVotingPower(delegatee2),
      "tally == backed voting power"
    );
  }

  // The clamp only reduces when needed: a delegator that voted below its post-unlock
  // power keeps its full recorded vote.
  function test_ShouldNotReduceDelegatorVotes_WhenStillBackedAfterUnlock() public {
    uint256 half = FixidityLib.newFixedFraction(1, 2).unwrap();
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, half);

    // delegator votes only 200 of its 500 power.
    vm.prank(delegator);
    governance.votePartially(prop, idx, 200 ether, 0, 0);

    // Unlock the delegated slice; new own power is 250 >= 200, so no clamp.
    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 250 ether, "power");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 200 ether, "vote unchanged");
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 200 ether, "tally unchanged");
  }

  // The raw guard still blocks unlocking more than the delegated slice while the
  // delegator is voting its full own power.
  function test_ShouldRevert_WhenUnlockingBeyondDelegatedSliceWhileVoting() public {
    uint256 half = FixidityLib.newFixedFraction(1, 2).unwrap();
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, half);
    vm.prank(delegator);
    governance.votePartially(prop, idx, 500 ether, 0, 0);

    vm.prank(delegator);
    vm.expectRevert("Not enough unlockable celo. Celo is locked in voting.");
    lockedGold.unlock(500 ether + 1);
  }

  // When the unlock clamps a delegator's votes, the proposal's network weight (the quorum
  // denominator) is refreshed to the reduced locked total, matching the revoke path; otherwise
  // participation would be scored against a stale, larger denominator.
  function test_ShouldRefreshNetworkWeight_WhenClampingVotesOnUnlock() public {
    uint256 half = FixidityLib.newFixedFraction(1, 2).unwrap();
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, half);
    vm.prank(delegator);
    governance.votePartially(prop, idx, 500 ether, 0, 0);
    vm.prank(delegatee2);
    governance.votePartially(prop, idx, 500 ether, 0, 0);

    uint256 lockedBefore = lockedGold.getTotalLockedGold();
    (, , , , , uint256 nwBefore, ) = governance.getProposal(prop);
    assertEq(nwBefore, lockedBefore, "network weight tracks locked total at vote time");

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    uint256 lockedAfter = lockedGold.getTotalLockedGold();
    assertEq(lockedAfter, lockedBefore - 500 ether, "unlock reduced the locked total");
    (, , , , , uint256 nwAfter, ) = governance.getProposal(prop);
    assertEq(nwAfter, lockedAfter, "network weight refreshed to the reduced locked total");
  }

  // The same refresh applies when the unlock clamps a delegatee's votes while the delegator
  // itself cast none: the delegatee's clamp runs as part of the unlock, so the network weight
  // it records must be the locked total after the unlock, not before it.
  function test_ShouldRefreshNetworkWeight_WhenClampingDelegateeVotesOnUnlock() public {
    uint256 half = FixidityLib.newFixedFraction(1, 2).unwrap();
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, half);
    // Only the delegatee votes, with its full delegated power.
    vm.prank(delegatee2);
    governance.votePartially(prop, idx, 500 ether, 0, 0);

    uint256 lockedBefore = lockedGold.getTotalLockedGold();

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    uint256 lockedAfter = lockedGold.getTotalLockedGold();
    assertEq(lockedAfter, lockedBefore - 500 ether, "unlock reduced the locked total");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegatee2), 250 ether, "delegatee clamped");
    (, , , , , uint256 nwAfter, ) = governance.getProposal(prop);
    assertEq(nwAfter, lockedAfter, "network weight refreshed to the reduced locked total");
  }

  // --- Per-record split: the clamp scales yes/no/abstain, not only the total.

  function test_ShouldClampEachVoteTypeProportionally_WhenUnlocking() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();

    vm.prank(delegator);
    governance.votePartially(prop, idx, 200 ether, 200 ether, 100 ether);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    (uint256 recordProp, , , uint256 yes, uint256 no, uint256 abstain) = governance.getVoteRecord(
      delegator,
      idx
    );
    assertEq(recordProp, prop, "record still points at the proposal");
    assertEq(yes, 100 ether, "yes halved");
    assertEq(no, 100 ether, "no halved");
    assertEq(abstain, 50 ether, "abstain halved");

    (uint256 totalYes, uint256 totalNo, uint256 totalAbstain) = governance.getVoteTotals(prop);
    assertEq(totalYes, yes, "yes tally follows the record");
    assertEq(totalNo, no, "no tally follows the record");
    assertEq(totalAbstain, abstain, "abstain tally follows the record");
  }

  // Amounts that do not divide evenly: the rounding remainder is still removed, so the record
  // sums to exactly the new power and no vote type grows.
  function test_ShouldClampToExactPower_WhenProportionsRound() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();

    uint256 yesBefore = 333 ether + 1;
    uint256 noBefore = 100 ether + 3;
    uint256 abstainBefore = 500 ether - yesBefore - noBefore;
    vm.prank(delegator);
    governance.votePartially(prop, idx, yesBefore, noBefore, abstainBefore);

    vm.prank(delegator);
    lockedGold.unlock(333 ether + 7);

    uint256 power = lockedGold.getAccountTotalGovernanceVotingPower(delegator);
    (, , , uint256 yes, uint256 no, uint256 abstain) = governance.getVoteRecord(delegator, idx);
    assertEq(yes + no + abstain, power, "record sums to exactly the new power");
    assertLe(yes, yesBefore, "yes did not grow");
    assertLe(no, noBefore, "no did not grow");
    assertLe(abstain, abstainBefore, "abstain did not grow");

    (uint256 totalYes, uint256 totalNo, uint256 totalAbstain) = governance.getVoteTotals(prop);
    assertEq(totalYes, yes, "yes tally follows the record");
    assertEq(totalNo, no, "no tally follows the record");
    assertEq(totalAbstain, abstain, "abstain tally follows the record");
  }

  // --- Shapes of delegation.

  function test_ShouldClampEveryParty_WhenDelegatorHasSeveralDelegatees() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    // 25% to delegatee1 (1 wei own lock), 50% to delegatee2 (no own lock), 25% kept.
    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(1, 4).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(1, 2).unwrap());
    vm.stopPrank();

    _voteFullPower(delegator, prop, idx);
    _voteFullPower(delegatee1, prop, idx);
    _voteFullPower(delegatee2, prop, idx);
    (uint256 yesBefore, , ) = governance.getVoteTotals(prop);
    assertEq(yesBefore, LOCKED_AMOUNT + SMALL_LOCK, "everyone voted full power");

    vm.prank(delegator);
    lockedGold.unlock(400 ether);

    assertEq(lockedGold.totalDelegatedCelo(delegatee1), 150 ether, "delegatee1 delegated amount");
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), 300 ether, "delegatee2 delegated amount");
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 150 ether, "own power");
    _assertVotesEqualPower(delegator);
    _assertVotesEqualPower(delegatee1);
    _assertVotesEqualPower(delegatee2);

    (uint256 yesAfter, , ) = governance.getVoteTotals(prop);
    assertEq(yesAfter, 600 ether + SMALL_LOCK, "tally equals the stake still locked");
    (, , , , , uint256 networkWeight, ) = governance.getProposal(prop);
    assertEq(networkWeight, lockedGold.getTotalLockedGold(), "network weight refreshed");
  }

  // Power delegated to the unlocking account by someone else is not reduced by its own unlock.
  function test_ShouldKeepIncomingDelegation_WhenDelegatorIsAlsoDelegatee() public {
    address whale = actor("whale");
    _lockAs(whale, 400 ether);
    vm.prank(whale);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.fixed1().unwrap());

    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 900 ether, "500 + 400");
    _voteFullPower(delegator, prop, idx);

    vm.prank(delegator);
    lockedGold.unlock(100 ether);

    assertEq(lockedGold.totalDelegatedCelo(delegator), 400 ether, "incoming delegation untouched");
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 850 ether, "450 + 400");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 850 ether, "clamped to new power");
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 850 ether, "tally follows");
  }

  // An account may delegate a share to itself. Its unlock must still go through and leave its
  // recorded votes within its reduced power.
  function test_ShouldClampVotes_WhenDelegatorDelegatesToItself() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.newFixedFraction(1, 10).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(8, 10).unwrap());
    vm.stopPrank();
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 200 ether, "100 + 100");
    _voteFullPower(delegator, prop, idx);

    vm.prank(delegator);
    lockedGold.unlock(100 ether);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 180 ether, "90 + 90");
    _assertVotesEqualPower(delegator);
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 180 ether, "tally follows");
  }

  // An unlock the voting guard allows (votes fit in what stays locked) must not revert just
  // because part of the stake is delegated back to the account itself.
  function test_ShouldAllowGuardedUnlock_WhenSelfDelegatorVotedAboveReducedPower() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.newFixedFraction(1, 10).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(4, 10).unwrap());
    vm.stopPrank();
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 600 ether, "500 + 100");
    vm.prank(delegator);
    governance.votePartially(prop, idx, 500 ether, 0, 0);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 300 ether, "250 + 50");
    assertEq(lockedGold.totalDelegatedCelo(delegator), 50 ether, "self-delegated amount halved");
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), 200 ether, "other delegation halved");
    _assertVotesEqualPower(delegator);
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 300 ether, "tally follows");
    (, , , , , uint256 networkWeight, ) = governance.getProposal(prop);
    assertEq(networkWeight, lockedGold.getTotalLockedGold(), "network weight refreshed");
  }

  function test_ShouldKeepVotes_WhenFullySelfDelegatedStakeStillBacksThem() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.fixed1().unwrap());
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), LOCKED_AMOUNT);
    vm.prank(delegator);
    governance.votePartially(prop, idx, 600 ether, 0, 0);

    vm.prank(delegator);
    lockedGold.unlock(400 ether);

    assertEq(lockedGold.totalDelegatedCelo(delegator), 600 ether, "self-delegated amount reduced");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 600 ether, "votes untouched");
    _assertVotesEqualPower(delegator);
  }

  function test_ShouldReduceSelfDelegatedAmount_WhenSelfDelegatorNeverVoted() public {
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.newFixedFraction(1, 2).unwrap());

    vm.prank(delegator);
    lockedGold.unlock(400 ether);

    assertEq(lockedGold.totalDelegatedCelo(delegator), 300 ether, "half of what stays locked");
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 600 ether, "300 + 300");
  }

  // Self-delegation must not shield the other delegatees: their votes are still clamped.
  function test_ShouldStillClampOtherDelegatee_WhenDelegatorAlsoDelegatesToItself() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.newFixedFraction(1, 10).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(8, 10).unwrap());
    vm.stopPrank();
    _voteFullPower(delegator, prop, idx);
    _voteFullPower(delegatee2, prop, idx);
    uint256 delegateeVotesBefore = governance.getAmountOfGoldUsedForVoting(delegatee2);

    vm.prank(delegator);
    lockedGold.unlock(100 ether);

    assertEq(
      governance.getAmountOfGoldUsedForVoting(delegatee2),
      delegateeVotesBefore - 80 ether,
      "delegatee loses its share of the unlock"
    );
    _assertVotesEqualPower(delegatee2);
    _assertVotesEqualPower(delegator);
  }

  // Revoking a self-delegation only moves the share back to the undelegated side, so the
  // account's power is unchanged and none of its votes may be removed.
  function test_ShouldKeepVotes_WhenRevokingSelfDelegation() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegator, FixidityLib.newFixedFraction(1, 2).unwrap());
    _voteFullPower(delegator, prop, idx);

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegator,
      FixidityLib.newFixedFraction(1, 2).unwrap()
    );

    assertEq(lockedGold.totalDelegatedCelo(delegator), 0, "nothing left self-delegated");
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), LOCKED_AMOUNT);
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), LOCKED_AMOUNT, "votes kept");
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, LOCKED_AMOUNT, "tally untouched");
  }

  function test_ShouldRemoveAllDelegateeVotes_WhenFullyDelegatedStakeIsUnlocked() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.fixed1().unwrap());
    _voteFullPower(delegatee2, prop, idx);

    vm.prank(delegator);
    lockedGold.unlock(LOCKED_AMOUNT);

    assertEq(lockedGold.totalDelegatedCelo(delegatee2), 0, "nothing left delegated");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegatee2), 0, "delegatee votes removed");
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(prop);
    assertEq(yes + no + abstain, 0, "tally emptied");
    (, , , , , uint256 networkWeight, ) = governance.getProposal(prop);
    assertEq(networkWeight, lockedGold.getTotalLockedGold(), "network weight refreshed");
  }

  // --- Sequences.

  function test_ShouldKeepVotesWithinPower_WhenUnlockingInSeveralSteps() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegator, prop, idx);
    _voteFullPower(delegatee2, prop, idx);

    uint256[3] memory steps = [uint256(100 ether), 250 ether, 150 ether];
    for (uint256 i = 0; i < steps.length; i++) {
      vm.prank(delegator);
      lockedGold.unlock(steps[i]);

      _assertVotesEqualPower(delegator);
      _assertVotesEqualPower(delegatee2);
      (uint256 yes, , ) = governance.getVoteTotals(prop);
      assertEq(yes, lockedGold.getAccountTotalLockedGold(delegator), "tally equals locked stake");
    }
  }

  // Relocking restores voting power but not the votes that were removed; the account has to
  // vote again to use it.
  function test_ShouldNotRestoreClampedVotes_WhenRelocking() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegator, prop, idx);

    vm.startPrank(delegator);
    lockedGold.unlock(500 ether);
    lockedGold.relock(0, 500 ether);
    vm.stopPrank();

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegator),
      500 ether,
      "power is back"
    );
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 250 ether, "votes stay clamped");
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 250 ether, "tally stays clamped");

    _voteFullPower(delegator, prop, idx);
    (yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 500 ether, "voting again uses the restored power");
  }

  function test_ShouldClampVotesOnEveryReferendumProposal_WhenUnlocking() public {
    uint256 half = FixidityLib.newFixedFraction(1, 2).unwrap();
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, half);

    uint256 prop1 = _referendumProposal();
    uint256 prop2 = _referendumProposal();
    uint256 idx1 = _getDequeuedIndex(prop1);
    uint256 idx2 = _getDequeuedIndex(prop2);

    vm.startPrank(delegator);
    governance.votePartially(prop1, idx1, 500 ether, 0, 0);
    governance.votePartially(prop2, idx2, 0, 400 ether, 0);
    lockedGold.unlock(500 ether);
    vm.stopPrank();

    (uint256 yes1, , ) = governance.getVoteTotals(prop1);
    (, uint256 no2, ) = governance.getVoteTotals(prop2);
    assertEq(yes1, 250 ether, "first proposal clamped");
    assertEq(no2, 250 ether, "second proposal clamped");
    (, , , , , uint256 networkWeight1, ) = governance.getProposal(prop1);
    (, , , , , uint256 networkWeight2, ) = governance.getProposal(prop2);
    assertEq(networkWeight1, lockedGold.getTotalLockedGold(), "first network weight refreshed");
    assertEq(networkWeight2, lockedGold.getTotalLockedGold(), "second network weight refreshed");
  }

  // --- Cases the clamp must leave alone.

  function test_ShouldNotTouchProposal_WhenDelegatorNeverVoted() public {
    (uint256 prop, ) = _delegateHalfAndOpenReferendum();
    (, , , , , uint256 networkWeightBefore, ) = governance.getProposal(prop);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(prop);
    assertEq(yes + no + abstain, 0, "no votes appeared");
    (, , , , , uint256 networkWeightAfter, ) = governance.getProposal(prop);
    assertEq(networkWeightAfter, networkWeightBefore, "network weight only moves with a clamp");
    assertEq(
      lockedGold.totalDelegatedCelo(delegatee2),
      250 ether,
      "delegated amount still reduced"
    );
  }

  function test_ShouldNotClamp_WhenAccountHasNoDelegation() public {
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    governance.votePartially(prop, idx, 500 ether, 0, 0);
    (, , , , , uint256 networkWeightBefore, ) = governance.getProposal(prop);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 500 ether, "votes unchanged");
    (, , , , , uint256 networkWeightAfter, ) = governance.getProposal(prop);
    assertEq(networkWeightAfter, networkWeightBefore, "network weight unchanged");
  }

  // Votes on a proposal that has left the Referendum stage are final.
  function test_ShouldNotClampVotes_WhenProposalLeftReferendum() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegator, prop, idx);
    _voteFullPower(delegatee2, prop, idx);
    (, , , , , uint256 networkWeightBefore, ) = governance.getProposal(prop);

    vm.warp(block.timestamp + REFERENDUM_DURATION + 1);
    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 1000 ether, "tally frozen");
    (, , , , , uint256 networkWeightAfter, ) = governance.getProposal(prop);
    assertEq(networkWeightAfter, networkWeightBefore, "network weight frozen");
    assertEq(
      lockedGold.totalDelegatedCelo(delegatee2),
      250 ether,
      "delegated amount still reduced"
    );
  }

  // --- Validator locked-gold requirement.

  function test_ShouldRevertAndKeepVotes_WhenUnlockBreaksLockedGoldRequirement() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegator, prop, idx);
    _voteFullPower(delegatee2, prop, idx);
    validators.setAccountLockedGoldRequirement(delegator, 500 ether + 1);

    vm.prank(delegator);
    vm.expectRevert(
      "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
    );
    lockedGold.unlock(500 ether);

    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 1000 ether, "tally untouched");
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), 500 ether, "delegation untouched");
  }

  function test_ShouldClampVotes_WhenUnlockKeepsLockedGoldRequirement() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegator, prop, idx);
    validators.setAccountLockedGoldRequirement(delegator, 500 ether);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 250 ether, "own vote clamped");
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, 250 ether, "tally follows");
  }

  // --- Revoke path shares the clamp, so it refreshes the network weight too.

  function test_ShouldRefreshNetworkWeight_WhenClampingOnRevoke() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegatee2, prop, idx);

    // The locked total moves after the vote without anyone voting.
    _lockAs(actor("latecomer"), 300 ether);
    (, , , , , uint256 networkWeightBefore, ) = governance.getProposal(prop);
    assertEq(networkWeightBefore + 300 ether, lockedGold.getTotalLockedGold(), "weight is stale");

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(1, 4).unwrap()
    );

    assertEq(governance.getAmountOfGoldUsedForVoting(delegatee2), 250 ether, "delegatee clamped");
    (, , , , , uint256 networkWeightAfter, ) = governance.getProposal(prop);
    assertEq(networkWeightAfter, lockedGold.getTotalLockedGold(), "network weight refreshed");
  }

  // --- Records written before partial voting keep their weight in the deprecated fields.

  function test_ShouldClampLegacyYesRecord_WhenUnlocking() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    _voteFullPower(delegator, prop, idx);
    _rewriteRecordAsLegacy(delegator, idx, 3);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    (
      ,
      uint256 legacyValue,
      uint256 legacyWeight,
      uint256 yes,
      uint256 no,
      uint256 abstain
    ) = governance.getVoteRecord(delegator, idx);
    assertEq(legacyValue, 0, "legacy value retired");
    assertEq(legacyWeight, 0, "legacy weight retired");
    assertEq(yes, 250 ether, "weight moved to yes and clamped");
    assertEq(no + abstain, 0, "other vote types stay empty");
    assertEq(governance.getAmountOfGoldUsedForVoting(delegator), 250 ether, "used votes clamped");
    (uint256 totalYes, uint256 totalNo, uint256 totalAbstain) = governance.getVoteTotals(prop);
    assertEq(totalYes, 250 ether, "yes tally reduced by the removed votes only");
    assertEq(totalNo + totalAbstain, 0, "other tallies untouched");
  }

  function test_ShouldClampLegacyNoRecord_WhenUnlocking() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    vm.prank(delegator);
    governance.votePartially(prop, idx, 0, 500 ether, 0);
    _voteFullPower(delegatee2, prop, idx);
    _rewriteRecordAsLegacy(delegator, idx, 2);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    (, , uint256 legacyWeight, uint256 yes, uint256 no, uint256 abstain) = governance.getVoteRecord(
      delegator,
      idx
    );
    assertEq(legacyWeight, 0, "legacy weight retired");
    assertEq(no, 250 ether, "weight moved to no and clamped");
    assertEq(yes + abstain, 0, "other vote types stay empty");
    (uint256 totalYes, uint256 totalNo, ) = governance.getVoteTotals(prop);
    assertEq(totalNo, 250 ether, "no tally reduced");
    assertEq(totalYes, 250 ether, "only the delegatee's clamped yes votes remain");
  }

  function test_ShouldLeaveLegacyRecordAsIs_WhenStillBackedAfterUnlock() public {
    (uint256 prop, uint256 idx) = _delegateHalfAndOpenReferendum();
    vm.prank(delegator);
    governance.votePartially(prop, idx, 200 ether, 0, 0);
    _rewriteRecordAsLegacy(delegator, idx, 3);

    vm.prank(delegator);
    lockedGold.unlock(500 ether);

    (, uint256 legacyValue, uint256 legacyWeight, uint256 yes, , ) = governance.getVoteRecord(
      delegator,
      idx
    );
    assertEq(legacyValue, 3, "legacy value kept");
    assertEq(legacyWeight, 200 ether, "legacy weight kept");
    assertEq(yes, 0, "record not converted");
    (uint256 totalYes, , ) = governance.getVoteTotals(prop);
    assertEq(totalYes, 200 ether, "tally unchanged");
  }

  // --- Property: whatever is delegated and unlocked, nobody's recorded votes exceed their power.

  function testFuzz_ShouldKeepVotesBackedByPower_WhenUnlocking(
    uint256 delegatedPercent,
    uint256 unlockAmount
  ) public {
    delegatedPercent = bound(delegatedPercent, 1, 99);
    uint256 prop = _referendumProposal();
    uint256 idx = _getDequeuedIndex(prop);

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(delegatedPercent, 100).unwrap()
    );
    _voteFullPower(delegator, prop, idx);
    _voteFullPower(delegatee2, prop, idx);

    // The raw guard allows unlocking down to the delegator's own recorded votes.
    uint256 maxUnlock = LOCKED_AMOUNT - governance.getAmountOfGoldUsedForVoting(delegator);
    unlockAmount = bound(unlockAmount, 1, maxUnlock);
    vm.prank(delegator);
    lockedGold.unlock(unlockAmount);

    uint256 delegatorVotes = governance.getAmountOfGoldUsedForVoting(delegator);
    uint256 delegateeVotes = governance.getAmountOfGoldUsedForVoting(delegatee2);
    assertLe(
      delegatorVotes,
      lockedGold.getAccountTotalGovernanceVotingPower(delegator),
      "delegator votes within power"
    );
    assertLe(
      delegateeVotes,
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee2),
      "delegatee votes within power"
    );
    (uint256 yes, , ) = governance.getVoteTotals(prop);
    assertEq(yes, delegatorVotes + delegateeVotes, "tally equals the recorded votes");
    assertLe(yes, lockedGold.getAccountTotalLockedGold(delegator), "tally within locked stake");
  }

  // Delegator (1000 locked) delegates 50% to delegatee2 (no own lock) and a proposal is put
  // into the Referendum stage.
  function _delegateHalfAndOpenReferendum() private returns (uint256 prop, uint256 idx) {
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(1, 2).unwrap());
    prop = _referendumProposal();
    idx = _getDequeuedIndex(prop);
  }

  function _voteFullPower(address voter, uint256 prop, uint256 idx) private {
    uint256 power = lockedGold.getAccountTotalGovernanceVotingPower(voter);
    vm.prank(voter);
    governance.votePartially(prop, idx, power, 0, 0);
  }

  function _assertVotesEqualPower(address voter) private {
    assertEq(
      governance.getAmountOfGoldUsedForVoting(voter),
      lockedGold.getAccountTotalGovernanceVotingPower(voter),
      "recorded votes equal voting power"
    );
  }

  function _lockAs(address account, uint256 amount) private {
    vm.deal(account, amount);
    vm.startPrank(account);
    accounts.createAccount();
    lockedGold.lock{ value: amount }();
    vm.stopPrank();
  }

  // Rewrites an existing vote record into the pre-partial-voting layout: the whole weight in
  // deprecated_weight under `legacyValue` (1 abstain, 2 no, 3 yes), with yes/no/abstain zeroed.
  // The proposal's tallies are left as the vote recorded them.
  function _rewriteRecordAsLegacy(address voter, uint256 idx, uint256 legacyValue) private {
    (uint256 prop, , , uint256 yes, uint256 no, uint256 abstain) = governance.getVoteRecord(
      voter,
      idx
    );
    uint256 weight = yes + no + abstain;

    // voters is at slot 16; Voter.referendumVotes is its 4th slot; VoteRecord fields in order.
    uint256 voterSlot = uint256(keccak256(abi.encode(voter, uint256(16))));
    uint256 recordSlot = uint256(keccak256(abi.encode(idx, voterSlot + 3)));
    vm.store(address(governance), bytes32(recordSlot), bytes32(legacyValue));
    vm.store(address(governance), bytes32(recordSlot + 2), bytes32(weight));
    vm.store(address(governance), bytes32(recordSlot + 3), bytes32(0));
    vm.store(address(governance), bytes32(recordSlot + 4), bytes32(0));
    vm.store(address(governance), bytes32(recordSlot + 5), bytes32(0));

    // Guards the slot arithmetic above against storage layout changes.
    uint256 storedProp;
    uint256 storedValue;
    uint256 storedWeight;
    (storedProp, storedValue, storedWeight, yes, no, abstain) = governance.getVoteRecord(
      voter,
      idx
    );
    assertEq(storedProp, prop, "legacy rewrite kept the proposal id");
    assertEq(storedValue, legacyValue, "legacy value written");
    assertEq(storedWeight, weight, "legacy weight written");
    assertEq(yes + no + abstain, 0, "current fields cleared");
  }

  // Creates a proposal, moves it into the Referendum stage and approves it.
  function _referendumProposal() private returns (uint256 prop) {
    prop = _makeProposal(delegator);
    vm.warp(block.timestamp + DEQUEUE_FREQUENCY + 1);
    governance.dequeueProposalsIfReady();
    uint256 idx = _getDequeuedIndex(prop);
    vm.prank(approver);
    governance.approve(prop, idx);
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

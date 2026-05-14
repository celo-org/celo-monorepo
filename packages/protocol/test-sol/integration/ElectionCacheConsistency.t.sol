// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { FixidityLib } from "@celo-contracts/common/FixidityLib.sol";
import { Accounts } from "@celo-contracts/common/Accounts.sol";
import { Freezer } from "@celo-contracts/common/Freezer.sol";
// Imported so its bytecode lands in the artifacts; TestWithUtils.setupRegistry
// uses deployCodeTo("Registry.sol", ...).
import { Registry } from "@celo-contracts/common/Registry.sol";

import { Election } from "@celo-contracts/governance/Election.sol";
import { LockedGold } from "@celo-contracts/governance/LockedGold.sol";
import { Governance } from "@celo-contracts/governance/Governance.sol";
import { Proposals } from "@celo-contracts/governance/Proposals.sol";
import { MockValidators } from "@celo-contracts/governance/test/MockValidators.sol";
import { MockRandom } from "@celo-contracts/identity/test/MockRandom.sol";

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

contract ElectionCacheConsistencyTest is TestWithUtils {
  using FixidityLib for FixidityLib.Fraction;

  Accounts accounts;
  Election election;
  Freezer freezer;
  LockedGold lockedGold;
  MockValidators validators;
  MockRandom random;
  Governance governance;

  address voter = actor("voter");
  address approver = actor("approver");

  uint256 constant ELECTABLE_MIN = 1;
  uint256 constant ELECTABLE_MAX = 1;
  uint256 constant MAX_NUM_GROUPS = 3;

  uint256 constant UNLOCKING_PERIOD = 3 * 86400;

  uint256 constant MIN_DEPOSIT = 100;
  // Must outlive UNLOCKING_PERIOD so the proposal is still dequeueable when
  // the voter returns to cast a governance vote.
  uint256 constant QUEUE_EXPIRY = 30 * 86400;
  uint256 constant DEQUEUE_FREQUENCY = 60;
  uint256 constant REFERENDUM_DURATION = 5 * 60;
  uint256 constant EXECUTION_DURATION = 60;

  uint256 constant BIG_LOCK = 999 ether;
  uint256 constant BIG_VOTE_PER_GROUP = BIG_LOCK / 3;
  uint256 constant SMALL_LOCK = 8 wei;
  uint256 constant OVER_MAX_PER_GROUP = 1 wei;
  uint256 constant OVER_MAX_NUM_GROUPS = MAX_NUM_GROUPS + 1;

  address[] internal allGroups;
  address[] internal firstVoteGroups;
  address[] internal overMaxGroups;

  function setUp() public {
    setupRegistry();
    setupEpochManager();

    // constructor(true) bypasses the proxy initializer guard so initialize()
    // can be called directly on the impl.
    accounts = new Accounts(true);
    election = new Election(true);
    freezer = new Freezer(true);
    lockedGold = new LockedGold(true);
    validators = new MockValidators();
    random = new MockRandom();
    governance = new Governance(true);

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("Random", address(random));
    registry.setAddressFor("Governance", address(governance));

    accounts.initialize(REGISTRY_ADDRESS);

    election.initialize(
      REGISTRY_ADDRESS,
      ELECTABLE_MIN,
      ELECTABLE_MAX,
      MAX_NUM_GROUPS,
      FixidityLib.newFixedFraction(1, 100).unwrap()
    );

    lockedGold.initialize(REGISTRY_ADDRESS, UNLOCKING_PERIOD);

    governance.initialize(
      REGISTRY_ADDRESS,
      approver,
      1, // concurrentProposals
      MIN_DEPOSIT,
      QUEUE_EXPIRY,
      DEQUEUE_FREQUENCY,
      REFERENDUM_DURATION,
      EXECUTION_DURATION,
      FixidityLib.newFixedFraction(5, 10).unwrap(), // participationBaseline
      FixidityLib.newFixedFraction(5, 100).unwrap(), // participationFloor
      FixidityLib.newFixedFraction(1, 5).unwrap(), // baselineUpdateFactor
      FixidityLib.fixed1().unwrap() // baselineQuorumFactor
    );

    accounts.createAccount();
    vm.prank(voter);
    accounts.createAccount();

    // Pre-allocate MAX_NUM_GROUPS + OVER_MAX_NUM_GROUPS = 7 groups for the
    // single-cycle tests; multi-cycle tests allocate more on demand.
    address[] memory pre = _allocateGroups(MAX_NUM_GROUPS + OVER_MAX_NUM_GROUPS);
    for (uint256 i = 0; i < MAX_NUM_GROUPS; i++) {
      firstVoteGroups.push(pre[i]);
    }
    for (uint256 i = 0; i < OVER_MAX_NUM_GROUPS; i++) {
      overMaxGroups.push(pre[MAX_NUM_GROUPS + i]);
    }
  }

  function _allocateGroups(uint256 n) internal returns (address[] memory out) {
    out = new address[](n);
    address[] memory members = new address[](1);
    members[0] = actor("validatorMember");
    for (uint256 i = 0; i < n; i++) {
      address g = address(uint160(allGroups.length + 0x10));
      validators.setMembers(g, members);
      address greater = allGroups.length == 0 ? address(0) : allGroups[allGroups.length - 1];
      // markGroupEligible is restricted to the Validators contract.
      vm.prank(address(validators));
      election.markGroupEligible(g, address(0), greater);
      allGroups.push(g);
      out[i] = g;
    }
  }

  function test_singleCycle_cacheClearsOnRevoke() public {
    uint256 proposalId = _submitDummyProposal();

    _lockBigAndPopulateCache();
    assertAlmostEqual(election.cachedVotesByAccount(voter), BIG_LOCK, 3);

    _revokeAllPendingVotes();
    assertEq(election.cachedVotesByAccount(voter), 0);

    _unlockAndWithdrawAll();
    assertEq(election.cachedVotesByAccount(voter), 0);
    assertEq(lockedGold.getAccountTotalLockedGold(voter), 0);

    _relockTinyAndVoteOverMaxGroups();
    uint256 newVoteSum = OVER_MAX_NUM_GROUPS * OVER_MAX_PER_GROUP;
    assertEq(election.getTotalVotesByAccount(voter), newVoteSum);
    assertEq(lockedGold.getAccountTotalLockedGold(voter), SMALL_LOCK);

    timeTravel(DEQUEUE_FREQUENCY + 1);

    vm.prank(voter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(no, 0);
    assertEq(abstain, 0);
    assertEq(yes, SMALL_LOCK, "yes votes equal actual current lock");
    assertLt(yes, BIG_LOCK / 1000, "yes votes nowhere near historical lock");
  }

  function test_revokeClearsCache_flagOnDuringRevoke() public {
    _lockBigAndPopulateCache();

    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    _revokeAllPendingVotes();
    assertEq(election.cachedVotesByAccount(voter), 0);
  }

  function test_multiCycle_cacheClearsEveryRevoke() public {
    uint256 CYCLES = 11;
    uint256 PER_CYCLE_LOCK = 100 ether;

    address[] memory cycleGroups = _allocateGroups(CYCLES);
    address[] memory finalGroups = _allocateGroups(OVER_MAX_NUM_GROUPS);

    vm.deal(voter, PER_CYCLE_LOCK + SMALL_LOCK + 1 ether);

    for (uint256 i = 0; i < CYCLES; i++) {
      _runLockVoteRevokeCycle(PER_CYCLE_LOCK, cycleGroups[i]);
      assertEq(election.cachedVotesByAccount(voter), 0);
      assertEq(lockedGold.getAccountTotalLockedGold(voter), 0);
    }

    vm.prank(voter);
    lockedGold.lock.value(SMALL_LOCK)();
    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    for (uint256 i = 0; i < finalGroups.length; i++) {
      (address lesser, address greater) = _neighbors(finalGroups[i], OVER_MAX_PER_GROUP);
      vm.prank(voter);
      election.vote(finalGroups[i], OVER_MAX_PER_GROUP, lesser, greater);
    }
    assertGt(election.getGroupsVotedForByAccount(voter).length, MAX_NUM_GROUPS);

    uint256 proposalId = _submitDummyProposal();
    timeTravel(DEQUEUE_FREQUENCY + 1);

    vm.prank(voter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, SMALL_LOCK, "yes votes equal the current small lock, not the historical sum");
    assertLt(yes, CYCLES * PER_CYCLE_LOCK / 1000, "yes votes nowhere near accumulated historical locks");
  }

  // Same as test_multiCycle_cacheClearsEveryRevoke but with the mainnet
  // maxNumGroupsVotedFor = 10 instead of the test's shrunk 3.
  function test_multiCycle_mainnetMax_cacheClearsEveryRevoke() public {
    election.setMaxNumGroupsVotedFor(10);

    uint256 CYCLES = 11;
    uint256 PER_CYCLE_LOCK = 100 ether;
    uint256 mainnetPhaseDGroups = 11; // max + 1
    uint256 mainnetSmallLock = uint256(mainnetPhaseDGroups) * OVER_MAX_PER_GROUP + 4 wei;

    address[] memory cycleGroups = _allocateGroups(CYCLES);
    address[] memory finalGroups = _allocateGroups(mainnetPhaseDGroups);

    vm.deal(voter, PER_CYCLE_LOCK + mainnetSmallLock + 1 ether);

    for (uint256 i = 0; i < CYCLES; i++) {
      assertEq(election.allowedToVoteOverMaxNumberOfGroups(voter), false);
      _runLockVoteRevokeCycle(PER_CYCLE_LOCK, cycleGroups[i]);
      assertEq(election.cachedVotesByAccount(voter), 0);
    }

    vm.prank(voter);
    lockedGold.lock.value(mainnetSmallLock)();
    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    for (uint256 i = 0; i < finalGroups.length; i++) {
      (address lesser, address greater) = _neighbors(finalGroups[i], OVER_MAX_PER_GROUP);
      vm.prank(voter);
      election.vote(finalGroups[i], OVER_MAX_PER_GROUP, lesser, greater);
    }
    assertGt(election.getGroupsVotedForByAccount(voter).length, 10);

    uint256 proposalId = _submitDummyProposal();
    timeTravel(DEQUEUE_FREQUENCY + 1);

    vm.prank(voter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, mainnetSmallLock, "yes votes equal the current small lock under mainnet max");
  }

  function test_partialRevokePreservesCacheAccuracy() public {
    address[] memory groups = _allocateGroups(MAX_NUM_GROUPS + 1);

    uint256 perGroup = 100 ether;
    uint256 totalLock = uint256(groups.length) * perGroup;

    vm.deal(voter, totalLock + 1 ether);
    vm.prank(voter);
    lockedGold.lock.value(totalLock)();

    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    for (uint256 i = 0; i < groups.length; i++) {
      (address lesser, address greater) = _neighbors(groups[i], perGroup);
      vm.prank(voter);
      election.vote(groups[i], perGroup, lesser, greater);
    }
    assertEq(election.cachedVotesByAccount(voter), totalLock);

    uint256 halfRevoke = perGroup / 2;
    uint256 idx = _findGroupIndex(voter, groups[0]);
    (address dl, address dg) = _neighborsForDecrement(groups[0], halfRevoke);
    vm.prank(voter);
    election.revokePending(groups[0], halfRevoke, dl, dg, idx);

    assertEq(election.cachedVotesByAccount(voter), totalLock - halfRevoke);

    uint256 liveSum = 0;
    address[] memory voted = election.getGroupsVotedForByAccount(voter);
    for (uint256 i = 0; i < voted.length; i++) {
      liveSum = liveSum + election.getTotalVotesForGroupByAccount(voted[i], voter);
    }
    assertEq(election.cachedVotesByAccount(voter), liveSum);
    assertEq(election.getTotalVotesByAccount(voter), liveSum);
  }

  function test_voteBelowMaxThenAboveMax_cacheReflectsAllLiveVotes() public {
    address[] memory groups = _allocateGroups(MAX_NUM_GROUPS + 1);

    uint256 perGroup = 100 ether;
    uint256 totalLock = uint256(groups.length) * perGroup;

    vm.deal(voter, totalLock + 1 ether);
    vm.prank(voter);
    lockedGold.lock.value(totalLock)();

    for (uint256 i = 0; i < MAX_NUM_GROUPS; i++) {
      assertEq(election.allowedToVoteOverMaxNumberOfGroups(voter), false);
      (address lesser, address greater) = _neighbors(groups[i], perGroup);
      vm.prank(voter);
      election.vote(groups[i], perGroup, lesser, greater);
    }

    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
    (address lesser2, address greater2) = _neighbors(groups[MAX_NUM_GROUPS], perGroup);
    vm.prank(voter);
    election.vote(groups[MAX_NUM_GROUPS], perGroup, lesser2, greater2);

    assertEq(election.getTotalVotesByAccount(voter), totalLock);
    assertEq(election.cachedVotesByAccount(voter), totalLock);
  }

  function _runLockVoteRevokeCycle(uint256 lockAmount, address group) internal {
    vm.prank(voter);
    lockedGold.lock.value(lockAmount)();

    (address lesser, address greater) = _neighbors(group, lockAmount);
    vm.prank(voter);
    election.vote(group, lockAmount, lesser, greater);

    // updateTotalVotesByAccountForGroup is permissionless; no flag required.
    election.updateTotalVotesByAccountForGroup(voter, group);

    uint256 idx = _findGroupIndex(voter, group);
    (address dl, address dg) = _neighborsForDecrement(group, lockAmount);
    vm.prank(voter);
    election.revokePending(group, lockAmount, dl, dg, idx);

    vm.prank(voter);
    lockedGold.unlock(lockAmount);

    timeTravel(UNLOCKING_PERIOD + 1);
    blockTravel(1);

    vm.prank(voter);
    lockedGold.withdraw(0);
  }

  function _findGroupIndex(address account, address group) internal view returns (uint256) {
    address[] memory gs = election.getGroupsVotedForByAccount(account);
    for (uint256 i = 0; i < gs.length; i++) {
      if (gs[i] == group) return i;
    }
    revert("group not in voted list");
  }

  function _lockBigAndPopulateCache() internal {
    vm.deal(voter, BIG_LOCK + SMALL_LOCK + 1 ether);

    vm.prank(voter);
    lockedGold.lock.value(BIG_LOCK)();

    for (uint256 i = 0; i < firstVoteGroups.length; i++) {
      (address lesser, address greater) = _neighbors(firstVoteGroups[i], BIG_VOTE_PER_GROUP);
      vm.prank(voter);
      election.vote(firstVoteGroups[i], BIG_VOTE_PER_GROUP, lesser, greater);

      election.updateTotalVotesByAccountForGroup(voter, firstVoteGroups[i]);
    }

    uint256 cached = election.cachedVotesByAccount(voter);
    assertAlmostEqual(cached, BIG_LOCK, 3);
    assertEq(election.allowedToVoteOverMaxNumberOfGroups(voter), false);
  }

  function _revokeAllPendingVotes() internal {
    // Revoke in reverse so indices stay stable across deleteElement
    // (swap-with-last).
    for (uint256 i = firstVoteGroups.length; i > 0; i--) {
      address g = firstVoteGroups[i - 1];
      uint256 v = election.getPendingVotesForGroupByAccount(g, voter);
      (address lesser, address greater) = _neighborsForDecrement(g, v);
      vm.prank(voter);
      election.revokePending(g, v, lesser, greater, i - 1);
    }

    assertEq(election.getGroupsVotedForByAccount(voter).length, 0);
  }

  function _unlockAndWithdrawAll() internal {
    assertEq(
      lockedGold.getAccountNonvotingLockedGold(voter),
      BIG_LOCK,
      "non-voting balance should match BIG_LOCK after revokes"
    );

    vm.prank(voter);
    lockedGold.unlock(BIG_LOCK);

    timeTravel(UNLOCKING_PERIOD + 1);
    blockTravel(1);

    uint256 balBefore = voter.balance;
    vm.prank(voter);
    lockedGold.withdraw(0);
    assertEq(voter.balance, balBefore + BIG_LOCK, "withdraw should return BIG_LOCK");

    assertEq(lockedGold.getAccountTotalLockedGold(voter), 0);
  }

  function _relockTinyAndVoteOverMaxGroups() internal {
    vm.prank(voter);
    lockedGold.lock.value(SMALL_LOCK)();

    // groupsVotedFor.length == 0 here, so the flag flip is allowed.
    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    for (uint256 i = 0; i < overMaxGroups.length; i++) {
      (address lesser, address greater) = _neighbors(overMaxGroups[i], OVER_MAX_PER_GROUP);
      vm.prank(voter);
      election.vote(overMaxGroups[i], OVER_MAX_PER_GROUP, lesser, greater);
    }

    assertEq(
      election.getGroupsVotedForByAccount(voter).length,
      OVER_MAX_NUM_GROUPS,
      "voter should hold maxNumGroupsVotedFor+1 fresh groups"
    );
    assertGt(election.getGroupsVotedForByAccount(voter).length, MAX_NUM_GROUPS);
  }

  function _submitDummyProposal() internal returns (uint256) {
    uint256[] memory values = new uint256[](1);
    values[0] = 0;
    address[] memory destinations = new address[](1);
    destinations[0] = REGISTRY_ADDRESS;
    bytes memory data = abi.encodeWithSignature("setAddressFor(string,address)", "dummy", address(0x1));
    uint256[] memory dataLengths = new uint256[](1);
    dataLengths[0] = data.length;

    return governance.propose.value(MIN_DEPOSIT)(values, destinations, data, dataLengths, "url");
  }

  function _neighbors(address group, uint256 increment) internal view returns (address lesser, address greater) {
    (address[] memory keys, uint256[] memory vals) = election.getTotalVotesForEligibleValidatorGroups();
    uint256 newValue = election.getTotalVotesForGroup(group) + increment;
    return _findNeighbors(keys, vals, group, newValue);
  }

  function _neighborsForDecrement(address group, uint256 decrement) internal view returns (address lesser, address greater) {
    (address[] memory keys, uint256[] memory vals) = election.getTotalVotesForEligibleValidatorGroups();
    uint256 current = election.getTotalVotesForGroup(group);
    uint256 newValue = current >= decrement ? current - decrement : 0;
    return _findNeighbors(keys, vals, group, newValue);
  }

  // keys are sorted descending by value. Returns the next-lower and
  // next-higher neighbors of `group` at `newValue`, skipping `group` itself.
  function _findNeighbors(
    address[] memory keys,
    uint256[] memory vals,
    address group,
    uint256 newValue
  ) internal pure returns (address lesser, address greater) {
    greater = address(0);
    lesser = address(0);
    for (uint256 i = 0; i < keys.length; i++) {
      if (keys[i] == group) continue;
      if (vals[i] >= newValue) {
        greater = keys[i];
      } else {
        lesser = keys[i];
        break;
      }
    }
  }
}

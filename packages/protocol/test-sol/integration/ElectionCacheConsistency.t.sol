// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/Freezer.sol";
import "@celo-contracts/common/Registry.sol";

import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/governance/Governance.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/identity/test/MockRandom.sol";

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

// Tests that Election.cachedVotesByAccount stays consistent with live votes
// across the full lifecycle: lock -> vote -> updateTotalVotesByAccountForGroup
// -> revoke -> unlock -> withdraw -> relock. After a revoke, the per-group
// cache entry must reflect the current live votes for that group (zero after
// a full revoke), so getTotalVotesByAccount returns the correct sum when the
// cached branch is active (groups.length > maxNumGroupsVotedFor) and the
// downstream LockedGold + Governance accounting matches the voter's actual
// locked stake.
contract ElectionCacheConsistencyTest is TestWithUtils {
  using FixidityLib for FixidityLib.Fraction;

  // ---- contracts ----
  Accounts accounts;
  Election election;
  Freezer freezer;
  LockedGold lockedGold;
  MockValidators validators;
  MockRandom random;
  Governance governance;

  // ---- actors ----
  address voter = actor("voter");
  address proposer = address(this);
  address approver = actor("approver");

  // ---- election config ----
  uint256 constant ELECTABLE_MIN = 1;
  uint256 constant ELECTABLE_MAX = 1;
  uint256 constant MAX_NUM_GROUPS = 3;
  uint256 constant ELECTABILITY_THRESHOLD = 0; // permissive

  uint256 constant UNLOCKING_PERIOD = 3 * 86400;

  // ---- governance config ----
  uint256 constant MIN_DEPOSIT = 100;
  // Queue expiry must outlive the unlock period so the proposal is still
  // dequeuable when the voter comes back to cast the governance vote.
  uint256 constant QUEUE_EXPIRY = 30 * 86400;
  uint256 constant DEQUEUE_FREQUENCY = 60;
  uint256 constant REFERENDUM_DURATION = 5 * 60;
  uint256 constant EXECUTION_DURATION = 60;

  // ---- stake amounts ----
  uint256 constant BIG_LOCK = 999 ether;
  uint256 constant BIG_VOTE_PER_GROUP = BIG_LOCK / 3; // 333 ether
  uint256 constant SMALL_LOCK = 8 wei;
  uint256 constant OVER_MAX_PER_GROUP = 1 wei;
  uint256 constant OVER_MAX_NUM_GROUPS = MAX_NUM_GROUPS + 1; // 4

  // ---- group addresses ----
  address[] internal allGroups;
  address[] internal firstVoteGroups; // first 3 -- used to populate the cache
  address[] internal overMaxGroups; // next 4 -- voted past max to enter cached branch

  function setUp() public {
    // Registry (REGISTRY_ADDRESS) + MockEpochManager wired by TestWithUtils
    setupRegistry();
    setupEpochManager();

    // Deploy real impl contracts (constructor(true) so initializer can run on
    // the impl directly, no proxy needed for test).
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

    // Create proposer + voter as registered accounts (no vote-signer
    // authorization -- direct registered-account path).
    accounts.createAccount(); // proposer = address(this)
    vm.prank(voter);
    accounts.createAccount();

    // Make MockValidators report a small group with 1 member, so
    // canReceiveVotes() always passes. The single-cycle tests need 7 groups
    // total: MAX_NUM_GROUPS for the initial cache population + OVER_MAX_NUM_GROUPS
    // for the over-max final vote. Multi-cycle tests allocate more on demand
    // via _allocateGroups().
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
      address g = address(uint160(0xA000 + allGroups.length));
      validators.setMembers(g, members);
      address greater = allGroups.length == 0 ? address(0) : allGroups[allGroups.length - 1];
      // Mark eligible via Election; Election restricts this to the registered
      // Validators contract.
      vm.prank(address(validators));
      election.markGroupEligible(g, address(0), greater);
      allGroups.push(g);
      out[i] = g;
    }
  }

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  // Single-cycle scenario: lock big, populate the cache, revoke all votes,
  // unlock + withdraw, then relock a small stake and vote past max. The cache
  // must be cleared on the revoke, so the final governance voting power
  // equals the small current lock, not the historical large one.
  function test_singleCycle_cacheClearsOnRevoke() public {
    uint256 proposalId = _submitDummyProposal();

    _lockBigAndPopulateCache();
    // Cache is correctly populated by the public update function.
    assertAlmostEqual(election.cachedVotesByAccount(voter), BIG_LOCK, 3);

    _revokeAllPendingVotes();
    // Revoke refreshes the cache regardless of the over-max flag. Each
    // revoked group's slot becomes 0 and totalVotes drops to 0.
    assertEq(election.cachedVotesByAccount(voter), 0);

    _unlockAndWithdrawAll();
    assertEq(election.cachedVotesByAccount(voter), 0);
    assertEq(lockedGold.getAccountTotalLockedGold(voter), 0);

    _relockTinyAndVoteOverMaxGroups();
    // Cached branch is active (groups.length > max). The cache reflects only
    // the new small-stake votes -- the prior BIG_LOCK era is gone.
    uint256 newVoteSum = OVER_MAX_NUM_GROUPS * OVER_MAX_PER_GROUP;
    assertEq(election.getTotalVotesByAccount(voter), newVoteSum);
    assertEq(lockedGold.getAccountTotalLockedGold(voter), SMALL_LOCK);

    timeTravel(DEQUEUE_FREQUENCY + 1);

    vm.prank(voter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(no, 0);
    assertEq(abstain, 0);
    // Yes votes match the voter's actual current lock.
    assertEq(yes, SMALL_LOCK, "yes votes equal actual current lock");
    assertLt(yes, BIG_LOCK / 1000, "yes votes nowhere near historical lock");
  }

  // Same setup as the single-cycle scenario but with the over-max flag
  // enabled before the revoke. The cache must still be cleared.
  function test_revokeClearsCache_flagOnDuringRevoke() public {
    _lockBigAndPopulateCache();

    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    _revokeAllPendingVotes();
    assertEq(election.cachedVotesByAccount(voter), 0);
  }

  // Multi-cycle scenario: 11 lock-vote-cacheUpdate-revoke-unlock-withdraw
  // cycles on 11 distinct fresh groups, then a small relock and vote past
  // max. Because each cycle's revoke clears the corresponding cache slot,
  // nothing accumulates across cycles, and the final yes-vote weight equals
  // the voter's current small lock.
  function test_multiCycle_cacheClearsEveryRevoke() public {
    uint256 CYCLES = 11;
    uint256 PER_CYCLE_LOCK = 100 ether;

    address[] memory cycleGroups = _allocateGroups(CYCLES);
    address[] memory finalGroups = _allocateGroups(OVER_MAX_NUM_GROUPS);

    vm.deal(voter, PER_CYCLE_LOCK + SMALL_LOCK + 1 ether);

    for (uint256 i = 0; i < CYCLES; i++) {
      _runLockVoteRevokeCycle(PER_CYCLE_LOCK, cycleGroups[i]);
      // Each cycle's revoke clears the cache; it never accumulates.
      assertEq(election.cachedVotesByAccount(voter), 0);
      assertEq(lockedGold.getAccountTotalLockedGold(voter), 0);
    }

    // Relock a tiny stake, flip the over-max flag, vote past max on fresh
    // groups to enter the cached branch of getTotalVotesByAccount.
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

  // Same multi-cycle scenario with maxNumGroupsVotedFor switched to 10
  // (mainnet value). Confirms the same invariant holds under the mainnet
  // threshold, not just the test's shrunk MAX_NUM_GROUPS = 3.
  function test_multiCycle_mainnetMax_cacheClearsEveryRevoke() public {
    election.setMaxNumGroupsVotedFor(10);

    uint256 CYCLES = 11;
    uint256 PER_CYCLE_LOCK = 100 ether;
    uint256 mainnetPhaseDGroups = 11; // max + 1
    uint256 mainnetSmallLock = uint256(mainnetPhaseDGroups) * OVER_MAX_PER_GROUP + 4 wei;

    address[] memory cycleGroups = _allocateGroups(CYCLES);
    address[] memory finalGroups = _allocateGroups(mainnetPhaseDGroups);

    vm.deal(voter, PER_CYCLE_LOCK + mainnetSmallLock + 1 ether);

    // Cycles run with the over-max flag off (its default). Cache stays at 0
    // throughout.
    for (uint256 i = 0; i < CYCLES; i++) {
      assertEq(election.allowedToVoteOverMaxNumberOfGroups(voter), false);
      _runLockVoteRevokeCycle(PER_CYCLE_LOCK, cycleGroups[i]);
      assertEq(election.cachedVotesByAccount(voter), 0);
    }

    // Relock tiny + the ONE permissionless flag flip + vote past 10 fresh groups.
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

  // After a partial revoke, cache[g] should reflect the remaining live votes
  // on that group, so the cached branch of getTotalVotesByAccount returns the
  // accurate per-account total.
  function test_partialRevokePreservesCacheAccuracy() public {
    address[] memory groups = _allocateGroups(MAX_NUM_GROUPS + 1);

    uint256 perGroup = 100 ether;
    uint256 totalLock = uint256(groups.length) * perGroup;

    vm.deal(voter, totalLock + 1 ether);
    vm.prank(voter);
    lockedGold.lock.value(totalLock)();

    // Enable over-max so we can vote past the limit and exercise the cached
    // branch of getTotalVotesByAccount.
    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);

    for (uint256 i = 0; i < groups.length; i++) {
      (address lesser, address greater) = _neighbors(groups[i], perGroup);
      vm.prank(voter);
      election.vote(groups[i], perGroup, lesser, greater);
    }
    assertEq(election.cachedVotesByAccount(voter), totalLock);

    // Partial revoke: half the votes on the first group.
    uint256 halfRevoke = perGroup / 2;
    uint256 idx = _findGroupIndex(voter, groups[0]);
    (address dl, address dg) = _neighborsForDecrement(groups[0], halfRevoke);
    vm.prank(voter);
    election.revokePending(groups[0], halfRevoke, dl, dg, idx);

    // cache[g0] should now equal the remaining live votes (perGroup/2), so
    // totalVotes drops only by halfRevoke.
    assertEq(election.cachedVotesByAccount(voter), totalLock - halfRevoke);

    // Cross-check: cached total matches the sum of live votes on every group
    // the account is still voting for.
    uint256 liveSum = 0;
    address[] memory voted = election.getGroupsVotedForByAccount(voter);
    for (uint256 i = 0; i < voted.length; i++) {
      liveSum = liveSum + election.getTotalVotesForGroupByAccount(voted[i], voter);
    }
    assertEq(election.cachedVotesByAccount(voter), liveSum);
    assertEq(election.getTotalVotesByAccount(voter), liveSum);
  }

  // Vote on MAX_NUM_GROUPS groups while the over-max flag is OFF, then enable
  // the flag and vote one more fresh group. The cache must reflect the full
  // sum of live votes, not just the votes cast after the flag was turned on.
  function test_voteBelowMaxThenAboveMax_cacheReflectsAllLiveVotes() public {
    address[] memory groups = _allocateGroups(MAX_NUM_GROUPS + 1);

    uint256 perGroup = 100 ether;
    uint256 totalLock = uint256(groups.length) * perGroup;

    vm.deal(voter, totalLock + 1 ether);
    vm.prank(voter);
    lockedGold.lock.value(totalLock)();

    // First MAX_NUM_GROUPS votes happen with the over-max flag OFF.
    for (uint256 i = 0; i < MAX_NUM_GROUPS; i++) {
      assertEq(election.allowedToVoteOverMaxNumberOfGroups(voter), false);
      (address lesser, address greater) = _neighbors(groups[i], perGroup);
      vm.prank(voter);
      election.vote(groups[i], perGroup, lesser, greater);
    }

    // Enable the over-max flag and vote one more fresh group.
    vm.prank(voter);
    election.setAllowedToVoteOverMaxNumberOfGroups(true);
    (address lesser2, address greater2) = _neighbors(groups[MAX_NUM_GROUPS], perGroup);
    vm.prank(voter);
    election.vote(groups[MAX_NUM_GROUPS], perGroup, lesser2, greater2);

    // groups.length > maxNumGroupsVotedFor so the cached branch is now used.
    // It must return the full sum, not just the last vote.
    assertEq(election.getTotalVotesByAccount(voter), totalLock);
    assertEq(election.cachedVotesByAccount(voter), totalLock);
  }

  // -------------------------------------------------------------------------
  // Scenario helpers
  // -------------------------------------------------------------------------

  function _runLockVoteRevokeCycle(uint256 lockAmount, address group) internal {
    vm.prank(voter);
    lockedGold.lock.value(lockAmount)();

    (address lesser, address greater) = _neighbors(group, lockAmount);
    vm.prank(voter);
    election.vote(group, lockAmount, lesser, greater);

    // Public cache write -- callable by anyone, no flag required.
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

    // Vote BIG_VOTE_PER_GROUP on each of firstVoteGroups, then write the live
    // amounts into the cache via the public update.
    for (uint256 i = 0; i < firstVoteGroups.length; i++) {
      (address lesser, address greater) = _neighbors(firstVoteGroups[i], BIG_VOTE_PER_GROUP);
      vm.prank(voter);
      election.vote(firstVoteGroups[i], BIG_VOTE_PER_GROUP, lesser, greater);

      // Populate cache. allowedToVoteOverMaxNumberOfGroups stays FALSE.
      election.updateTotalVotesByAccountForGroup(voter, firstVoteGroups[i]);
    }

    // Sanity: cache reflects locked stake.
    uint256 cached = election.cachedVotesByAccount(voter);
    assertAlmostEqual(cached, BIG_LOCK, 3);
    assertEq(election.allowedToVoteOverMaxNumberOfGroups(voter), false);
  }

  function _revokeAllPendingVotes() internal {
    // Revoke in reverse so indices stay stable (deleteElement is swap-with-last).
    for (uint256 i = firstVoteGroups.length; i > 0; i--) {
      address g = firstVoteGroups[i - 1];
      uint256 v = election.getPendingVotesForGroupByAccount(g, voter);
      (address lesser, address greater) = _neighborsForDecrement(g, v);
      vm.prank(voter);
      election.revokePending(g, v, lesser, greater, i - 1);
    }

    // All groups removed from groupsVotedFor.
    assertEq(election.getGroupsVotedForByAccount(voter).length, 0);
  }

  function _unlockAndWithdrawAll() internal {
    // After revoke, all locked CELO is back in the non-voting balance.
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

    // groupsVotedFor.length == 0 <= maxNumGroupsVotedFor, so this is allowed.
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
    // Cached branch is now active.
    assertGt(election.getGroupsVotedForByAccount(voter).length, MAX_NUM_GROUPS);
  }

  // -------------------------------------------------------------------------
  // Governance plumbing
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Sorted-linked-list neighbor helpers
  //
  // For an incrementing vote on `group`, lesser/greater = neighbors after the
  // value moves to `newValue`. Easiest correct hint: the current head if the
  // new value beats it, else the position implied by current sorted list.
  // -------------------------------------------------------------------------

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

  // keys are sorted descending by value. Find lesser (next-lower != group) and
  // greater (next-higher != group) for `group` at `newValue`.
  function _findNeighbors(
    address[] memory keys,
    uint256[] memory vals,
    address group,
    uint256 newValue
  ) internal pure returns (address lesser, address greater) {
    greater = address(0); // first higher
    lesser = address(0);
    // walk descending
    for (uint256 i = 0; i < keys.length; i++) {
      if (keys[i] == group) continue;
      if (vals[i] >= newValue) {
        greater = keys[i]; // candidate higher (will keep updating until we find lower)
      } else {
        lesser = keys[i];
        break;
      }
    }
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "forge-std/console.sol";

import "../../../contracts/common/FixidityLib.sol";
import "../../../contracts/common/Registry.sol";
import "../../../contracts/common/Accounts.sol";
import "../../../contracts/common/test/MockGoldToken.sol";
import "../../../contracts/governance/LockedGold.sol";
import "../../../contracts/governance/ReleaseGold.sol";
import "../../../contracts/governance/Election.sol";
import "../../../contracts/stability/test/MockStableToken.sol";
import "../../../contracts/governance/test/MockElection.sol";
import "../../../contracts/governance/test/MockGovernance.sol";
import "../../../contracts/governance/test/MockValidators.sol";

contract LockedGoldFoundryTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  Accounts accounts;
  GoldToken goldToken;
  MockStableToken stableToken;
  MockElection election;
  MockGovernance governance;
  MockValidators validators;
  LockedGold lockedGold;
  ReleaseGold releaseGold;

  uint256 HOUR = 60 * 60;
  uint256 DAY = 24 * HOUR;
  uint256 unlockingPeriod = 3 * DAY;

  address randomAddress = actor("randomAddress");

  event UnlockingPeriodSet(uint256 period);
  event GoldLocked(address indexed account, uint256 value);
  event GoldUnlocked(address indexed account, uint256 value, uint256 available);
  event GoldRelocked(address indexed account, uint256 value);
  event GoldWithdrawn(address indexed account, uint256 value);
  event SlasherWhitelistAdded(string indexed slasherIdentifier);
  event SlasherWhitelistRemoved(string indexed slasherIdentifier);
  event AccountSlashed(
    address indexed slashed,
    uint256 penalty,
    address indexed reporter,
    uint256 reward
  );
  event CeloDelegated(
    address indexed delegator,
    address indexed delegatee,
    uint256 percent,
    uint256 amount
  );
  event DelegatedCeloRevoked(
    address indexed delegator,
    address indexed delegatee,
    uint256 percent,
    uint256 amount
  );
  event MaxDelegateesCountSet(uint256 value);

  function setUp() public {
    address registryAddress = 0x000000000000000000000000000000000000ce10;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    goldToken = new MockGoldToken();
    accounts = new Accounts(true);
    lockedGold = new LockedGold(true);
    election = new MockElection();
    validators = new MockValidators();
    governance = new MockGovernance();
    stableToken = new MockStableToken();

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Governance", address(governance));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("StableToken", address(stableToken));
    lockedGold.initialize(address(registry), unlockingPeriod);
    accounts.createAccount();
  }
}

contract Initialize is LockedGoldFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetOwner() public {
    assertEq(lockedGold.owner(), address(this));
  }

  function test_ShouldSetRegistryAddress() public {
    assertEq(address(lockedGold.registry()), address(registry));
  }

  function test_ShouldSetUnlockingPeriod() public {
    assertEq(lockedGold.unlockingPeriod(), unlockingPeriod);
  }

  function test_ShouldRevertIfAlreadyInitialized() public {
    vm.expectRevert("contract already initialized");
    lockedGold.initialize(address(registry), unlockingPeriod);
  }
}

contract SetRegistry is LockedGoldFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetTheRegistryWhenCalledByTheOwner() public {
    address newRegistry = actor("newAddress");
    lockedGold.setRegistry(newRegistry);
    assertEq(address(lockedGold.registry()), newRegistry);
  }

  function test_ShouldRevertWhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    lockedGold.setRegistry(address(0));
  }
}

contract SetUnlockingPeriod is LockedGoldFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetTheUnlockingPeriod() public {
    uint256 newUnlockingPeriod = 100;
    lockedGold.setUnlockingPeriod(newUnlockingPeriod);
    assertEq(lockedGold.unlockingPeriod(), newUnlockingPeriod);
  }

  function test_ShouldEmitUnlockingPEriodSetEvent() public {
    uint256 newUnlockingPeriod = 100;
    vm.expectEmit(true, true, true, true);
    emit UnlockingPeriodSet(newUnlockingPeriod);
    lockedGold.setUnlockingPeriod(newUnlockingPeriod);
  }

  function test_ShouldRevertWhenUnlockingPeriodIsUnchanged() public {
    vm.expectRevert("Unlocking period not changed");
    lockedGold.setUnlockingPeriod(unlockingPeriod);
  }

  function test_ShouldRevertWhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    lockedGold.setUnlockingPeriod(100);
  }
}

contract Lock is LockedGoldFoundryTest {
  uint256 value = 1000;
  function setUp() public {
    super.setUp();
  }

  function test_ShouldIncreaseTheAccountsNonVotingLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), value);
  }

  function test_ShouldIncreaseTheAccountTOtalLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), value);
  }

  function test_ShouldIncreaseTheNonvotingLockedGOldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getNonvotingLockedGold(), value);
  }

  function test_ShouldIncreaseTheTotalLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getTotalLockedGold(), value);
  }

  function test_ShouldEmitAGoldLockedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit GoldLocked(address(this), value);
    lockedGold.lock.value(value)();
  }

  function test_ShouldRevertWhenAccountDoesNotExist() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    vm.prank(randomAddress);
    lockedGold.lock();
  }
}

contract Unlock is LockedGoldFoundryTest {
  uint256 value = 1000;
  uint256 availabilityTime = unlockingPeriod + block.timestamp;

  uint256 votingGold = 1;
  uint256 nonVotingGold = value - votingGold;

  uint256 balanceRequirement = 10;

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(value)();
  }

  function test_ShouldAddAPendingWithdrawal() public {
    lockedGold.unlock(value);
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(address(this), 0);
    assertEq(val, value);
    assertEq(timestamp, availabilityTime);
    vm.expectRevert();
    lockedGold.getPendingWithdrawal(address(this), 1);
  }

  function test_ShouldAddPendingWithdrawals() public {
    lockedGold.unlock(value);
    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(this)
    );
    assertEq(vals.length, 1);
    assertEq(timestamps.length, 1);
    assertEq(vals[0], value);
    assertEq(timestamps[0], availabilityTime);
  }

  function test_ShouldDecreaseTheACcountsNonVotingLockedGoldBalance() public {
    lockedGold.unlock(value);
    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), 0);
  }

  function test_ShouldDecreaseTheAccountsTotalLockedGoldBalance() public {
    lockedGold.unlock(value);
    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), 0);
  }

  function test_ShouldDecreaseTheNonVotingLockedGoldBalance() public {
    lockedGold.unlock(value);
    assertEq(lockedGold.getNonvotingLockedGold(), 0);
  }

  function test_ShouldDecreaseTheTotalLockedGoldBalance() public {
    lockedGold.unlock(value);
    assertEq(lockedGold.getTotalLockedGold(), 0);
  }

  function test_ShouldEmitGoldUnlockedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit GoldUnlocked(address(this), value, availabilityTime);
    lockedGold.unlock(value);
  }

  function test_ShouldRevertWhenUnlockingGoldThatIsVotedWith() public {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    vm.expectRevert("Not enough unlockable celo. Celo is locked in voting.");
    lockedGold.unlock(value);
  }

  function test_ShouldAddAPendingWithdrawal_WhenTheAccountIsRequestingOnlyNonVotingGold() public {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    lockedGold.unlock(nonVotingGold);
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(address(this), 0);
    assertEq(val, nonVotingGold);
    assertEq(timestamp, availabilityTime);
    vm.expectRevert();
    lockedGold.getPendingWithdrawal(address(this), 1);
  }

  function test_ShouldAddPendingWithdrawals_WhenTheAccountIsRequestingOnlyNonVotingGold() public {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    lockedGold.unlock(nonVotingGold);
    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(this)
    );
    assertEq(vals.length, 1);
    assertEq(timestamps.length, 1);
    assertEq(vals[0], nonVotingGold);
    assertEq(timestamps[0], availabilityTime);
  }

  function test_ShouldDecreaseTheACcountsNonVotingLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold()
    public
  {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), votingGold);
  }

  function test_ShouldDecreaseTheAccountsTotalLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold()
    public
  {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), votingGold);
  }

  function test_ShouldDecreaseTheNonVotingLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold()
    public
  {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getNonvotingLockedGold(), votingGold);
  }

  function test_ShouldDecreaseTheTotalLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold()
    public
  {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getTotalLockedGold(), votingGold);
  }

  function test_ShouldEmitGoldUnlockedEvent_WhenTheAccountIsRequestingOnlyNonVotingGold() public {
    governance.setVoting(address(this));
    governance.setTotalVotes(address(this), votingGold);

    vm.expectEmit(true, true, true, true);
    emit GoldUnlocked(address(this), nonVotingGold, availabilityTime);
    lockedGold.unlock(nonVotingGold);
  }

  function test_ShouldRevert_WhenTheCorrectTimeIsEarlierThanThRequirementTime_WhenThereIsBalanceRequirement()
    public
  {
    validators.setAccountLockedGoldRequirement(address(this), balanceRequirement);
    vm.expectRevert(
      "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
    );
    lockedGold.unlock(value);
  }

  function test_ShouldSucceed_WhenTheCorrectTimeIsEarlierThanThRequirementTimeButRequestingCeloWithoutBalanceRequirement_WhenThereIsBalanceRequirement()
    public
  {
    validators.setAccountLockedGoldRequirement(address(this), balanceRequirement);
    lockedGold.unlock(value - balanceRequirement);
  }
}

contract UnlockDelegation is LockedGoldFoundryTest {
  uint256 value = 1000;
  uint256 availabilityTime = unlockingPeriod + block.timestamp;

  uint256 percentageToDelegate = 50;
  uint256 toUnlock = (value / 100) * (100 - percentageToDelegate); // 500
  uint256 originallyDelegatedAmount = (value / 100) * percentageToDelegate; // 500

  address delegatee = actor("delegatee");

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(value)();
    vm.prank(delegatee);
    accounts.createAccount();
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    governance.setTotalVotes(delegatee, originallyDelegatedAmount);
    lockedGold.unlock(toUnlock);
  }

  function test_ShouldCorrectlyUnlockWhenGettingLessOrEqualToLockedAmount() public {
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(address(this), 0);
    assertEq(val, toUnlock);
    assertEq(timestamp, availabilityTime);
  }

  function test_ShouldCorrectlyUpdateDelegatedAmountForDelegatee() public {
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee
    );
    assertEq(expected, originallyDelegatedAmount / 2);
    assertEq(real, toUnlock / 2);
  }

  function test_ShouldDecreaseTotalDelegatedAmountForDelegatee() public {
    assertEq(lockedGold.totalDelegatedCelo(delegatee), originallyDelegatedAmount / 2);
  }

  function test_ShouldCallRemoveDelegatedVotesBecauseVotingForGovernance() public {
    assertEq(governance.removeVotesCalledFor(delegatee), originallyDelegatedAmount / 2);
  }

  function test_ShouldCorrectlyUpdateDelegatorDelegateeAmount() public {
    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      address(this),
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percentageToDelegate);
    assertEq(currentAmount, originallyDelegatedAmount / 2);
  }

  function test_ShouldNotRemoveDelegateeFromQueue_WhenAllIsUnlocked() public {
    governance.setTotalVotes(delegatee, originallyDelegatedAmount / 2);
    lockedGold.unlock(toUnlock);
    address[] memory delegatees = lockedGold.getDelegateesOfDelegator(address(this));
    assertEq(delegatees.length, 1);
    assertEq(delegatees[0], delegatee);
  }

  function test_ShouldCorrectlyUpdateDelegatorDelegateeAmount_WhenAllIsUnlocked() public {
    governance.setTotalVotes(delegatee, originallyDelegatedAmount / 2);
    lockedGold.unlock(toUnlock);
    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      address(this),
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percentageToDelegate);
    assertEq(currentAmount, 0);
  }
}

contract UnlockDelegation2Delegatees is LockedGoldFoundryTest {
  uint256 value = 1000;
  uint256 availabilityTime = unlockingPeriod + block.timestamp;

  uint256 percentageToDelegate = 50;
  uint256 toUnlock = (value / 100) * (100 - percentageToDelegate) + 1; // 501
  uint256 originallyDelegatedAmount = (value / 100) * percentageToDelegate; // 500

  address delegatee = actor("delegatee");
  address delegatee2 = actor("delegatee2");

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(value)();
    vm.prank(delegatee);
    accounts.createAccount();
    vm.prank(delegatee2);
    accounts.createAccount();
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    governance.setTotalVotes(delegatee, originallyDelegatedAmount);
    governance.setTotalVotes(delegatee2, originallyDelegatedAmount);
    lockedGold.unlock(toUnlock);
  }

  function test_ShouldCorrectlyUnlockWhenGettingLessOrEqualToLockedAmount() public {
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(address(this), 0);
    assertEq(val, toUnlock);
    assertEq(timestamp, availabilityTime);
  }

  function test_ShouldCorrectlyUpdateDelegatedAmountForDelegatee() public {
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee
    );
    assertEq(expected, originallyDelegatedAmount / 2 - 1);
    assertEq(real, toUnlock / 2);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee2
    );

    assertEq(expected2, originallyDelegatedAmount / 2 - 1);
    assertEq(real2, toUnlock / 2);
  }

  function test_ShouldDecreaseTotalDelegatedAmountForDelegatee() public {
    assertEq(lockedGold.totalDelegatedCelo(delegatee), originallyDelegatedAmount / 2);
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), originallyDelegatedAmount / 2);
  }

  function test_ShouldCallRemoveDelegateVotesBecauseOfVotingForGovernance() public {
    assertEq(governance.removeVotesCalledFor(delegatee), originallyDelegatedAmount / 2);
    assertEq(governance.removeVotesCalledFor(delegatee2), originallyDelegatedAmount / 2);
  }
}

contract UnlockDelegation3Delegatees is LockedGoldFoundryTest {
  uint256 value = 5;
  uint256 availabilityTime = unlockingPeriod + block.timestamp;

  uint256 percentageToDelegate = 33;
  uint256 toUnlock = 4;

  address delegatee = actor("delegatee");
  address delegatee2 = actor("delegatee2");
  address delegatee3 = actor("delegatee3");

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(value)();
    vm.prank(delegatee);
    accounts.createAccount();
    vm.prank(delegatee2);
    accounts.createAccount();
    vm.prank(delegatee3);
    accounts.createAccount();
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee3,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    governance.setTotalVotes(delegatee, 1);
    governance.setTotalVotes(delegatee2, 1);
    governance.setTotalVotes(delegatee3, 1);

    governance.removeVotesWhenRevokingDelegatedVotes(delegatee, 9999);
    governance.removeVotesWhenRevokingDelegatedVotes(delegatee2, 9999);
    governance.removeVotesWhenRevokingDelegatedVotes(delegatee3, 9999);
  }

  function test_ShouldDistributeCeloCorrectly() public {
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee
    );
    assertEq(expected, 1);
    assertEq(real, 1);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee2
    );

    assertEq(expected2, 1);
    assertEq(real2, 1);

    (uint256 expected3, uint256 real3) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee3
    );

    assertEq(expected3, 1);
    assertEq(real3, 1);

  }

  function test_ShouldCorrectlyUnlockWhenGettingLessOrEqualToLockedAmount() public {
    lockedGold.unlock(toUnlock);
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(address(this), 0);
    assertEq(val, toUnlock);
    assertEq(timestamp, availabilityTime);
  }

  function test_ShouldCorrectlyUpdateDelegatedAmountForDelegatee() public {
    lockedGold.unlock(toUnlock);
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee
    );
    assertEq(expected, 0);
    assertEq(real, 0);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee2
    );

    assertEq(expected2, 0);
    assertEq(real2, 0);

    (uint256 expected3, uint256 real3) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee3
    );

    assertEq(expected3, 0);
    assertEq(real3, 0);
  }

  function test_ShouldDecreaseTotalDelegatedAmountForDelegatee() public {
    lockedGold.unlock(toUnlock);
    assertEq(lockedGold.totalDelegatedCelo(delegatee), 0);
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), 0);
    assertEq(lockedGold.totalDelegatedCelo(delegatee3), 0);
  }

  function test_ShouldCallRemoveDelegatedVotesBecauseOfVotingForGovernance() public {
    lockedGold.unlock(toUnlock);
    assertEq(governance.removeVotesCalledFor(delegatee), 0);
    assertEq(governance.removeVotesCalledFor(delegatee2), 0);
    assertEq(governance.removeVotesCalledFor(delegatee3), 0);
  }

  function test_ShouldEmitDelegatedCeloRevokedEventForDelegatee1() public {
    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(address(this), delegatee, 0, 1);
    lockedGold.unlock(toUnlock);
  }

  function test_ShouldEmitDelegatedCeloRevokedEventForDelegatee2() public {
    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(address(this), delegatee2, 0, 1);
    lockedGold.unlock(toUnlock);
  }

  function test_ShouldEmitDelegatedCeloRevokedEventForDelegatee3() public {
    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(address(this), delegatee3, 0, 1);
    lockedGold.unlock(toUnlock);
  }
}

contract Relock is LockedGoldFoundryTest {
  uint256 pendingWithdrawalValue = 100;
  uint256 index = 0;
  address delegatee = actor("delegatee");

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(pendingWithdrawalValue)();
  }

  function test_ShouldIncreaseTheAccountsNonVotingLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);

    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), pendingWithdrawalValue);
  }

  function test_ShouldIncreaseTheAccountsTotalLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);

    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), pendingWithdrawalValue);
  }

  function test_ShouldIncreaseTheNonVotingLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);

    assertEq(lockedGold.getNonvotingLockedGold(), pendingWithdrawalValue);
  }

  function test_ShouldIncreaseTheTotalLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);

    assertEq(lockedGold.getTotalLockedGold(), pendingWithdrawalValue);
  }

  function test_ShouldEmitGoldRelockedEvent_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    vm.expectEmit(true, true, true, true);
    emit GoldRelocked(address(this), pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);
  }

  function test_ShouldRemoveThePendingWithdrawal_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);

    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(this)
    );
    assertEq(vals.length, 0);
    assertEq(timestamps.length, 0);
  }

  function test_ShouldIncreaseTheAccountsNonVotingLockedGoldBalance_WhenRelockingValueLessThanValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);

    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheAccountsTotalLockedGoldBalance_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);

    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheNonVotingLockedGoldBalance_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);

    assertEq(lockedGold.getNonvotingLockedGold(), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheTotalLockedGoldBalance_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);

    assertEq(lockedGold.getTotalLockedGold(), pendingWithdrawalValue - 1);
  }

  function test_ShouldEmitGoldRelockedEvent_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    vm.expectEmit(true, true, true, true);
    emit GoldRelocked(address(this), pendingWithdrawalValue - 1);
    lockedGold.relock(index, pendingWithdrawalValue - 1);
  }

  function test_ShouldRemoveThePendingWithdrawal_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);

    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(this)
    );
    assertEq(vals.length, 1);
    assertEq(timestamps.length, 1);
    assertEq(vals[0], 1);
  }

  function test_ShouldRevert_WhenRelockingValueGreaterThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    vm.expectRevert("Requested value larger than pending value");
    lockedGold.relock(index, pendingWithdrawalValue + 1);
  }

  function test_ShouldUpdateDelegatorDelegateeAmount_WhenDelegating() public {
    vm.prank(delegatee);
    accounts.createAccount();
    lockedGold.delegateGovernanceVotes(delegatee, FixidityLib.newFixedFraction(1, 1).unwrap());
    lockedGold.unlock(pendingWithdrawalValue / 2);

    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee
    );

    assertEq(expected, pendingWithdrawalValue / 2);
    assertEq(real, pendingWithdrawalValue / 2);

    lockedGold.relock(index, pendingWithdrawalValue / 2);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      address(this),
      delegatee
    );

    assertEq(expected2, pendingWithdrawalValue);
    assertEq(real2, pendingWithdrawalValue);
  }

  function test_ShouldRevert_WhenPendingWithdrawalDoesNotExists() public {
    vm.expectRevert("Bad pending withdrawal index");
    lockedGold.relock(0, pendingWithdrawalValue);
  }
}

contract Withdraw is LockedGoldFoundryTest {
  uint256 value = 1000;
  uint256 index = 0;

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(value)();
  }

  function test_ShouldRemoveThePendingWithdrawal_WhenItIsAFterTheAvailabilityTime() public {
    lockedGold.unlock(value);
    vm.warp(block.timestamp + unlockingPeriod + 1);
    lockedGold.withdraw(index);
    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(this)
    );
    assertEq(vals.length, 0);
    assertEq(timestamps.length, 0);
  }

  function test_ShouldEmitGoldWithdrawnEvent_WhenItIsAfterTheAvailabilityTime() public {
    lockedGold.unlock(value);
    vm.warp(block.timestamp + unlockingPeriod + 1);
    vm.expectEmit(true, true, true, true);
    emit GoldWithdrawn(address(this), value);
    lockedGold.withdraw(index);
  }

  function test_ShouldRevert_WhenItIsBeforeTheAvailabilityTime() public {
    lockedGold.unlock(value);
    vm.expectRevert("Pending withdrawal not available");
    lockedGold.withdraw(index);
  }

  function test_ShouldRevert_WhenPendingWithdrawalDoesNotExist() public {
    vm.expectRevert("Bad pending withdrawal index");
    lockedGold.withdraw(index);
  }

  function() external payable {}
}

contract AddSlasher is LockedGoldFoundryTest {
  address downtimeSlasher = actor("DowntimeSlasher");

  function setUp() public {
    super.setUp();
    registry.setAddressFor("DowntimeSlasher", downtimeSlasher);
  }

  function test_ShouldBeAbleToAddSlasherToWhitelist() public {
    string memory slasherName = "DowntimeSlasher";

    lockedGold.addSlasher(slasherName);
    bytes32[] memory slashers = lockedGold.getSlashingWhitelist();
    assertEq(slashers[0], keccak256(abi.encodePacked(slasherName)));
  }

  function test_ShouldBeCallableOnlyByOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    lockedGold.addSlasher("DowntimeSlasher");
  }

  function test_ShouldNotAllowToAddSlasherTwice() public {
    string memory slasherName = "DowntimeSlasher";

    lockedGold.addSlasher(slasherName);
    vm.expectRevert("Cannot add slasher ID twice.");
    lockedGold.addSlasher(slasherName);
  }
}

contract RemoveSlasher is LockedGoldFoundryTest {
  address downtimeSlasher = actor("DowntimeSlasher");
  address governanceSlasher = actor("GovernanceSlasher");

  function setUp() public {
    super.setUp();
    registry.setAddressFor("DowntimeSlasher", downtimeSlasher);
    registry.setAddressFor("GovernanceSlasher", governanceSlasher);
    lockedGold.addSlasher("DowntimeSlasher");
  }

  function test_ShouldRemoveItemFromWhitelist() public {
    string memory slasherName = "DowntimeSlasher";

    lockedGold.removeSlasher(slasherName, 0);
    bytes32[] memory slashers = lockedGold.getSlashingWhitelist();
    assertEq(slashers.length, 0);
  }

  function test_ShouldBeCallableOnlyByTheOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    lockedGold.removeSlasher("DowntimeSlasher", 0);
  }

  function test_ShouldRevertWhenIndexTooLarge() public {
    vm.expectRevert("Provided index exceeds whitelist bounds.");
    lockedGold.removeSlasher("DowntimeSlasher", 1);
  }

  function test_ShouldRevertWhenKeyDoesNotExist() public {
    vm.expectRevert("Cannot remove slasher ID not yet added.");
    lockedGold.removeSlasher("GovernanceSlasher", 0);
  }

  function test_ShouldRevertWhenIndexAndKeyHaveMismatch() public {
    lockedGold.addSlasher("GovernanceSlasher");
    vm.expectRevert("Index doesn't match identifier");
    lockedGold.removeSlasher("DowntimeSlasher", 1);
  }
}

contract Slash is LockedGoldFoundryTest {
  uint256 value = 1000;
  address group = actor("group");
  address groupMember = actor("groupMember");
  address reporter = actor("reporter");
  address downtimeSlasher = actor("DowntimeSlasher");

  Election electionSlashTest;

  function setUp() public {
    super.setUp();
    electionSlashTest = new Election(true);
    registry.setAddressFor("Election", address(election));
    electionSlashTest.initialize(
      address(registry),
      4,
      6,
      3,
      FixidityLib.newFixedFraction(1, 100).unwrap()
    );

    address[] memory members = new address[](1);
    members[0] = groupMember;

    validators.setMembers(group, members);
    registry.setAddressFor("Validators", address(this));
    election.markGroupEligible(group, address(0), address(0));
    validators.setNumRegisteredValidators(1);

    lockedGold.lock.value(value)();
    registry.setAddressFor("DowntimeSlasher", downtimeSlasher);
    lockedGold.addSlasher("DowntimeSlasher");

    vm.prank(reporter);
    accounts.createAccount();
  }

  function helper_WhenAccountIsSlashedForAllOfItsLockedGold(uint256 penalty, uint256 reward)
    public
  {
    address[] memory lessers = new address[](1);
    lessers[0] = address(0);
    address[] memory greaters = new address[](1);
    greaters[0] = address(0);

    uint256[] memory indices = new uint256[](1);
    indices[0] = 0;

    vm.prank(downtimeSlasher);
    lockedGold.slash(address(this), penalty, reporter, reward, lessers, greaters, indices);
  }

  function test_ShouldReduceAccountsLockedGoldBalance_WhenAccountIsSlashedForAllOfItsLockedGold()
    public
  {
    uint256 penalty = value;
    uint256 reward = value / 2;
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), value - penalty);
    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), value - penalty);
  }

  function test_ShouldIncreaseReportersLockedGoldBalance_WhenAccountIsSlashedForAllOfItsLockedGold()
    public
  {
    uint256 penalty = value;
    uint256 reward = value / 2;
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(reporter), reward);
    assertEq(lockedGold.getAccountTotalLockedGold(reporter), reward);
  }

  function test_ShouldIncreaseCommunityFundLockedGoldBalance_WhenAccountIsSlashedForAllOfItsLockedGold()
    public
  {
    uint256 penalty = value;
    uint256 reward = value / 2;
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(address(governance).balance, penalty - reward);
  }
}

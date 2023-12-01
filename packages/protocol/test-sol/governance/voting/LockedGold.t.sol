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

contract LockedGoldTest is Test {
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

  function getParsedSignatureOfAddress(address _address, uint256 privateKey)
    public
    pure
    returns (uint8, bytes32, bytes32)
  {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function authorizeVoteSigner(address _delegator, uint256 _signerPK) public {
    (uint8 vVoting, bytes32 rVoting, bytes32 sVoting) = getParsedSignatureOfAddress(
      _delegator,
      _signerPK
    );

    address signerAddress = vm.addr(_signerPK);

    vm.prank(_delegator);
    accounts.authorizeVoteSigner(signerAddress, vVoting, rVoting, sVoting);

    vm.prank(signerAddress);
    accounts.completeSignerAuthorization(
      _delegator,
      keccak256(abi.encodePacked("celo.org/core/vote"))
    );
  }

  function createAndAssertDelegatorDelegateeSigners(
    address _delegator,
    address _delegatee,
    uint256 _delegatorSignerPK,
    uint256 _delegateeSignerPK
  ) public {
    if (_delegator != address(0)) {
      authorizeVoteSigner(_delegator, _delegatorSignerPK);
      assertFalse(_delegator == vm.addr(_delegatorSignerPK));
      assertEq(accounts.voteSignerToAccount(vm.addr(_delegatorSignerPK)), _delegator);
    }
    if (_delegatee != address(0)) {
      authorizeVoteSigner(_delegatee, _delegateeSignerPK);
      assertFalse(_delegatee == vm.addr(_delegateeSignerPK));
      assertEq(accounts.voteSignerToAccount(vm.addr(_delegateeSignerPK)), _delegatee);
    }
  }

  function assertDelegatorDelegateeAmounts(
    address _delegator,
    address delegatee,
    uint256 percent,
    uint256 amount
  ) public {
    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      _delegator,
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percent, "fraction incorrect");
    assertEq(currentAmount, amount, "amount incorrect");
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

  function test_ShouldIncreaseTheNonvotingLockedGoldBalance() public {
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

  function test_ShouldRevert_WhenTheCorrectTimeIsEarlierThanTheRequirementTime_WhenThereIsBalanceRequirement()
    public
  {
    validators.setAccountLockedGoldRequirement(address(this), balanceRequirement);
    vm.expectRevert(
      "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
    );
    lockedGold.unlock(value);
  }

  function test_ShouldSucceed_WhenTheCorrectTimeIsEarlierThanTheRequirementTimeButRequestingCeloWithoutBalanceRequirement_WhenThereIsBalanceRequirement()
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
  address delegatee = actor("delegatee");

  Election electionSlashTest;

  function setUp() public {
    super.setUp();
    electionSlashTest = new Election(true);
    registry.setAddressFor("Election", address(electionSlashTest));
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
    electionSlashTest.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));
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

  // original tests regarding delegating are already covered in other tests below

  function test_ShouldRevert_WhenTheSlashingContractIsRemovedFromIsSlasher() public {
    uint256 penalty = value;
    uint256 reward = value / 2;
    lockedGold.removeSlasher("DowntimeSlasher", 0);
    vm.expectRevert("Caller is not a whitelisted slasher.");
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);
  }

  function test_ShouldReduceAccountsNonVotingLockedGoldBalance_WhenAccountIsSlashedForOnlyItsNonvotingBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 nonVoting = value - voting;
    uint256 penalty = nonVoting;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));

    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);
    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), nonVoting - penalty);
  }

  function test_ShouldLeaveTheVotingLockedGold_WhenAccountIsSlashedForOnlyItsNonvotingBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 nonVoting = value - voting;
    uint256 penalty = nonVoting;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), value - penalty);
    assertEq(electionSlashTest.getTotalVotesByAccount(address(this)), voting);
  }

  function test_ShouldIncreaseTheReportedLockedGold_WhenAccountIsSlashedForOnlyItsNonvotingBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 nonVoting = value - voting;
    uint256 penalty = nonVoting;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(reporter), reward);
    assertEq(lockedGold.getAccountTotalLockedGold(reporter), reward);
  }

  function test_ShouldIncreaseTheCommunityFundLockedGold_WhenAccountIsSlashedForOnlyItsNonvotingBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 nonVoting = value - voting;
    uint256 penalty = nonVoting;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(address(governance).balance, penalty - reward);
  }

  function test_ShouldReduceAccountsNonVotingLockedGoldBalance_WhenAccountIsSlashedForItsWholeBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));

    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);
    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), 0);
  }

  function test_ShouldLeaveTheVotingLockedGold_WhenAccountIsSlashedFoItsWholeBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), 0);
    assertEq(electionSlashTest.getTotalVotesByAccount(address(this)), 0);
  }

  function test_ShouldIncreaseTheReportedLockedGold_WhenAccountIsSlashedFoItsWholeBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(reporter), reward);
    assertEq(lockedGold.getAccountTotalLockedGold(reporter), reward);
  }

  function test_ShouldIncreaseTheCommunityFundLockedGold_WhenAccountIsSlashedFoItsWholeBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(address(governance).balance, penalty - reward);
  }

  function test_ShouldSlashWholeAccountBalance_WhenAccountIsSlashedForMoreThanItsOwnBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value * 2;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(address(this)), 0);
    assertEq(lockedGold.getAccountTotalLockedGold(address(this)), 0);
    assertEq(electionSlashTest.getTotalVotesByAccount(address(this)), 0);
  }

  function test_ShouldIncreaseTheReportedLockedGold_WhenAccountIsSlashedForMoreThanItsOwnBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value * 2;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(reporter), reward);
    assertEq(lockedGold.getAccountTotalLockedGold(reporter), reward);
  }

  function test_ShouldIncreaseTheCommunityFundLockedGoldOnlySlashedAccountTotalBalanceMinusReward_WhenAccountIsSlashedForMoreThanItsOwnBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value * 2;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(address(governance).balance, value - reward);
  }

  function test_ShouldRevertWhenCalledByNonAccountReporters() public {
    address[] memory lessers = new address[](1);
    lessers[0] = address(0);
    address[] memory greaters = new address[](1);
    greaters[0] = address(0);

    uint256[] memory indices = new uint256[](1);
    indices[0] = 0;

    vm.prank(randomAddress);
    vm.expectRevert("Caller is not a whitelisted slasher.");
    lockedGold.slash(address(this), value, reporter, value / 2, lessers, greaters, indices);
  }

  function test_ShouldAllowToSlashByAccountSigner() public {
    address signerReporter = actor("signerReporter");
    bytes32 role = hex"0000000000000000000000000000000000000000000000000000000000001337";
    vm.prank(reporter);
    accounts.authorizeSigner(signerReporter, role);
    vm.prank(signerReporter);
    accounts.completeSignerAuthorization(reporter, role);

    uint256 reward = value / 2;

    helper_WhenAccountIsSlashedForAllOfItsLockedGold(value, reward);
    assertEq(lockedGold.getAccountNonvotingLockedGold(reporter), reward);
    assertEq(lockedGold.getAccountTotalLockedGold(reporter), reward);
  }
}

contract DelegateGovernanceVotes is LockedGoldFoundryTest {
  address delegatee1 = actor("delegatee1");
  address delegatee2 = actor("delegatee2");
  address delegatee3 = actor("delegatee3");
  address delegator = actor("delegator");
  address delegator2 = actor("delegator2");

  address delegatorSigner;
  uint256 delegatorSignerPK;
  address delegatorSigner2;
  uint256 delegatorSigner2PK;
  address delegateeSigner1;
  uint256 delegateeSigner1PK;
  address delegateeSigner2;
  uint256 delegateeSigner2PK;

  function setUp() public {
    super.setUp();

    vm.prank(delegatee1);
    accounts.createAccount();
    vm.prank(delegatee2);
    accounts.createAccount();
    vm.prank(delegatee3);
    accounts.createAccount();
    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegator2);
    accounts.createAccount();

    (delegatorSigner, delegatorSignerPK) = actorWithPK("delegatorSigner");
    (delegatorSigner2, delegatorSigner2PK) = actorWithPK("delegatorSigner2");
    (delegateeSigner1, delegateeSigner1PK) = actorWithPK("delegateeSigner1");
    (delegateeSigner2, delegateeSigner2PK) = actorWithPK("delegateeSigner2");

    vm.deal(delegator, 10 ether);
    vm.deal(delegator2, 10 ether);
  }

  function test_ShouldRevertWhenDelegateeIsNotAccount() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    lockedGold.delegateGovernanceVotes(randomAddress, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldRevert_WhenDelegatorIsNotAnAccount() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    vm.prank(randomAddress);
    lockedGold.delegateGovernanceVotes(address(this), FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldReturnCorrectDelegatedAmount_WhenNoGoldIsLocked_WhenNoVoteSigners() public {
    uint256 percentToDelegate = 30;
    uint256 delegatedAmount = 0;

    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap()
    );
    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, delegatedAmount);
    assertEq(
      FixidityLib.wrap(lockedGold.getAccountTotalDelegatedFraction(delegator) * 100).fromFixed(),
      percentToDelegate
    );
  }

  function test_ShouldEmitCeloDelegatedEvent_WhenNoGoldIsLocked_WhenNoVoteSigner() public {
    uint256 percentToDelegate = 30;
    uint256 delegatedAmount = 0;

    vm.startPrank(delegator);
    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      delegatedAmount
    );
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap()
    );
  }

  function test_ShouldRevert_WhenDelegatingAsValidator() public {
    validators.setValidator(delegator);
    vm.startPrank(delegator);
    vm.expectRevert("Validators cannot delegate votes.");
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldRevert_WhenDelegatingAsValidatorGroup() public {
    validators.setValidatorGroup(delegator);
    vm.startPrank(delegator);
    vm.expectRevert("Validator groups cannot delegate votes.");
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldRevertWhenIncorrectPercentAmountIsInserted() public {
    vm.expectRevert("Delegate fraction must be less than or equal to 1");
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(101, 100).unwrap());
  }

  function test_ShouldRevertWhenDelegatingVotesThatAreCurrentlyVotingForProposal_WhenDelegatorIsVotingInReferendum_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    governance.setTotalVotes(delegator, 1);

    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(100, 100).unwrap());
  }

  function test_ShouldRevertWhenDelegatingVotesThatAreCurrentlyVotingForProposal2Delegatees_WhenDelegatorIsVotingInReferendum_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    governance.setTotalVotes(delegator, 1);

    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(99, 100).unwrap());

    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(1, 100).unwrap());
  }

  function test_ShouldDelegateWhenVotingForLessThanRequestedForDelegatetion_WhenDelegatorIsVotingInReferendum_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    governance.setTotalVotes(delegator, 1);

    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(99, 100).unwrap());

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 10);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 990);
  }

  function test_ShouldRevertWhenDelegatingMoreThan100PercentInTwoStepsForDifferentDelegatees_WhenDelegatingToDelegatee1_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(10, 100).unwrap());
    vm.expectRevert("Cannot delegate more than 100%");
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(100, 100).unwrap());
  }

  function test_ShouldDelegateCorrectlyWhenDelgatedToSameDelegateeInTwoSteps_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(10, 100).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(100, 100).unwrap());
    vm.stopPrank();

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 0);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 1000);
  }

  function test_ShouldEmitCeloDelegatedEvent_WhenSomeGoldIsLocked() public {
    uint256 value = 1000;
    uint256 percentToDelegate = 30;
    uint256 delegatedAmount = (value * percentToDelegate) / 100;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      delegatedAmount
    );
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap()
    );
  }

  function test_ShouldDelegateVotesCorrectly_WhenSomeGoldIsLocked() public {
    uint256 value = 1000;
    uint256 percentToDelegate = 30;
    uint256 delegatedAmount = (value * percentToDelegate) / 100;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, delegatedAmount);
  }

  function test_ShouldDelegateVotesCorrectlyToMultipleAccounts_WhenSomeGoldIsLocked() public {
    uint256 value = 1000;
    uint256 percentToDelegate1 = 30;
    uint256 percentToDelegate2 = 20;
    uint256 percentToDelegate3 = 50;
    uint256 delegatedAmount1 = (value * percentToDelegate1) / 100;
    uint256 delegatedAmount2 = (value * percentToDelegate2) / 100;
    uint256 delegatedAmount3 = (value * percentToDelegate3) / 100;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentToDelegate2, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee3,
      FixidityLib.newFixedFraction(percentToDelegate3, 100).unwrap()
    );
    vm.stopPrank();

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate1, delegatedAmount1);
    assertDelegatorDelegateeAmounts(delegator, delegatee2, percentToDelegate2, delegatedAmount2);
    assertDelegatorDelegateeAmounts(delegator, delegatee3, percentToDelegate3, delegatedAmount3);
  }

  function test_ShouldDelegateVotesCorrectly_WhenLockedMoreGoldAndRedelegate_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;
    uint256 percentToDelegate1 = 30;
    uint256 delegatedAmount1 = (value * percentToDelegate1) / 100;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentToDelegate1,
      delegatedAmount1 * 2
    );
  }

  function test_ShouldEmitTheCeloDelegatedEvent_WhenLockedMoreGoldAndRedelegate_WhenSomeGoldIsLocked()
    public
  {
    uint256 value = 1000;
    uint256 percentToDelegate1 = 30;
    uint256 delegatedAmount1 = (value * percentToDelegate1) / 100;

    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    lockedGold.lock.value(value)();

    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap(),
      delegatedAmount1 * 2
    );
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );
  }

  function test_ShouldDelegateVotesCorrectly_When2DelegatorsAreDelegatingToDelegatee() public {
    uint256 value = 1000;
    uint256 percentToDelegate1 = 30;
    uint256 percentToDelegate2 = 20;
    uint256 delegatedAmount1 = (value * percentToDelegate1) / 100;
    uint256 delegatedAmount2 = (value * percentToDelegate2) / 100;

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    vm.prank(delegator2);
    lockedGold.lock.value(value)();
    vm.prank(delegator2);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate2, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate1, delegatedAmount1);
    assertDelegatorDelegateeAmounts(delegator2, delegatee1, percentToDelegate2, delegatedAmount2);

    console.log("my", address(this));
  }

  function helper_WhenVoteSigners() public {
    vm.prank(delegator);
    lockedGold.lock.value(1000)();
    vm.prank(delegator2);
    lockedGold.lock.value(1000)();

    createAndAssertDelegatorDelegateeSigners(
      delegator,
      delegatee1,
      delegatorSignerPK,
      delegateeSigner1PK
    );

    createAndAssertDelegatorDelegateeSigners(
      delegator2,
      delegatee2,
      delegatorSigner2PK,
      delegateeSigner2PK
    );
  }

  function test_ShouldRevertWhenIncorrectPercentAmountIsInserted_WhenSomeGoldIsLocked_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    vm.expectRevert("Delegate fraction must be less than or equal to 1");
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(101, 100).unwrap());
  }

  function test_ShouldRevertWhenDelegatingVotesThatAreCurrentlyVotingForProposal_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    governance.setTotalVotes(delegator, 1);
    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(100, 100).unwrap());
  }

  function test_ShouldRevertWhenVotingForProposalWIthVotesThatAreCurrentlyUsedInReferendum2Delegatees_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    governance.setTotalVotes(delegator, 1);
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(99, 100).unwrap());
    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(1, 100).unwrap());
  }

  function test_ShouldDelegate_WhenVotingForLessThanRequestedForDelegation_WHenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    governance.setTotalVotes(delegator, 1);
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(99, 100).unwrap()
    );
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 10);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 990);
  }

  function test_ShouldRevertWhenDelegatingMoreThan100PercentInTwoStepsToTwoDifferentDelegatees_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(10, 100).unwrap());
    vm.expectRevert("Cannot delegate more than 100%");
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(100, 100).unwrap());
  }

  function test_ShouldDelegateCorrectlyWhenDelegatedToSameAccountInTwoSteps_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(10, 100).unwrap());
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(100, 100).unwrap());

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 0);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 1000);
  }

  function test_ShouldEmitCeloDelegatedEvent_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    uint256 percentToDelegate = 30;
    uint256 delegatedAmount = 300;

    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      delegatedAmount
    );
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap()
    );
  }

  function test_ShouldDelegateVotesCorrectly_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    uint256 percentToDelegate = 30;
    uint256 delegatedAmount = 300;

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, delegatedAmount);
  }

  function test_ShouldDelegateVotesCorrectlyToMultipleAccounts_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    uint256 percentToDelegate1 = 30;
    uint256 percentToDelegate2 = 20;
    uint256 delegatedAmount1 = 300;
    uint256 delegatedAmount2 = 200;

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );
    vm.prank(delegatorSigner2);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner2,
      FixidityLib.newFixedFraction(percentToDelegate2, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate1, delegatedAmount1);
    assertDelegatorDelegateeAmounts(delegator2, delegatee2, percentToDelegate2, delegatedAmount2);
  }

  function test_ShouldDelegateVotesCorrectly_WhenLockedMoreGoldAndRedelegate_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    uint256 percentToDelegate1 = 30;
    uint256 delegatedAmount1 = 300;

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    vm.prank(delegator);
    lockedGold.lock.value(1000)();
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentToDelegate1,
      delegatedAmount1 * 2
    );
  }

  function test_ShouldEmitCeloDelegated_WhenLockedMoreGoldAndRedelegate_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    uint256 percentToDelegate1 = 30;
    uint256 delegatedAmount1 = 300;

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );

    vm.prank(delegator);
    lockedGold.lock.value(1000)();
    vm.prank(delegatorSigner);
    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap(),
      delegatedAmount1 * 2
    );
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap()
    );
  }

  function test_ShouldRevertWhenTryingToAddExtraDelegatee() public {
    lockedGold.setMaxDelegateesCount(2);
    vm.startPrank(delegator);
    lockedGold.lock.value(1000)();
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(50, 100).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(50, 100).unwrap());

    address[] memory delegateesOfDelegator = lockedGold.getDelegateesOfDelegator(delegator);
    assertEq(delegateesOfDelegator.length, 2);
    assertEq(delegateesOfDelegator[0], delegatee1);
    assertEq(delegateesOfDelegator[1], delegatee2);

    vm.expectRevert("Too many delegatees");
    lockedGold.delegateGovernanceVotes(delegatee3, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldAllowToAddExtraDelegatee_WhenLimitIsIncreased() public {
    lockedGold.setMaxDelegateesCount(2);
    vm.startPrank(delegator);
    lockedGold.lock.value(1000)();
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(50, 100).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(40, 100).unwrap());

    address[] memory delegateesOfDelegator = lockedGold.getDelegateesOfDelegator(delegator);
    assertEq(delegateesOfDelegator.length, 2);
    assertEq(delegateesOfDelegator[0], delegatee1);
    assertEq(delegateesOfDelegator[1], delegatee2);
    vm.stopPrank();
    lockedGold.setMaxDelegateesCount(3);
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(delegatee3, FixidityLib.newFixedFraction(10, 100).unwrap());
  }

  function test_ShouldRevertWhenTryingToAddExtraDelegatee_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    lockedGold.setMaxDelegateesCount(2);
    vm.prank(delegator);
    lockedGold.lock.value(1000)();
    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(50, 100).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(50, 100).unwrap());

    address[] memory delegateesOfDelegator = lockedGold.getDelegateesOfDelegator(delegator);
    assertEq(delegateesOfDelegator.length, 2);
    assertEq(delegateesOfDelegator[0], delegatee1);
    assertEq(delegateesOfDelegator[1], delegatee2);

    vm.expectRevert("Too many delegatees");
    lockedGold.delegateGovernanceVotes(delegatee3, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldAllowToAddExtraDelegatee_WhenLimitIsIncreased_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    lockedGold.setMaxDelegateesCount(2);
    vm.prank(delegator);
    lockedGold.lock.value(1000)();
    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(50, 100).unwrap());
    lockedGold.delegateGovernanceVotes(delegatee2, FixidityLib.newFixedFraction(40, 100).unwrap());

    address[] memory delegateesOfDelegator = lockedGold.getDelegateesOfDelegator(delegator);
    assertEq(delegateesOfDelegator.length, 2);
    assertEq(delegateesOfDelegator[0], delegatee1);
    assertEq(delegateesOfDelegator[1], delegatee2);
    vm.stopPrank();
    lockedGold.setMaxDelegateesCount(3);
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee3, FixidityLib.newFixedFraction(10, 100).unwrap());
  }
}

contract RevokeDelegatedGovernanceVotes is LockedGoldFoundryTest {
  address delegatee1 = actor("delegatee1");
  address delegatee2 = actor("delegatee2");
  address delegatee3 = actor("delegatee3");
  address delegator = actor("delegator");
  address delegator2 = actor("delegator2");

  address delegatorSigner;
  uint256 delegatorSignerPK;
  address delegatorSigner2;
  uint256 delegatorSigner2PK;
  address delegateeSigner1;
  uint256 delegateeSigner1PK;
  address delegateeSigner2;
  uint256 delegateeSigner2PK;

  function setUp() public {
    super.setUp();

    vm.prank(delegatee1);
    accounts.createAccount();
    vm.prank(delegatee2);
    accounts.createAccount();
    vm.prank(delegatee3);
    accounts.createAccount();
    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegator2);
    accounts.createAccount();

    (delegatorSigner, delegatorSignerPK) = actorWithPK("delegatorSigner");
    (delegatorSigner2, delegatorSigner2PK) = actorWithPK("delegatorSigner2");
    (delegateeSigner1, delegateeSigner1PK) = actorWithPK("delegateeSigner1");
    (delegateeSigner2, delegateeSigner2PK) = actorWithPK("delegateeSigner2");

    vm.deal(delegator, 10 ether);
    vm.deal(delegator2, 10 ether);
  }

  function helper_WhenVoteSigners() public {
    vm.prank(delegator);
    lockedGold.lock.value(1000)();
    vm.prank(delegator2);
    lockedGold.lock.value(1000)();

    createAndAssertDelegatorDelegateeSigners(
      delegator,
      delegatee1,
      delegatorSignerPK,
      delegateeSigner1PK
    );

    createAndAssertDelegatorDelegateeSigners(
      delegator2,
      delegatee2,
      delegatorSigner2PK,
      delegateeSigner2PK
    );
  }

  function test_ShouldRevertWhenIncorrectPercentAmountIsInserted() public {
    vm.expectRevert("Revoke fraction must be less than or equal to 1");
    lockedGold.revokeDelegatedGovernanceVotes(
      address(0),
      FixidityLib.newFixedFraction(101, 100).unwrap()
    );
  }

  function test_ShouldRevertWhenNotingIsDelegated() public {
    vm.expectRevert("Not enough total delegated percents");
    lockedGold.revokeDelegatedGovernanceVotes(
      address(0),
      FixidityLib.newFixedFraction(1, 1).unwrap()
    );
  }

  function test_ShouldRevertWhenTryingToRevertMorePercentThanDelegated() public {
    vm.startPrank(delegator);
    lockedGold.lock.value(1000)();
    lockedGold.delegateGovernanceVotes(delegatee1, FixidityLib.newFixedFraction(50, 100).unwrap());

    vm.expectRevert("Not enough total delegated percents");
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(51, 100).unwrap()
    );
  }

  function test_ShouldRevokeVotesCorrectly_WhenDelegateeNotVoting() public {
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;
    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke,
      delegatedAmount - amountToRevoke
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount - amountToRevoke
    );
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount - amountToRevoke);
  }

  function test_ShouldEmitDelegatedCeloRevokedEvent() public {
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;
    vm.startPrank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap(),
      amountToRevoke
    );
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero()
    public
  {
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    uint256 percentageToRevokeAfterLock = 6;
    uint256 votingAmount = (delegatedAmount * 2 - amountToRevoke);

    uint256 amountFromDelegator1AfterRevoke = ((2 * delegatedAmount) / percentageToDelegate) *
      (percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock);

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegator2);
    lockedGold.lock.value(value)();

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    vm.prank(delegator2);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount * 2 - amountToRevoke
    );

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    governance.setTotalVotes(delegatee1, votingAmount);

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevokeAfterLock, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
      amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(delegator2, delegatee1, percentageToDelegate, delegatedAmount);
    assertEq(
      lockedGold.totalDelegatedCelo(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );
    assertEq(
      governance.removeVotesCalledFor(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );

  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero()
    public
  {
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    uint256 percentageToRevokeAfterLock = 2;
    uint256 votingAmount = (delegatedAmount * 2 - amountToRevoke);

    uint256 amountFromDelegator1AfterRevoke = ((2 * delegatedAmount) / percentageToDelegate) *
      (percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock);

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegator2);
    lockedGold.lock.value(value)();

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    vm.prank(delegator2);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount * 2 - amountToRevoke
    );

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    governance.setTotalVotes(delegatee1, votingAmount);

    vm.prank(delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevokeAfterLock, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
      amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(delegator2, delegatee1, percentageToDelegate, delegatedAmount);
    assertEq(
      lockedGold.totalDelegatedCelo(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );
    assertEq(governance.removeVotesCalledFor(delegatee1), 0);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeNotVoting_WhenDelegatedTo2Accounts() public {
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegator2);
    lockedGold.lock.value(value)();

    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount - amountToRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke,
      delegatedAmount - amountToRevoke
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), delegatedAmount);
    assertDelegatorDelegateeAmounts(delegator, delegatee2, percentageToDelegate, delegatedAmount);
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount - amountToRevoke);
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), delegatedAmount);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenDelegatedTo2Accounts() public {
    uint256 value = 1000;
    uint256 percentageToRevoke = 9;
    uint256 percentageToDelegate = 10;
    uint256 votingWeight = 100;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegator2);
    lockedGold.lock.value(value)();

    vm.startPrank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    governance.setTotalVotes(delegatee1, votingWeight);

    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount - amountToRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke,
      delegatedAmount - amountToRevoke
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), delegatedAmount);
    assertDelegatorDelegateeAmounts(delegator, delegatee2, percentageToDelegate, delegatedAmount);
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount - amountToRevoke);
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), delegatedAmount);
  }

  function test_ShouldRevertWhenTryingToRevertMorePercentThanDelegated_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(50, 100).unwrap()
    );

    vm.expectRevert("Not enough total delegated percents");
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(51, 100).unwrap()
    );
  }

  function test_ShouldRevokeVotesCorrectly_WhenDelegateeNotVoting_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;
    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.revokeDelegatedGovernanceVotes(
      delegateeSigner1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke,
      delegatedAmount - amountToRevoke
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount - amountToRevoke
    );
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount - amountToRevoke);
  }

  function test_ShouldEmitDelegatedCeloRevokedEvent_WhenVoteSigners() public {
    helper_WhenVoteSigners();
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;
    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap(),
      amountToRevoke
    );
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    uint256 percentageToRevokeAfterLock = 6;
    uint256 votingAmount = (delegatedAmount * 2 - amountToRevoke);

    uint256 amountFromDelegator1AfterRevoke = ((2 * delegatedAmount) / percentageToDelegate) *
      (percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock);

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    vm.prank(delegatorSigner2);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    vm.prank(delegatorSigner);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount * 2 - amountToRevoke
    );

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    governance.setTotalVotes(delegatee1, votingAmount);

    vm.prank(delegatorSigner);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevokeAfterLock, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
      amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(delegator2, delegatee1, percentageToDelegate, delegatedAmount);
    assertEq(
      lockedGold.totalDelegatedCelo(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );
    assertEq(
      governance.removeVotesCalledFor(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );

  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    uint256 percentageToRevokeAfterLock = 2;
    uint256 votingAmount = (delegatedAmount * 2 - amountToRevoke);

    uint256 amountFromDelegator1AfterRevoke = ((2 * delegatedAmount) / percentageToDelegate) *
      (percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock);

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    vm.prank(delegatorSigner2);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    vm.prank(delegatorSigner);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount * 2 - amountToRevoke
    );

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    governance.setTotalVotes(delegatee1, votingAmount);

    vm.prank(delegatorSigner);
    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevokeAfterLock, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock,
      amountFromDelegator1AfterRevoke
    );

    assertDelegatorDelegateeAmounts(delegator2, delegatee1, percentageToDelegate, delegatedAmount);
    assertEq(
      lockedGold.totalDelegatedCelo(delegatee1),
      delegatedAmount + amountFromDelegator1AfterRevoke
    );
    assertEq(governance.removeVotesCalledFor(delegatee1), 0);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeNotVoting_WhenDelegatedTo2Accounts_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    uint256 value = 1000;
    uint256 percentageToRevoke = 2;
    uint256 percentageToDelegate = 10;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount - amountToRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke,
      delegatedAmount - amountToRevoke
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), delegatedAmount);
    assertDelegatorDelegateeAmounts(delegator, delegatee2, percentageToDelegate, delegatedAmount);
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount - amountToRevoke);
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), delegatedAmount);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenDelegatedTo2Accounts_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    uint256 value = 1000;
    uint256 percentageToRevoke = 9;
    uint256 percentageToDelegate = 10;
    uint256 votingWeight = 100;
    uint256 delegatedAmount = (value * percentageToDelegate) / 100;
    uint256 amountToRevoke = (value / 100) * percentageToRevoke;

    vm.startPrank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );
    lockedGold.delegateGovernanceVotes(
      delegatee2,
      FixidityLib.newFixedFraction(percentageToDelegate, 100).unwrap()
    );

    governance.setTotalVotes(delegatee1, votingWeight);

    lockedGold.revokeDelegatedGovernanceVotes(
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap()
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount - amountToRevoke
    );

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentageToDelegate - percentageToRevoke,
      delegatedAmount - amountToRevoke
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee2), delegatedAmount);
    assertDelegatorDelegateeAmounts(delegator, delegatee2, percentageToDelegate, delegatedAmount);
    assertEq(lockedGold.totalDelegatedCelo(delegatee1), delegatedAmount - amountToRevoke);
    assertEq(lockedGold.totalDelegatedCelo(delegatee2), delegatedAmount);
  }
}

contract GetAccountTotalGovernanceVotingPower is LockedGoldFoundryTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  uint256 value = 1000;

  function setUp() public {
    super.setUp();

    vm.deal(delegator, 10 ether);
    vm.deal(delegatee, 10 ether);
  }

  function test_ShouldReturn0WhenNothingLockedNorAccount() public {
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), 0);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegatedForDelegateeAndDelegator_WhenOnlyDelegated_WhenHavingAccounts()
    public
  {
    uint256 delegatedPercent = 70;
    uint256 delegatedAmount = (value / 100) * delegatedPercent;

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee);
    accounts.createAccount();

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(delegatedPercent, 100).unwrap()
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), value - delegatedAmount);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegatedForDelegateeAndDelegator_WhenDelegateeHasLockedCelo_WhenHavingAccounts()
    public
  {
    uint256 delegatedPercent = 70;
    uint256 delegatedAmount = (value / 100) * delegatedPercent;

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee);
    accounts.createAccount();

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegatee);
    lockedGold.lock.value(value)();

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(delegatedPercent, 100).unwrap()
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount + value);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), value - delegatedAmount);
  }

}

contract GetDelegatorDelegateeInfo is LockedGoldFoundryTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  uint256 value = 1000;

  function setUp() public {
    super.setUp();

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee);
    accounts.createAccount();

    vm.deal(delegator, 10 ether);
    vm.deal(delegatee, 10 ether);
  }

  function test_ShouldReturn0WhenNothingDelegated() public {
    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      delegator,
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), 0);
    assertEq(currentAmount, 0);
  }

  function test_ShouldReturnCorrectPercentAndAmount_WhenLockedCelo() public {
    uint256 percent = 70;
    uint256 amount = (value / 100) * percent;

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegatee);
    lockedGold.lock.value(value)();

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percent, 100).unwrap()
    );

    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      delegator,
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percent);
    assertEq(currentAmount, amount);
  }
}

contract GetDelegatorDelegateeExpectedAndRealAmount is LockedGoldFoundryTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  address delegatorSigner;
  uint256 delegatorSignerPK;
  address delegateeSigner;
  uint256 delegateeSignerPK;
  uint256 value = 1000;

  function setUp() public {
    super.setUp();

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee);
    accounts.createAccount();

    vm.deal(delegator, 10 ether);
    vm.deal(delegatee, 10 ether);

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    vm.prank(delegatee);
    lockedGold.lock.value(value)();

    (delegatorSigner, delegatorSignerPK) = actorWithPK("delegatorSigner");
    (delegateeSigner, delegateeSignerPK) = actorWithPK("delegateeSigner");
  }

  function helper_WhenVoteSigners() public {
    createAndAssertDelegatorDelegateeSigners(
      delegator,
      delegatee,
      delegatorSignerPK,
      delegateeSignerPK
    );
  }

  function test_ShouldReturn0_WhenNothingDelegated() public {
    (uint256 expectedAmount, uint256 realAmount) = lockedGold
      .getDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee);
    assertEq(expectedAmount, 0);
    assertEq(realAmount, 0);
  }

  function test_ShouldReturnEqualAmounts_WhenDelegated() public {
    uint256 percent = 70;
    uint256 amount = (value / 100) * percent;

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percent, 100).unwrap()
    );

    (uint256 expectedAmount, uint256 realAmount) = lockedGold
      .getDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee);
    assertEq(expectedAmount, amount);
    assertEq(realAmount, amount);
  }

  function test_ShouldReturnEqualAmountAndUpdateTotalVotingPowerOfDelegatee_WhenMoreCeloLocked()
    public
  {
    uint256 percent = 70;
    uint256 updatedDelegatedAmount = ((value * 2) / 100) * percent;

    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percent, 100).unwrap()
    );

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    (uint256 expectedAmount, uint256 realAmount) = lockedGold
      .getDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee);
    assertEq(expectedAmount, updatedDelegatedAmount);
    assertEq(realAmount, updatedDelegatedAmount);

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee),
      updatedDelegatedAmount + value
    );
  }

  function test_ShouldReturnEqualAmounts_WhenDelegated_WhenVOteSigners() public {
    helper_WhenVoteSigners();
    uint256 percent = 70;
    uint256 amount = (value / 100) * percent;

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percent, 100).unwrap()
    );

    (uint256 expectedAmount, uint256 realAmount) = lockedGold
      .getDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee);
    assertEq(expectedAmount, amount);
    assertEq(realAmount, amount);
  }

  function test_ShouldReturnEqualAmountAndUpdateTotalVotingPowerOfDelegatee_WhenMoreCeloLocked_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    uint256 percent = 70;
    uint256 updatedDelegatedAmount = ((value * 2) / 100) * percent;

    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percent, 100).unwrap()
    );

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    (uint256 expectedAmount, uint256 realAmount) = lockedGold
      .getDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee);
    assertEq(expectedAmount, updatedDelegatedAmount);
    assertEq(realAmount, updatedDelegatedAmount);

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee),
      updatedDelegatedAmount + value
    );
  }
}

contract UpdateDelegatedAmount is LockedGoldFoundryTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  address delegatorSigner;
  uint256 delegatorSignerPK;
  address delegateeSigner;
  uint256 delegateeSignerPK;
  uint256 value = 1000;
  uint256 delegatedPercent = 70;
  uint256 delegatedAmount = (value / 100) * delegatedPercent;

  function setUp() public {
    super.setUp();

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee);
    accounts.createAccount();

    vm.deal(delegator, 10 ether);
    vm.deal(delegatee, 10 ether);

    vm.prank(delegator);
    lockedGold.lock.value(value)();

    (delegatorSigner, delegatorSignerPK) = actorWithPK("delegatorSigner");
    (delegateeSigner, delegateeSignerPK) = actorWithPK("delegateeSigner");
  }

  function helper_WhenVoteSigners() public {
    createAndAssertDelegatorDelegateeSigners(
      delegator,
      delegatee,
      delegatorSignerPK,
      delegateeSignerPK
    );
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegated_WhenDelegatorLockedMoreCelo()
    public
  {
    vm.prank(delegator);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(delegatedPercent, 100).unwrap()
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount);
    assertDelegatorDelegateeAmounts(delegator, delegatee, delegatedPercent, delegatedAmount);

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.updateDelegatedAmount(delegator, delegatee);

    assertEq(lockedGold.getAccountTotalLockedGold(delegator), value * 2);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount * 2);
    assertDelegatorDelegateeAmounts(delegator, delegatee, delegatedPercent, delegatedAmount * 2);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegated_WhenDelegatorLockedMoreCelo_WhenVoteSigners()
    public
  {
    helper_WhenVoteSigners();
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(delegatedPercent, 100).unwrap()
    );

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount);
    assertDelegatorDelegateeAmounts(delegator, delegatee, delegatedPercent, delegatedAmount);

    vm.prank(delegator);
    lockedGold.lock.value(value)();
    lockedGold.updateDelegatedAmount(delegator, delegatee);

    assertEq(lockedGold.getAccountTotalLockedGold(delegator), value * 2);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount * 2);
    assertDelegatorDelegateeAmounts(delegator, delegatee, delegatedPercent, delegatedAmount * 2);
  }
}

contract GetTotalPendingWithdrawalsCount is LockedGoldFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldReturn0_WhenAccountHasNoPendingWithdrawals() public {
    assertEq(lockedGold.getTotalPendingWithdrawalsCount(actor("account")), 0);
  }

  function test_ShouldReturnCorrectValue_WhenAccountHasPendingWithdrawals() public {
    address account = actor("account");
    vm.deal(account, 10 ether);
    uint256 value = 1000;

    vm.startPrank(account);
    accounts.createAccount();
    lockedGold.lock.value(value)();

    lockedGold.unlock(value / 2);
    lockedGold.unlock(value / 2);

    assertEq(lockedGold.getTotalPendingWithdrawalsCount(account), 2);
  }

  function test_ShouldReturn0_WhenNonExistentAccount() public {
    assertEq(lockedGold.getTotalPendingWithdrawalsCount(randomAddress), 0);
  }
}

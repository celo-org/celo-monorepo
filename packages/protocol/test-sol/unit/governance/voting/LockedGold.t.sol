// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@test-sol/unit/common/GoldTokenMock.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/governance/ReleaseGold.sol";
import "@celo-contracts/governance/Election.sol";
import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockGovernance.sol";
import "@celo-contracts/governance/test/MockValidators.sol";

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
  address caller = address(this);

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

    goldToken = new GoldTokenMock();
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

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
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

  struct WhenVoteSignerStruct {
    address delegator;
    address delegator2;
    address delegatee1;
    address delegatee2;
    uint256 delegatorSigner1PK;
    uint256 delegateeSigner1PK;
    uint256 delegatorSigner2PK;
    uint256 delegateeSigner2PK;
    bool lock;
  }

  /**
   * @notice Helper function to create assign vote signers to delegators and delegatees
   */
  function helper_WhenVoteSigners(WhenVoteSignerStruct memory config) public {
    if (config.lock) {
      vm.prank(config.delegator);
      lockedGold.lock.value(1000)();
      vm.prank(config.delegator2);
      lockedGold.lock.value(1000)();
    }

    if (config.delegator != address(0)) {
      createAndAssertDelegatorDelegateeSigners(
        config.delegator,
        config.delegatee1,
        config.delegatorSigner1PK,
        config.delegateeSigner1PK
      );
    }

    if (config.delegator2 != address(0)) {
      createAndAssertDelegatorDelegateeSigners(
        config.delegator2,
        config.delegatee2,
        config.delegatorSigner2PK,
        config.delegateeSigner2PK
      );
    }
  }

  function delegateCelo(address _delegator, address _delegatee, uint256 _percent) public {
    vm.prank(_delegator);
    lockedGold.delegateGovernanceVotes(
      _delegatee,
      FixidityLib.newFixedFraction(_percent, 100).unwrap()
    );
  }

  function revokeDelegatedVotes(address _delegator, address _delegatee, uint256 _percent) public {
    vm.prank(_delegator);
    lockedGold.revokeDelegatedGovernanceVotes(
      _delegatee,
      FixidityLib.newFixedFraction(_percent, 100).unwrap()
    );
  }

  function lockCelo(address celoOwner, uint256 value) public {
    vm.prank(celoOwner);
    lockedGold.lock.value(value)();
  }
}

contract LockedGoldTest_initialize is LockedGoldTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetOwner() public {
    assertEq(lockedGold.owner(), caller);
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

contract LockedGoldTest_setRegistry is LockedGoldTest {
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

contract LockedGoldTest_setUnlockingPeriod is LockedGoldTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetTheUnlockingPeriod() public {
    uint256 newUnlockingPeriod = 100;
    lockedGold.setUnlockingPeriod(newUnlockingPeriod);
    assertEq(lockedGold.unlockingPeriod(), newUnlockingPeriod);
  }

  function test_Emits_UnlockingPEriodSetEvent() public {
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

contract LockedGoldTest_lock is LockedGoldTest {
  uint256 value = 1000;
  function setUp() public {
    super.setUp();
  }

  function test_ShouldIncreaseTheAccountsNonVotingLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), value);
  }

  function test_ShouldIncreaseTheAccountTOtalLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getAccountTotalLockedGold(caller), value);
  }

  function test_ShouldIncreaseTheNonvotingLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getNonvotingLockedGold(), value);
  }

  function test_ShouldIncreaseTheTotalLockedGoldBalance() public {
    lockedGold.lock.value(value)();
    assertEq(lockedGold.getTotalLockedGold(), value);
  }

  function test_Emits_AGoldLockedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit GoldLocked(caller, value);
    lockedGold.lock.value(value)();
  }

  function test_ShouldRevertWhenAccountDoesNotExist() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    vm.prank(randomAddress);
    lockedGold.lock();
  }

  function test_ShouldRevertWhenUserDoesntHaveEnoughBalance() public {
    vm.expectRevert();
    vm.prank(randomAddress);
    lockedGold.lock.value(1)();
  }
}

contract LockedGoldTest_unlock is LockedGoldTest {
  uint256 value = 1000;
  uint256 availabilityTime = unlockingPeriod + block.timestamp;

  uint256 votingGold = 1;
  uint256 nonVotingGold = value - votingGold;

  uint256 balanceRequirement = 10;

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(value)();
  }

  function test_ShouldAddAPendingWithdrawal_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    lockedGold.unlock(value);
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(caller, 0);
    assertEq(val, value);
    assertEq(timestamp, availabilityTime);
    vm.expectRevert();
    lockedGold.getPendingWithdrawal(caller, 1);
  }

  function test_ShouldAddPendingWithdrawals_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    lockedGold.unlock(value);
    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(caller);
    assertEq(vals.length, 1);
    assertEq(timestamps.length, 1);
    assertEq(vals[0], value);
    assertEq(timestamps[0], availabilityTime);
  }

  function test_ShouldDecreaseTheACcountsNonVotingLockedGoldBalance_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    lockedGold.unlock(value);
    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), 0);
  }

  function test_ShouldDecreaseTheAccountsTotalLockedGoldBalance_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    lockedGold.unlock(value);
    assertEq(lockedGold.getAccountTotalLockedGold(caller), 0);
  }

  function test_ShouldDecreaseTheNonVotingLockedGoldBalance_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    lockedGold.unlock(value);
    assertEq(lockedGold.getNonvotingLockedGold(), 0);
  }

  function test_ShouldDecreaseTheTotalLockedGoldBalance_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    lockedGold.unlock(value);
    assertEq(lockedGold.getTotalLockedGold(), 0);
  }

  function test_Emits_GoldUnlockedEvent_WhenAccountIsNotVotingInGovernance_WhenThereAreNoBalanceRequirements()
    public
  {
    vm.expectEmit(true, true, true, true);
    emit GoldUnlocked(caller, value, availabilityTime);
    lockedGold.unlock(value);
  }

  function test_ShouldRevertWhenUnlockingGoldThatIsVotedWith_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    vm.expectRevert("Not enough unlockable celo. Celo is locked in voting.");
    lockedGold.unlock(value);
  }

  function test_ShouldRevertWhenUnlockingMoreThenLocked_WhenThereAreNoBalanceRequirements() public {
    vm.expectRevert("SafeMath: subtraction overflow");
    lockedGold.unlock(value + 1);
  }

  function test_ShouldAddAPendingWithdrawal_WhenTheAccountIsRequestingOnlyNonVotingGold_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    lockedGold.unlock(nonVotingGold);
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(caller, 0);
    assertEq(val, nonVotingGold);
    assertEq(timestamp, availabilityTime);
    vm.expectRevert();
    lockedGold.getPendingWithdrawal(caller, 1);
  }

  function test_ShouldAddPendingWithdrawals_WhenTheAccountIsRequestingOnlyNonVotingGold_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    lockedGold.unlock(nonVotingGold);
    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(caller);
    assertEq(vals.length, 1);
    assertEq(timestamps.length, 1);
    assertEq(vals[0], nonVotingGold);
    assertEq(timestamps[0], availabilityTime);
  }

  function test_ShouldDecreaseTheACcountsNonVotingLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), votingGold);
  }

  function test_ShouldDecreaseTheAccountsTotalLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getAccountTotalLockedGold(caller), votingGold);
  }

  function test_ShouldDecreaseTheNonVotingLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getNonvotingLockedGold(), votingGold);
  }

  function test_ShouldDecreaseTheTotalLockedGoldBalance_WhenTheAccountIsRequestingOnlyNonVotingGold_WhenThereAreNoBalanceRequirements()
    public
  {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    lockedGold.unlock(nonVotingGold);
    assertEq(lockedGold.getTotalLockedGold(), votingGold);
  }

  function test_Emits_GoldUnlockedEvent_WhenTheAccountIsRequestingOnlyNonVotingGold() public {
    governance.setVoting(caller);
    governance.setTotalVotes(caller, votingGold);

    vm.expectEmit(true, true, true, true);
    emit GoldUnlocked(caller, nonVotingGold, availabilityTime);
    lockedGold.unlock(nonVotingGold);
  }

  function test_ShouldRevert_WhenTheCorrectTimeIsEarlierThanTheRequirementTime_WhenThereIsBalanceRequirement()
    public
  {
    validators.setAccountLockedGoldRequirement(caller, balanceRequirement);
    vm.expectRevert(
      "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
    );
    lockedGold.unlock(value);
  }

  function test_ShouldSucceed_WhenTheCorrectTimeIsEarlierThanTheRequirementTimeButRequestingCeloWithoutBalanceRequirement_WhenThereIsBalanceRequirement()
    public
  {
    validators.setAccountLockedGoldRequirement(caller, balanceRequirement);
    lockedGold.unlock(value - balanceRequirement);
  }
}

contract LockedGoldTest_unlockDelegation is LockedGoldTest {
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
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(caller, 0);
    assertEq(val, toUnlock);
    assertEq(timestamp, availabilityTime);
  }

  function test_ShouldCorrectlyUpdateDelegatedAmountForDelegatee() public {
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
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
      caller,
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percentageToDelegate);
    assertEq(currentAmount, originallyDelegatedAmount / 2);
  }

  function test_ShouldNotRemoveDelegateeFromQueue_WhenAllIsUnlocked() public {
    governance.setTotalVotes(delegatee, originallyDelegatedAmount / 2);
    lockedGold.unlock(toUnlock);
    address[] memory delegatees = lockedGold.getDelegateesOfDelegator(caller);
    assertEq(delegatees.length, 1);
    assertEq(delegatees[0], delegatee);
  }

  function test_ShouldCorrectlyUpdateDelegatorDelegateeAmount_WhenAllIsUnlocked() public {
    governance.setTotalVotes(delegatee, originallyDelegatedAmount / 2);
    lockedGold.unlock(toUnlock);
    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      caller,
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percentageToDelegate);
    assertEq(currentAmount, 0);
  }
}

contract LockedGoldTest_unlock_WhenDelegation2Delegatees is LockedGoldTest {
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
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(caller, 0);
    assertEq(val, toUnlock);
    assertEq(timestamp, availabilityTime);
  }

  function test_ShouldCorrectlyUpdateDelegatedAmountForDelegatee() public {
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
      delegatee
    );
    assertEq(expected, originallyDelegatedAmount / 2 - 1);
    assertEq(real, toUnlock / 2);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
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

contract LockedGoldTest_unlock_WhenDelegatingTo3Delegatees is LockedGoldTest {
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
      caller,
      delegatee
    );
    assertEq(expected, 1);
    assertEq(real, 1);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
      delegatee2
    );

    assertEq(expected2, 1);
    assertEq(real2, 1);

    (uint256 expected3, uint256 real3) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
      delegatee3
    );

    assertEq(expected3, 1);
    assertEq(real3, 1);
  }

  function test_ShouldCorrectlyUnlockWhenGettingLessOrEqualToLockedAmount() public {
    lockedGold.unlock(toUnlock);
    (uint256 val, uint256 timestamp) = lockedGold.getPendingWithdrawal(caller, 0);
    assertEq(val, toUnlock);
    assertEq(timestamp, availabilityTime);
  }

  function test_ShouldCorrectlyUpdateDelegatedAmountForDelegatee() public {
    lockedGold.unlock(toUnlock);
    (uint256 expected, uint256 real) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
      delegatee
    );
    assertEq(expected, 0);
    assertEq(real, 0);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
      delegatee2
    );

    assertEq(expected2, 0);
    assertEq(real2, 0);

    (uint256 expected3, uint256 real3) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
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

  function test_Emits_DelegatedCeloRevokedEventForDelegatee1() public {
    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(caller, delegatee, 0, 1);
    lockedGold.unlock(toUnlock);
  }

  function test_Emits_DelegatedCeloRevokedEventForDelegatee2() public {
    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(caller, delegatee2, 0, 1);
    lockedGold.unlock(toUnlock);
  }

  function test_Emits_DelegatedCeloRevokedEventForDelegatee3() public {
    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(caller, delegatee3, 0, 1);
    lockedGold.unlock(toUnlock);
  }
}

contract LockedGoldTest_lock_AfterUnlocking is LockedGoldTest {
  uint256 pendingWithdrawalValue = 100;
  uint256 index = 0;
  address delegatee = actor("delegatee");

  function setUp() public {
    super.setUp();
    lockedGold.lock.value(pendingWithdrawalValue)();
  }

  function helper_unlockRelockSameAmount() public {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);
  }

  function helper_unlockAndRelockLess() public {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheAccountsNonVotingLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockRelockSameAmount();

    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), pendingWithdrawalValue);
  }

  function test_ShouldIncreaseTheAccountsTotalLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockRelockSameAmount();

    assertEq(lockedGold.getAccountTotalLockedGold(caller), pendingWithdrawalValue);
  }

  function test_ShouldIncreaseTheNonVotingLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockRelockSameAmount();

    assertEq(lockedGold.getNonvotingLockedGold(), pendingWithdrawalValue);
  }

  function test_ShouldIncreaseTheTotalLockedGoldBalance_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockRelockSameAmount();

    assertEq(lockedGold.getTotalLockedGold(), pendingWithdrawalValue);
  }

  function test_Emits_GoldRelockedEvent_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    vm.expectEmit(true, true, true, true);
    emit GoldRelocked(caller, pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue);
  }

  function test_ShouldRemoveThePendingWithdrawal_WhenRelockingValueEqualToTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockRelockSameAmount();

    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(caller);
    assertEq(vals.length, 0);
    assertEq(timestamps.length, 0);
  }

  function test_ShouldIncreaseTheAccountsNonVotingLockedGoldBalance_WhenRelockingValueLessThanValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockAndRelockLess();

    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheAccountsTotalLockedGoldBalance_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockAndRelockLess();

    assertEq(lockedGold.getAccountTotalLockedGold(caller), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheNonVotingLockedGoldBalance_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockAndRelockLess();

    assertEq(lockedGold.getNonvotingLockedGold(), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTheTotalLockedGoldBalance_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    helper_unlockAndRelockLess();

    assertEq(lockedGold.getTotalLockedGold(), pendingWithdrawalValue - 1);
  }

  function test_Emits_GoldRelockedEvent_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    vm.expectEmit(true, true, true, true);
    emit GoldRelocked(caller, pendingWithdrawalValue - 1);
    lockedGold.relock(index, pendingWithdrawalValue - 1);
  }

  function test_ShouldRemoveThePendingWithdrawal_WhenRelockingValueLessThanTheValueOfThePendingWithdrawal_WhenPendingWithdrawalExists()
    public
  {
    lockedGold.unlock(pendingWithdrawalValue);
    lockedGold.relock(index, pendingWithdrawalValue - 1);

    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(caller);
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
      caller,
      delegatee
    );

    assertEq(expected, pendingWithdrawalValue / 2);
    assertEq(real, pendingWithdrawalValue / 2);

    lockedGold.relock(index, pendingWithdrawalValue / 2);

    (uint256 expected2, uint256 real2) = lockedGold.getDelegatorDelegateeExpectedAndRealAmount(
      caller,
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

contract LockedGoldTest_withdraw is LockedGoldTest {
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
    (uint256[] memory vals, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(caller);
    assertEq(vals.length, 0);
    assertEq(timestamps.length, 0);
  }

  function test_Emits_GoldWithdrawnEvent_WhenItIsAfterTheAvailabilityTime() public {
    lockedGold.unlock(value);
    vm.warp(block.timestamp + unlockingPeriod + 1);
    vm.expectEmit(true, true, true, true);
    emit GoldWithdrawn(caller, value);
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

contract LockedGoldTest_addSlasher is LockedGoldTest {
  string slasherName = "DowntimeSlasher";
  address downtimeSlasher = actor(slasherName);

  function setUp() public {
    super.setUp();
    registry.setAddressFor(slasherName, downtimeSlasher);
  }

  function test_ShouldBeAbleToAddSlasherToWhitelist() public {
    lockedGold.addSlasher(slasherName);
    bytes32[] memory slashers = lockedGold.getSlashingWhitelist();
    assertEq(slashers[0], keccak256(abi.encodePacked(slasherName)));
  }

  function test_ShouldBeCallableOnlyByOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    lockedGold.addSlasher(slasherName);
  }

  function test_ShouldNotAllowToAddSlasherTwice() public {
    lockedGold.addSlasher(slasherName);
    vm.expectRevert("Cannot add slasher ID twice.");
    lockedGold.addSlasher(slasherName);
  }
}

contract LockedGoldTest_removeSlasher is LockedGoldTest {
  string slasherName = "DowntimeSlasher";
  string governanceSlasherName = "GovernanceSlasher";
  address downtimeSlasher = actor(slasherName);
  address governanceSlasher = actor(governanceSlasherName);

  function setUp() public {
    super.setUp();
    registry.setAddressFor(slasherName, downtimeSlasher);
    registry.setAddressFor(governanceSlasherName, governanceSlasher);
    lockedGold.addSlasher(slasherName);
  }

  function test_ShouldRemoveItemFromWhitelist() public {
    lockedGold.removeSlasher(slasherName, 0);
    bytes32[] memory slashers = lockedGold.getSlashingWhitelist();
    assertEq(slashers.length, 0);
  }

  function test_ShouldBeCallableOnlyByTheOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(randomAddress);
    lockedGold.removeSlasher(slasherName, 0);
  }

  function test_ShouldRevertWhenIndexTooLarge() public {
    vm.expectRevert("Provided index exceeds whitelist bounds.");
    lockedGold.removeSlasher(slasherName, 1);
  }

  function test_ShouldRevertWhenKeyDoesNotExist() public {
    vm.expectRevert("Cannot remove slasher ID not yet added.");
    lockedGold.removeSlasher(governanceSlasherName, 0);
  }

  function test_ShouldRevertWhenIndexAndKeyHaveMismatch() public {
    lockedGold.addSlasher(governanceSlasherName);
    vm.expectRevert("Index doesn't match identifier");
    lockedGold.removeSlasher(slasherName, 1);
  }
}

contract LockedGoldTest_slash is LockedGoldTest {
  string slasherName = "DowntimeSlasher";
  uint256 value = 1000;
  address group = actor("group");
  address groupMember = actor("groupMember");
  address reporter = actor("reporter");
  address downtimeSlasher = actor(slasherName);
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
    registry.setAddressFor("Validators", caller);
    electionSlashTest.markGroupEligible(group, address(0), address(0));
    registry.setAddressFor("Validators", address(validators));
    validators.setNumRegisteredValidators(1);

    lockedGold.lock.value(value)();
    registry.setAddressFor(slasherName, downtimeSlasher);
    lockedGold.addSlasher(slasherName);

    vm.prank(reporter);
    accounts.createAccount();
  }

  function helper_WhenAccountIsSlashedForAllOfItsLockedGold(
    uint256 penalty,
    uint256 reward
  ) public {
    address[] memory lessers = new address[](1);
    lessers[0] = address(0);
    address[] memory greaters = new address[](1);
    greaters[0] = address(0);

    uint256[] memory indices = new uint256[](1);
    indices[0] = 0;

    vm.prank(downtimeSlasher);
    lockedGold.slash(caller, penalty, reporter, reward, lessers, greaters, indices);
  }

  function test_ShouldReduceAccountsLockedGoldBalance_WhenAccountIsSlashedForAllOfItsLockedGold()
    public
  {
    uint256 penalty = value;
    uint256 reward = value / 2;
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), value - penalty);
    assertEq(lockedGold.getAccountTotalLockedGold(caller), value - penalty);
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
    lockedGold.removeSlasher(slasherName, 0);
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
    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), nonVoting - penalty);
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

    assertEq(lockedGold.getAccountTotalLockedGold(caller), value - penalty);
    assertEq(electionSlashTest.getTotalVotesByAccount(caller), voting);
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
    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), 0);
  }

  function test_ShouldLeaveTheVotingLockedGold_WhenAccountIsSlashedFoItsWholeBalance_WhenTheAccountHasHalfVotingAndHalfNonVotingGold()
    public
  {
    uint256 voting = value / 2;
    uint256 penalty = value;
    uint256 reward = penalty / 2;
    electionSlashTest.vote(group, voting, address(0), address(0));
    helper_WhenAccountIsSlashedForAllOfItsLockedGold(penalty, reward);

    assertEq(lockedGold.getAccountTotalLockedGold(caller), 0);
    assertEq(electionSlashTest.getTotalVotesByAccount(caller), 0);
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

    assertEq(lockedGold.getAccountNonvotingLockedGold(caller), 0);
    assertEq(lockedGold.getAccountTotalLockedGold(caller), 0);
    assertEq(electionSlashTest.getTotalVotesByAccount(caller), 0);
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
    lockedGold.slash(caller, value, reporter, value / 2, lessers, greaters, indices);
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

contract LockedGoldTest_delegateGovernanceVotes is LockedGoldTest {
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

  uint256 value = 1000;
  uint256 percentToDelegate = 30;
  uint256 delegatedAmount = (value * percentToDelegate) / 100;

  uint256 percentToDelegate1 = 30;
  uint256 percentToDelegate2 = 20;
  uint256 percentToDelegate3 = 50;
  uint256 delegatedAmount1 = (value * percentToDelegate1) / 100;
  uint256 delegatedAmount2 = (value * percentToDelegate2) / 100;
  uint256 delegatedAmount3 = (value * percentToDelegate3) / 100;

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

  function whenVoteSigner_LockedGoldDelegateGovernanceVotes() public {
    helper_WhenVoteSigners(
      WhenVoteSignerStruct(
        delegator,
        delegator2,
        delegatee1,
        delegatee2,
        delegatorSignerPK,
        delegateeSigner1PK,
        delegatorSigner2PK,
        delegateeSigner2PK,
        true
      )
    );
  }

  function test_ShouldRevertWhenDelegateeIsNotAccount() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    lockedGold.delegateGovernanceVotes(randomAddress, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldRevert_WhenDelegatorIsNotAnAccount() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    vm.prank(randomAddress);
    lockedGold.delegateGovernanceVotes(caller, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldReturnCorrectDelegatedAmount_WhenNoGoldIsLocked_WhenNoVoteSigners() public {
    delegateCelo(delegator, delegatee1, percentToDelegate);

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, 0);
    assertEq(
      FixidityLib.wrap(lockedGold.getAccountTotalDelegatedFraction(delegator) * 100).fromFixed(),
      percentToDelegate
    );
  }

  function test_Emits_CeloDelegatedEvent_WhenNoGoldIsLocked_WhenNoVoteSigner() public {
    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      0
    );
    delegateCelo(delegator, delegatee1, percentToDelegate);
  }

  function test_ShouldRevert_WhenDelegatingAsValidator() public {
    validators.setValidator(delegator);
    vm.expectRevert("Validators cannot delegate votes.");
    delegateCelo(delegator, delegatee1, 100);
  }

  function test_ShouldRevert_WhenDelegatingAsValidatorGroup() public {
    validators.setValidatorGroup(delegator);
    vm.expectRevert("Validator groups cannot delegate votes.");
    delegateCelo(delegator, delegatee1, 100);
  }

  function test_ShouldRevertWhenIncorrectPercentAmountIsInserted() public {
    vm.expectRevert("Delegate fraction must be less than or equal to 1");
    delegateCelo(delegator, delegatee1, 101);
  }

  function test_ShouldRevertWhenDelegatingVotesThatAreCurrentlyVotingForProposal_WhenDelegatorIsVotingInReferendum_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    governance.setTotalVotes(delegator, 1);

    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    delegateCelo(delegator, delegatee1, 100);
  }

  function test_ShouldRevertWhenDelegatingVotesThatAreCurrentlyVotingForProposal2Delegatees_WhenDelegatorIsVotingInReferendum_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    governance.setTotalVotes(delegator, 1);

    delegateCelo(delegator, delegatee1, 99);

    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    delegateCelo(delegator, delegatee2, 1);
  }

  function test_ShouldDelegateWhenVotingForLessThanRequestedForDelegatetion_WhenDelegatorIsVotingInReferendum_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    governance.setTotalVotes(delegator, 1);

    delegateCelo(delegator, delegatee1, 99);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 10);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 990);
  }

  function test_ShouldRevertWhenDelegatingMoreThan100PercentInTwoStepsForDifferentDelegatees_WhenDelegatingToDelegatee1_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, 10);
    vm.expectRevert("Cannot delegate more than 100%");
    delegateCelo(delegator, delegatee2, 100);
  }

  function test_ShouldDelegateCorrectlyWhenDelegatedToSameDelegateeInTwoSteps_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, 10);
    delegateCelo(delegator, delegatee1, 100);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 0);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 1000);
  }

  function test_Emits_CeloDelegatedEvent_WhenSomeGoldIsLocked() public {
    lockCelo(delegator, value);
    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      delegatedAmount
    );

    delegateCelo(delegator, delegatee1, percentToDelegate);
  }

  function test_ShouldDelegateVotesCorrectly_WhenSomeGoldIsLocked() public {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentToDelegate);

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, delegatedAmount);
  }

  function test_ShouldDelegateVotesCorrectlyToMultipleAccounts_WhenSomeGoldIsLocked() public {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentToDelegate1);
    delegateCelo(delegator, delegatee2, percentToDelegate2);
    delegateCelo(delegator, delegatee3, percentToDelegate3);

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate1, delegatedAmount1);
    assertDelegatorDelegateeAmounts(delegator, delegatee2, percentToDelegate2, delegatedAmount2);
    assertDelegatorDelegateeAmounts(delegator, delegatee3, percentToDelegate3, delegatedAmount3);
  }

  function test_ShouldDelegateVotesCorrectly_WhenLockedMoreGoldAndRedelegate_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentToDelegate);

    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentToDelegate);

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, delegatedAmount * 2);
  }

  function test_Emits_TheCeloDelegatedEvent_WhenLockedMoreGoldAndRedelegate_WhenSomeGoldIsLocked()
    public
  {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentToDelegate);
    lockCelo(delegator, value);

    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      delegatedAmount * 2
    );

    delegateCelo(delegator, delegatee1, percentToDelegate);
  }

  function test_ShouldDelegateVotesCorrectly_When2DelegatorsAreDelegatingToDelegatee() public {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentToDelegate1);

    lockCelo(delegator2, value);
    delegateCelo(delegator2, delegatee1, percentToDelegate2);

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate1, delegatedAmount1);
    assertDelegatorDelegateeAmounts(delegator2, delegatee1, percentToDelegate2, delegatedAmount2);
  }

  function test_ShouldRevertWhenIncorrectPercentAmountIsInserted_WhenSomeGoldIsLocked_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    vm.expectRevert("Delegate fraction must be less than or equal to 1");
    delegateCelo(delegatorSigner, delegatee1, 101);
  }

  function test_ShouldRevertWhenDelegatingVotesThatAreCurrentlyVotingForProposal_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    governance.setTotalVotes(delegator, 1);
    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    delegateCelo(delegatorSigner, delegatee1, 100);
  }

  function test_ShouldRevertWhenVotingForProposalWIthVotesThatAreCurrentlyUsedInReferendum2Delegatees_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    governance.setTotalVotes(delegator, 1);
    delegateCelo(delegatorSigner, delegatee1, 99);
    vm.expectRevert("Cannot delegate votes that are voting in referendum");
    delegateCelo(delegatorSigner, delegatee2, 1);
  }

  function test_ShouldDelegate_WhenVotingForLessThanRequestedForDelegation_WHenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    governance.setTotalVotes(delegator, 1);
    delegateCelo(delegatorSigner, delegatee1, 99);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 10);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 990);
  }

  function test_ShouldRevertWhenDelegatingMoreThan100PercentInTwoStepsToTwoDifferentDelegatees_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    delegateCelo(delegatorSigner, delegatee1, 10);
    vm.expectRevert("Cannot delegate more than 100%");
    delegateCelo(delegatorSigner, delegatee2, 100);
  }

  function test_ShouldDelegateCorrectlyWhenDelegatedToSameAccountInTwoSteps_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();

    delegateCelo(delegatorSigner, delegatee1, 10);
    delegateCelo(delegatorSigner, delegatee1, 100);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), 0);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee1), 1000);
  }

  function test_Emits_CeloDelegatedEvent_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();

    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate, 100).unwrap(),
      delegatedAmount
    );

    delegateCelo(delegatorSigner, delegatee1, percentToDelegate);
  }

  function test_ShouldDelegateVotesCorrectly_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();

    delegateCelo(delegatorSigner, delegatee1, percentToDelegate);
    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate, delegatedAmount);
  }

  function test_ShouldDelegateVotesCorrectlyToMultipleAccounts_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();

    delegateCelo(delegatorSigner, delegatee1, percentToDelegate1);
    delegateCelo(delegatorSigner2, delegatee2, percentToDelegate2);

    assertDelegatorDelegateeAmounts(delegator, delegatee1, percentToDelegate1, delegatedAmount1);
    assertDelegatorDelegateeAmounts(delegator2, delegatee2, percentToDelegate2, delegatedAmount2);
  }

  function test_ShouldDelegateVotesCorrectly_WhenLockedMoreGoldAndRedelegate_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();

    delegateCelo(delegatorSigner, delegateeSigner1, percentToDelegate1);

    lockCelo(delegator, value);
    delegateCelo(delegatorSigner, delegatee1, percentToDelegate1);

    assertDelegatorDelegateeAmounts(
      delegator,
      delegatee1,
      percentToDelegate1,
      delegatedAmount1 * 2
    );
  }

  function test_Emits_CeloDelegated_WhenLockedMoreGoldAndRedelegate_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();

    delegateCelo(delegatorSigner, delegatee1, percentToDelegate1);

    lockCelo(delegator, value);
    vm.expectEmit(true, true, true, true);
    emit CeloDelegated(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentToDelegate1, 100).unwrap(),
      delegatedAmount1 * 2
    );
    delegateCelo(delegatorSigner, delegatee1, percentToDelegate1);
  }

  function shouldRevertWhenTryingToAddExtraDelegatee(address _delegatorSinger) public {
    lockedGold.setMaxDelegateesCount(2);
    lockCelo(delegator, value);
    delegateCelo(_delegatorSinger, delegatee1, 50);
    delegateCelo(_delegatorSinger, delegatee2, 50);

    address[] memory delegateesOfDelegator = lockedGold.getDelegateesOfDelegator(delegator);
    assertEq(delegateesOfDelegator.length, 2);
    assertEq(delegateesOfDelegator[0], delegatee1);
    assertEq(delegateesOfDelegator[1], delegatee2);

    vm.expectRevert("Too many delegatees");
    delegateCelo(_delegatorSinger, delegatee3, 50);
  }

  function test_ShouldRevertWhenTryingToAddExtraDelegatee() public {
    shouldRevertWhenTryingToAddExtraDelegatee(delegator);
  }

  function test_ShouldRevertWhenTryingToAddExtraDelegatee_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    shouldRevertWhenTryingToAddExtraDelegatee(delegatorSigner);
  }

  function shouldAllowToAddExtraDelegatee_WhenLimitIsIncreased(address _delegatorSigner) public {
    lockedGold.setMaxDelegateesCount(2);
    lockCelo(delegator, value);
    delegateCelo(_delegatorSigner, delegatee1, 50);
    delegateCelo(_delegatorSigner, delegatee2, 40);

    address[] memory delegateesOfDelegator = lockedGold.getDelegateesOfDelegator(delegator);
    assertEq(delegateesOfDelegator.length, 2);
    assertEq(delegateesOfDelegator[0], delegatee1);
    assertEq(delegateesOfDelegator[1], delegatee2);
    lockedGold.setMaxDelegateesCount(3);
    vm.prank(_delegatorSigner);
    lockedGold.delegateGovernanceVotes(delegatee3, FixidityLib.newFixedFraction(10, 100).unwrap());
  }

  function test_ShouldAllowToAddExtraDelegatee_WhenLimitIsIncreased() public {
    shouldAllowToAddExtraDelegatee_WhenLimitIsIncreased(delegator);
  }

  function test_ShouldAllowToAddExtraDelegatee_WhenLimitIsIncreased_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldDelegateGovernanceVotes();
    shouldAllowToAddExtraDelegatee_WhenLimitIsIncreased(delegatorSigner);
  }
}

contract LockedGoldTest_revokeDelegatedGovernanceVotes is LockedGoldTest {
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

  uint256 value = 1000;
  uint256 percentageToRevoke = 2;
  uint256 percentageToDelegate = 10;
  uint256 delegatedAmount = (value * percentageToDelegate) / 100;
  uint256 amountToRevoke = (value / 100) * percentageToRevoke;
  uint256 votingWeight = 100;
  uint256 votingAmount = (delegatedAmount * 2 - amountToRevoke);

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

  function whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes() public {
    helper_WhenVoteSigners(
      WhenVoteSignerStruct(
        delegator,
        delegator2,
        delegatee1,
        delegatee2,
        delegatorSignerPK,
        delegateeSigner1PK,
        delegatorSigner2PK,
        delegateeSigner2PK,
        true
      )
    );
  }

  function shouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero(
    address _delegatorSigner,
    address _delegatorSigner2,
    bool lock
  ) public {
    if (lock) {
      lockCelo(delegator, value);
      lockCelo(delegator2, value);
    }
    uint256 percentageToRevokeAfterLock = 6;
    uint256 amountFromDelegator1AfterRevoke = ((2 * delegatedAmount) / percentageToDelegate) *
      (percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock);

    delegateCelo(_delegatorSigner, delegatee1, percentageToDelegate);
    delegateCelo(_delegatorSigner2, delegatee1, percentageToDelegate);
    revokeDelegatedVotes(_delegatorSigner, delegatee1, percentageToRevoke);
    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount * 2 - amountToRevoke
    );

    lockCelo(delegator, value);
    governance.setTotalVotes(delegatee1, votingAmount);
    revokeDelegatedVotes(_delegatorSigner, delegatee1, percentageToRevokeAfterLock);

    assertDelegatedVotes_ShouldRevokeVotesCorrectlyWhenDelegateeVoting(
      amountFromDelegator1AfterRevoke,
      percentageToRevokeAfterLock
    );
  }

  function shouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero(
    address _delegatorSigner,
    address _delegatorSigner2,
    bool lock
  ) public {
    if (lock) {
      lockCelo(delegator, value);
      lockCelo(delegator2, value);
    }
    uint256 percentageToRevokeAfterLock = 2;
    uint256 amountFromDelegator1AfterRevoke = ((2 * delegatedAmount) / percentageToDelegate) *
      (percentageToDelegate - percentageToRevoke - percentageToRevokeAfterLock);

    delegateCelo(_delegatorSigner, delegatee1, percentageToDelegate);
    delegateCelo(_delegatorSigner2, delegatee1, percentageToDelegate);
    revokeDelegatedVotes(_delegatorSigner, delegatee1, percentageToRevoke);

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(delegatee1),
      delegatedAmount * 2 - amountToRevoke
    );

    lockCelo(delegator, value);
    governance.setTotalVotes(delegatee1, votingAmount);
    revokeDelegatedVotes(_delegatorSigner, delegatee1, percentageToRevokeAfterLock);

    assertDelegatedVotes_ShouldRevokeVotesCorrectlyWhenDelegateeVoting(
      amountFromDelegator1AfterRevoke,
      percentageToRevokeAfterLock
    );
    assertEq(governance.removeVotesCalledFor(delegatee1), 0);
  }

  function assertDelegatedVotes_ShouldRevokeVotesCorrectlyWhenDelegateeVoting(
    uint256 amountFromDelegator1AfterRevoke,
    uint256 percentageToRevokeAfterLock
  ) public {
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
  }

  function shouldRevokeCorrectlyWhenDelegateeVoting(
    address _delegator,
    address _delegatorSigner,
    address _delegatee1,
    address _delegatee2,
    bool lock
  ) public {
    if (lock) {
      lockCelo(_delegator, value);
    }
    delegateCelo(_delegatorSigner, _delegatee1, percentageToDelegate);
    delegateCelo(_delegatorSigner, _delegatee2, percentageToDelegate);
    governance.setTotalVotes(_delegatee1, votingWeight);
    revokeDelegatedVotes(_delegatorSigner, _delegatee1, percentageToRevoke);

    assertDelegatedVotes_ShouldRevokeCorrectly();
  }

  function shouldRevokeCorrectlyWhenDelegateeNotVoting(
    address _delegatorSigner,
    bool lockGold
  ) public {
    if (lockGold) {
      lockCelo(delegator, value);
    }
    delegateCelo(_delegatorSigner, delegatee1, percentageToDelegate);
    delegateCelo(_delegatorSigner, delegatee2, percentageToDelegate);
    revokeDelegatedVotes(_delegatorSigner, delegatee1, percentageToRevoke);

    assertDelegatedVotes_ShouldRevokeCorrectly();
  }

  function assertDelegatedVotes_ShouldRevokeCorrectly() public {
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
    lockCelo(delegator, 100);
    delegateCelo(delegator, delegatee1, 50);

    vm.expectRevert("Not enough total delegated percents");
    revokeDelegatedVotes(delegator, delegatee1, 51);
  }

  function test_ShouldRevokeVotesCorrectly_WhenDelegateeNotVoting() public {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentageToDelegate);
    revokeDelegatedVotes(delegator, delegatee1, percentageToRevoke);

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

  function test_Emits_DelegatedCeloRevokedEvent() public {
    lockCelo(delegator, value);
    delegateCelo(delegator, delegatee1, percentageToDelegate);

    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap(),
      amountToRevoke
    );
    revokeDelegatedVotes(delegator, delegatee1, percentageToRevoke);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero()
    public
  {
    shouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero(
      delegator,
      delegator2,
      true
    );
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero()
    public
  {
    shouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero(
      delegator,
      delegator2,
      true
    );
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeNotVoting_WhenDelegatedTo2Accounts() public {
    shouldRevokeCorrectlyWhenDelegateeNotVoting(delegator, true);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenDelegatedTo2Accounts() public {
    shouldRevokeCorrectlyWhenDelegateeVoting(delegator, delegator, delegatee1, delegatee2, true);
  }

  function test_ShouldRevertWhenTryingToRevertMorePercentThanDelegated_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();
    delegateCelo(delegatorSigner, delegateeSigner1, 50);

    vm.expectRevert("Not enough total delegated percents");
    revokeDelegatedVotes(delegatorSigner, delegateeSigner1, 51);
  }

  function test_ShouldRevokeVotesCorrectly_WhenDelegateeNotVoting_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();

    delegateCelo(delegatorSigner, delegateeSigner1, percentageToDelegate);
    revokeDelegatedVotes(delegatorSigner, delegateeSigner1, percentageToRevoke);

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

  function test_Emits_DelegatedCeloRevokedEvent_WhenVoteSigners() public {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();
    delegateCelo(delegatorSigner, delegatee1, percentageToDelegate);

    vm.expectEmit(true, true, true, true);
    emit DelegatedCeloRevoked(
      delegator,
      delegatee1,
      FixidityLib.newFixedFraction(percentageToRevoke, 100).unwrap(),
      amountToRevoke
    );
    revokeDelegatedVotes(delegatorSigner, delegatee1, percentageToRevoke);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();
    shouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldDecreaseBelowZero(
      delegatorSigner,
      delegatorSigner2,
      false
    );
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();
    shouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenRevokingPercentageSuchAsThatWithNewlyLockedAmountIwWouldNotDecreaseBelowZero(
      delegatorSigner,
      delegatorSigner2,
      false
    );
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeNotVoting_WhenDelegatedTo2Accounts_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();
    shouldRevokeCorrectlyWhenDelegateeNotVoting(delegatorSigner, false);
  }

  function test_ShouldRevokeVotesCorrectlyWhenDelegateeVoting_WhenDelegatedTo2Accounts_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldRevokeDelegatedGovernanceVotes();
    shouldRevokeCorrectlyWhenDelegateeVoting(
      delegator,
      delegatorSigner,
      delegatee1,
      delegatee2,
      false
    );
  }
}

contract LockedGoldTest_getAccountTotalGovernanceVotingPower is LockedGoldTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  uint256 value = 1000;

  uint256 delegatedPercent = 70;
  uint256 delegatedAmount = (value / 100) * delegatedPercent;

  function setUp() public {
    super.setUp();

    vm.deal(delegator, 10 ether);
    vm.deal(delegatee, 10 ether);

    vm.prank(delegator);
    accounts.createAccount();
    vm.prank(delegatee);
    accounts.createAccount();

    vm.prank(delegator);
    lockedGold.lock.value(value)();
  }

  function test_ShouldReturn0WhenNothingLockedNorAccount() public {
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), 0);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegatedForDelegateeAndDelegator_WhenOnlyDelegated_WhenHavingAccounts()
    public
  {
    delegateCelo(delegator, delegatee, delegatedPercent);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), value - delegatedAmount);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegatedForDelegateeAndDelegator_WhenDelegateeHasLockedCelo_WhenHavingAccounts()
    public
  {
    lockCelo(delegatee, value);
    delegateCelo(delegator, delegatee, delegatedPercent);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegatee), delegatedAmount + value);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(delegator), value - delegatedAmount);
  }
}

contract LockedGoldTest_getDelegatorDelegateeInfo is LockedGoldTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  uint256 value = 1000;
  uint256 percent = 70;
  uint256 amount = (value / 100) * percent;

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
    lockCelo(delegator, value);
    lockCelo(delegatee, value);
    delegateCelo(delegator, delegatee, percent);

    (uint256 fraction, uint256 currentAmount) = lockedGold.getDelegatorDelegateeInfo(
      delegator,
      delegatee
    );
    assertEq(FixidityLib.wrap(fraction * 100).fromFixed(), percent);
    assertEq(currentAmount, amount);
  }
}

contract LockedGoldTest_getDelegatorDelegateeExpectedAndRealAmount is LockedGoldTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  address delegatorSigner;
  uint256 delegatorSignerPK;
  address delegateeSigner;
  uint256 delegateeSignerPK;
  uint256 value = 1000;
  uint256 percent = 70;
  uint256 amount = (value / 100) * percent;

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

  function whenVoteSigner_LockedGoldGetDelegatorDelegateeExpectedAndRealAmount() public {
    helper_WhenVoteSigners(
      WhenVoteSignerStruct(
        delegator,
        address(0),
        delegatee,
        address(0),
        delegatorSignerPK,
        delegateeSignerPK,
        0,
        0,
        false
      )
    );
  }

  function assertDelegatorDelegateeExpectedAndRealAmount(
    address _delegator,
    address _delegatee,
    uint256 expected,
    uint256 real
  ) public {
    (uint256 expectedAmount, uint256 realAmount) = lockedGold
      .getDelegatorDelegateeExpectedAndRealAmount(_delegator, _delegatee);
    assertEq(expectedAmount, expected);
    assertEq(realAmount, real);
  }

  function test_ShouldReturn0_WhenNothingDelegated() public {
    assertDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee, 0, 0);
  }

  function test_ShouldReturnEqualAmounts_WhenDelegated() public {
    delegateCelo(delegator, delegatee, percent);
    assertDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee, amount, amount);
  }

  function helper_ShouldReturnEqualAmount(
    address _delegator,
    address _delegatorSigner,
    address _delegatee
  ) public {
    uint256 updatedDelegatedAmount = ((value * 2) / 100) * percent;

    delegateCelo(_delegatorSigner, _delegatee, percent);
    lockCelo(_delegator, value);

    assertDelegatorDelegateeExpectedAndRealAmount(
      _delegator,
      _delegatee,
      updatedDelegatedAmount,
      updatedDelegatedAmount
    );

    assertEq(
      lockedGold.getAccountTotalGovernanceVotingPower(_delegatee),
      updatedDelegatedAmount + value
    );
  }

  function test_ShouldReturnEqualAmountAndUpdateTotalVotingPowerOfDelegatee_WhenMoreCeloLocked()
    public
  {
    helper_ShouldReturnEqualAmount(delegator, delegator, delegatee);
  }

  function test_ShouldReturnEqualAmounts_WhenDelegated_WhenVOteSigners() public {
    whenVoteSigner_LockedGoldGetDelegatorDelegateeExpectedAndRealAmount();
    vm.prank(delegatorSigner);
    lockedGold.delegateGovernanceVotes(
      delegatee,
      FixidityLib.newFixedFraction(percent, 100).unwrap()
    );

    assertDelegatorDelegateeExpectedAndRealAmount(delegator, delegatee, amount, amount);
  }

  function test_ShouldReturnEqualAmountAndUpdateTotalVotingPowerOfDelegatee_WhenMoreCeloLocked_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldGetDelegatorDelegateeExpectedAndRealAmount();
    helper_ShouldReturnEqualAmount(delegator, delegatorSigner, delegatee);
  }
}

contract LockedGoldTest_updateDelegatedAmount is LockedGoldTest {
  address delegator = actor("delegator");
  address delegatee = actor("delegatee");
  address delegatorSigner;
  uint256 delegatorSignerPK;
  address delegateeSigner;
  uint256 delegateeSignerPK;
  uint256 value = 1000;
  uint256 delegatedPercent = 70;
  uint256 delegatedAmount = (value / 100) * delegatedPercent;

  function whenVoteSigner_LockedGoldUpdateDelegatedAmount() public {
    helper_WhenVoteSigners(
      WhenVoteSignerStruct(
        delegator,
        address(0),
        delegatee,
        address(0),
        delegatorSignerPK,
        delegateeSignerPK,
        0,
        0,
        false
      )
    );
  }

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

  function helper_ShouldReturnCorrectValue(
    address _delegator,
    address _delegatorSigner,
    address _delegatee
  ) public {
    delegateCelo(_delegatorSigner, _delegatee, delegatedPercent);

    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(_delegatee), delegatedAmount);
    assertDelegatorDelegateeAmounts(_delegator, _delegatee, delegatedPercent, delegatedAmount);

    lockCelo(_delegator, value);
    lockedGold.updateDelegatedAmount(_delegator, _delegatee);

    assertEq(lockedGold.getAccountTotalLockedGold(_delegator), value * 2);
    assertEq(lockedGold.getAccountTotalGovernanceVotingPower(_delegatee), delegatedAmount * 2);
    assertDelegatorDelegateeAmounts(_delegator, _delegatee, delegatedPercent, delegatedAmount * 2);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegated_WhenDelegatorLockedMoreCelo()
    public
  {
    helper_ShouldReturnCorrectValue(delegator, delegator, delegatee);
  }

  function test_ShouldReturnCorrectValueWhenLockedAndDelegated_WhenDelegatorLockedMoreCelo_WhenVoteSigners()
    public
  {
    whenVoteSigner_LockedGoldUpdateDelegatedAmount();
    helper_ShouldReturnCorrectValue(delegator, delegatorSigner, delegatee);
  }
}

contract LockedGoldTest_getTotalPendingWithdrawalsCount is LockedGoldTest {
  uint256 value = 1000;
  address account = actor("account");

  function setUp() public {
    super.setUp();

    vm.deal(account, 10 ether);
  }

  function test_ShouldReturn0_WhenAccountHasNoPendingWithdrawals() public {
    assertEq(lockedGold.getTotalPendingWithdrawalsCount(actor("account")), 0);
  }

  function test_ShouldReturnCorrectValue_WhenAccountHasPendingWithdrawals() public {
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

contract LockedGoldTestGetPendingWithdrawalsInBatch is LockedGoldTest {
  uint256 value = 1000;

  function setUp() public {
    super.setUp();
  }

  function test_ShouldReturn0_WhenAccountHasNoPendingWithdrawals() public {
    (uint256[] memory pendingWithdrawals, uint256[] memory timestamps) = lockedGold
      .getPendingWithdrawalsInBatch(randomAddress, 0, 0);
    assertEq(pendingWithdrawals.length, 0);
    assertEq(timestamps.length, 0);
  }

  function test_ShouldReturnCorrectValue_WhenAccountHasPendingWithdrawals() public {
    lockedGold.lock.value(value)();

    lockedGold.unlock(value / 2);
    lockedGold.unlock(value / 2);

    (uint256[] memory pendingWithdrawals, uint256[] memory timestamps) = lockedGold
      .getPendingWithdrawalsInBatch(caller, 0, 1);
    assertEq(pendingWithdrawals.length, 2);
    assertEq(timestamps.length, 2);
    assertEq(pendingWithdrawals[0], value / 2);
    assertEq(pendingWithdrawals[1], value / 2);
  }

  function test_ShouldReturnCorrectValue_WhenAccountHasFourPendingWithdrawals() public {
    lockedGold.lock.value(value)();

    lockedGold.unlock(value / 4 - 1);
    lockedGold.unlock(value / 4 + 1);
    lockedGold.unlock(value / 4 - 2);
    lockedGold.unlock(value / 4 + 2);

    (uint256[] memory pendingWithdrawals, uint256[] memory timestamps) = lockedGold
      .getPendingWithdrawalsInBatch(caller, 0, 1);
    assertEq(pendingWithdrawals.length, 2);
    assertEq(timestamps.length, 2);
    assertEq(pendingWithdrawals[0], value / 4 - 1);
    assertEq(pendingWithdrawals[1], value / 4 + 1);
    (pendingWithdrawals, ) = lockedGold.getPendingWithdrawalsInBatch(caller, 2, 3);
    assertEq(pendingWithdrawals.length, 2);
    assertEq(timestamps.length, 2);
    assertEq(pendingWithdrawals[0], value / 4 - 2);
    assertEq(pendingWithdrawals[1], value / 4 + 2);
  }

  function test_ShouldReturnAsMuchAsPossible_WhenOverflowRangeProvided_WhenAccountHasPendingWithdrawals()
    public
  {
    lockedGold.lock.value(value)();

    lockedGold.unlock(value / 2);
    lockedGold.unlock(value / 2);

    (uint256[] memory pendingWithdrawals, uint256[] memory timestamps) = lockedGold
      .getPendingWithdrawalsInBatch(caller, 0, 2);
    assertEq(pendingWithdrawals.length, 2);
    assertEq(timestamps.length, 2);
    assertEq(pendingWithdrawals[0], value / 2);
    assertEq(pendingWithdrawals[1], value / 2);
  }

  function test_Revert_WhenFromIsBiggerThanTo_WhenAccountHasPendingWithdrawals() public {
    lockedGold.lock.value(value)();

    lockedGold.unlock(value / 2);
    lockedGold.unlock(value / 2);

    vm.expectRevert("Invalid range");
    lockedGold.getPendingWithdrawalsInBatch(caller, 1, 0);
  }

  function test_ShouldReturn0_WhenNonExistentAccount() public {
    (uint256[] memory pendingWithdrawals, uint256[] memory timestamps) = lockedGold
      .getPendingWithdrawalsInBatch(randomAddress, 0, 1);
    assertEq(pendingWithdrawals.length, 0);
    assertEq(timestamps.length, 0);
  }
}

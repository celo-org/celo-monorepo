pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/ILockedGold.sol";

import "../common/Initializable.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";

contract LockedGold is ILockedGold, ReentrancyGuard, Initializable, UsingRegistry {
  using SafeMath for uint256;

  struct Authorizations {
    // The address that is authorized to vote on behalf of the account.
    // The account can vote as well, whether or not an authorized voter has been specified.
    address voting;
    // The address that is authorized to validate on behalf of the account.
    // The account can manage the validator, whether or not an authorized validator has been
    // specified. However if an authorized validator has been specified, only that key may actually
    // participate in consensus.
    address validating;
  }

  struct PendingWithdrawal {
    // The value of the pending withdrawal.
    uint256 value;
    // The timestamp at which the pending withdrawal becomes available.
    uint256 timestamp;
  }

  // NOTE: This contract does not store an account's locked gold that is being used in electing
  // validators.
  struct Balances {
    // The amount of locked gold that this account has that is not currently participating in
    // validator elections.
    uint256 nonvoting;
    // Gold that has been unlocked and will become available for withdrawal.
    PendingWithdrawal[] pendingWithdrawals;
  }

  struct Account {
    bool exists;
    // Each account may authorize additional keys to use for voting or valdiating.
    // These keys may not be keys of other accounts, and may not be authorized by any other
    // account for any purpose.
    Authorizations authorizations;
    Balances balances;
  }

  mapping(address => Account) private accounts;
  // Maps voting and validating keys to the account that provided the authorization.
  // Authorized addresses may not be reused.
  mapping(address => address) private authorizedBy;
  uint256 public totalNonvoting;
  uint256 public unlockingPeriod;

  event UnlockingPeriodSet(uint256 period);
  event GoldLocked(address indexed account, uint256 value);
  event GoldUnlocked(address indexed account, uint256 value, uint256 available);
  event GoldWithdrawn(address indexed account, uint256 value);

  function initialize(address registryAddress, uint256 _unlockingPeriod) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    unlockingPeriod = _unlockingPeriod;
  }

  /**
   * @notice Sets the duration in seconds users must wait before withdrawing gold after unlocking.
   * @param value The unlocking period in seconds.
   */
  function setUnlockingPeriod(uint256 value) external onlyOwner {
    require(value != unlockingPeriod);
    unlockingPeriod = value;
    emit UnlockingPeriodSet(value);
  }

  /**
   * @notice Locks gold to be used for voting.
   */
  function lock() external payable nonReentrant {
    require(getAccounts().isAccount(msg.sender), "not account");
    require(msg.value > 0, "no value");
    _incrementNonvotingAccountBalance(msg.sender, msg.value);
    emit GoldLocked(msg.sender, msg.value);
  }

  /**
   * @notice Increments the non-voting balance for an account.
   * @param account The account whose non-voting balance should be incremented.
   * @param value The amount by which to increment.
   * @dev Can only be called by the registered Election smart contract.
   */
  function incrementNonvotingAccountBalance(address account, uint256 value)
    external
    onlyRegisteredContract(ELECTION_REGISTRY_ID)
  {
    _incrementNonvotingAccountBalance(account, value);
  }

  /**
   * @notice Decrements the non-voting balance for an account.
   * @param account The account whose non-voting balance should be decremented.
   * @param value The amount by which to decrement.
   * @dev Can only be called by the registered "Election" smart contract.
   */
  function decrementNonvotingAccountBalance(address account, uint256 value)
    external
    onlyRegisteredContract(ELECTION_REGISTRY_ID)
  {
    _decrementNonvotingAccountBalance(account, value);
  }

  /**
   * @notice Increments the non-voting balance for an account.
   * @param account The account whose non-voting balance should be incremented.
   * @param value The amount by which to increment.
   */
  function _incrementNonvotingAccountBalance(address account, uint256 value) private {
    accounts[account].balances.nonvoting = accounts[account].balances.nonvoting.add(value);
    totalNonvoting = totalNonvoting.add(value);
  }

  /**
   * @notice Decrements the non-voting balance for an account.
   * @param account The account whose non-voting balance should be decremented.
   * @param value The amount by which to decrement.
   */
  function _decrementNonvotingAccountBalance(address account, uint256 value) private {
    accounts[account].balances.nonvoting = accounts[account].balances.nonvoting.sub(value);
    totalNonvoting = totalNonvoting.sub(value);
  }

  /**
   * @notice Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  function unlock(uint256 value) external nonReentrant {
    require(getAccounts().isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    // Prevent unlocking gold when voting on governance proposals so that the gold cannot be
    // used to vote more than once.
    require(!getGovernance().isVoting(msg.sender));
    uint256 balanceRequirement = getValidators().getAccountLockedGoldRequirement(msg.sender);
    require(
      balanceRequirement == 0 ||
        balanceRequirement <= getAccountTotalLockedGold(msg.sender).sub(value)
    );
    _decrementNonvotingAccountBalance(msg.sender, value);
    uint256 available = now.add(unlockingPeriod);
    account.balances.pendingWithdrawals.push(PendingWithdrawal(value, available));
    emit GoldUnlocked(msg.sender, value, available);
  }

  /**
   * @notice Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  function relock(uint256 index, uint256 value) external nonReentrant {
    require(getAccounts().isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    require(index < account.balances.pendingWithdrawals.length);
    PendingWithdrawal storage pendingWithdrawal = account.balances.pendingWithdrawals[index];
    require(value <= pendingWithdrawal.value);
    if (value == pendingWithdrawal.value) {
      deletePendingWithdrawal(account.balances.pendingWithdrawals, index);
    } else {
      pendingWithdrawal.value = pendingWithdrawal.value.sub(value);
    }
    _incrementNonvotingAccountBalance(msg.sender, value);
    emit GoldLocked(msg.sender, value);
  }

  /**
   * @notice Withdraws gold that has been unlocked after the unlocking period has passed.
   * @param index The index of the pending withdrawal to withdraw.
   */
  function withdraw(uint256 index) external nonReentrant {
    require(getAccounts().isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    require(index < account.balances.pendingWithdrawals.length);
    PendingWithdrawal storage pendingWithdrawal = account.balances.pendingWithdrawals[index];
    require(now >= pendingWithdrawal.timestamp);
    uint256 value = pendingWithdrawal.value;
    deletePendingWithdrawal(account.balances.pendingWithdrawals, index);
    require(getGoldToken().transfer(msg.sender, value));
    emit GoldWithdrawn(msg.sender, value);
  }

  /**
   * @notice Returns the total amount of locked gold in the system. Note that this does not include
   *   gold that has been unlocked but not yet withdrawn.
   * @return The total amount of locked gold in the system.
   */
  function getTotalLockedGold() external view returns (uint256) {
    return totalNonvoting.add(getElection().getTotalVotes());
  }

  /**
   * @notice Returns the total amount of locked gold not being used to vote in elections.
   * @return The total amount of locked gold not being used to vote in elections.
   */
  function getNonvotingLockedGold() external view returns (uint256) {
    return totalNonvoting;
  }

  /**
   * @notice Returns the total amount of locked gold for an account.
   * @param account The account.
   * @return The total amount of locked gold for an account.
   */
  function getAccountTotalLockedGold(address account) public view returns (uint256) {
    uint256 total = accounts[account].balances.nonvoting;
    return total.add(getElection().getTotalVotesByAccount(account));
  }

  /**
   * @notice Returns the total amount of non-voting locked gold for an account.
   * @param account The account.
   * @return The total amount of non-voting locked gold for an account.
   */
  function getAccountNonvotingLockedGold(address account) external view returns (uint256) {
    return accounts[account].balances.nonvoting;
  }

  /**
   * @notice Returns the pending withdrawals from unlocked gold for an account.
   * @param account The address of the account.
   * @return The value and timestamp for each pending withdrawal.
   */
  function getPendingWithdrawals(address account)
    external
    view
    returns (uint256[] memory, uint256[] memory)
  {
    require(getAccounts().isAccount(account));
    uint256 length = accounts[account].balances.pendingWithdrawals.length;
    uint256[] memory values = new uint256[](length);
    uint256[] memory timestamps = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      PendingWithdrawal memory pendingWithdrawal = (
        accounts[account].balances.pendingWithdrawals[i]
      );
      values[i] = pendingWithdrawal.value;
      timestamps[i] = pendingWithdrawal.timestamp;
    }
    return (values, timestamps);
  }

  /**
   * @notice Deletes a pending withdrawal.
   * @param list The list of pending withdrawals from which to delete.
   * @param index The index of the pending withdrawal to delete.
   */
  function deletePendingWithdrawal(PendingWithdrawal[] storage list, uint256 index) private {
    uint256 lastIndex = list.length.sub(1);
    list[index] = list[lastIndex];
    list.length = lastIndex;
  }
}

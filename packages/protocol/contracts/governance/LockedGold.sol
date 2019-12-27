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

  mapping(address => Balances) private balances;
  mapping(address => bool) public isSlasher;

  modifier onlySlasher() {
    require(isSlasher[msg.sender], "Caller must be registered slasher");
    _;
  }

  uint256 public totalNonvoting;
  uint256 public unlockingPeriod;

  event UnlockingPeriodSet(uint256 period);
  event GoldLocked(address indexed account, uint256 value);
  event GoldUnlocked(address indexed account, uint256 value, uint256 available);
  event GoldWithdrawn(address indexed account, uint256 value);
  event SlasherWhitelistAdded(address slasher);
  event SlasherWhitelistRemoved(address slasher);
  event AccountSlashed(address slashed, uint256 penalty, address reporter, uint256 reward);

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
    require(value != unlockingPeriod, "Unlocking period not changed");
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
    //    emit GoldLocked(msg.sender, totalNonvoting);
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
    balances[account].nonvoting = balances[account].nonvoting.add(value);
    totalNonvoting = totalNonvoting.add(value);
  }

  /**
   * @notice Decrements the non-voting balance for an account.
   * @param account The account whose non-voting balance should be decremented.
   * @param value The amount by which to decrement.
   */
  function _decrementNonvotingAccountBalance(address account, uint256 value) private {
    balances[account].nonvoting = balances[account].nonvoting.sub(value);
    totalNonvoting = totalNonvoting.sub(value);
  }

  /**
   * @notice Unlocks gold that becomes withdrawable after the unlocking period.
   * @param value The amount of gold to unlock.
   */
  function unlock(uint256 value) external nonReentrant {
    require(getAccounts().isAccount(msg.sender), "Unknown account");
    Balances storage account = balances[msg.sender];
    // Prevent unlocking gold when voting on governance proposals so that the gold cannot be
    // used to vote more than once.
    require(!getGovernance().isVoting(msg.sender), "Account locked");
    uint256 balanceRequirement = getValidators().getAccountLockedGoldRequirement(msg.sender);
    require(
      balanceRequirement == 0 ||
        balanceRequirement <= getAccountTotalLockedGold(msg.sender).sub(value),
      "Trying to unlock too much gold"
    );
    _decrementNonvotingAccountBalance(msg.sender, value);
    uint256 available = now.add(unlockingPeriod);
    account.pendingWithdrawals.push(PendingWithdrawal(value, available));
    emit GoldUnlocked(msg.sender, value, available);
  }

  /**
   * @notice Relocks gold that has been unlocked but not withdrawn.
   * @param index The index of the pending withdrawal to relock from.
   * @param value The value to relock from the specified pending withdrawal.
   */
  function relock(uint256 index, uint256 value) external nonReentrant {
    require(getAccounts().isAccount(msg.sender), "Unknown account");
    Balances storage account = balances[msg.sender];
    require(index < account.pendingWithdrawals.length, "Bad pending withdrawal index");
    PendingWithdrawal storage pendingWithdrawal = account.pendingWithdrawals[index];
    require(value <= pendingWithdrawal.value, "Requested value larger than pending value");
    if (value == pendingWithdrawal.value) {
      deletePendingWithdrawal(account.pendingWithdrawals, index);
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
    require(getAccounts().isAccount(msg.sender), "Unknown account");
    Balances storage account = balances[msg.sender];
    require(index < account.pendingWithdrawals.length, "Bad pending withdrawal index");
    PendingWithdrawal storage pendingWithdrawal = account.pendingWithdrawals[index];
    require(now >= pendingWithdrawal.timestamp, "Pending withdrawal not available");
    uint256 value = pendingWithdrawal.value;
    deletePendingWithdrawal(account.pendingWithdrawals, index);
    require(getGoldToken().transfer(msg.sender, value), "Transfer failed");
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
    uint256 total = balances[account].nonvoting;
    return total.add(getElection().getTotalVotesByAccount(account));
  }

  /**
   * @notice Returns the total amount of non-voting locked gold for an account.
   * @param account The account.
   * @return The total amount of non-voting locked gold for an account.
   */
  function getAccountNonvotingLockedGold(address account) external view returns (uint256) {
    return balances[account].nonvoting;
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
    require(getAccounts().isAccount(account), "Unknown account");
    uint256 length = balances[account].pendingWithdrawals.length;
    uint256[] memory values = new uint256[](length);
    uint256[] memory timestamps = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      PendingWithdrawal memory pendingWithdrawal = (balances[account].pendingWithdrawals[i]);
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

  /**
   * @notice Adds `slasher` to whitelist of approved slashing addresses.
   * @param slasher Address to whitelist.
   */
  function addSlasher(address slasher) external onlyOwner {
    require(slasher != address(0));
    isSlasher[slasher] = true;
    emit SlasherWhitelistAdded(slasher);
  }

  /**
   * @notice Removes `slasher` from whitelist of approved slashing addresses.
   * @param slasher Address to remove from whitelist.
   */
  function removeSlasher(address slasher) external onlyOwner {
    require(isSlasher[slasher]);
    isSlasher[slasher] = false;
    emit SlasherWhitelistRemoved(slasher);
  }

  /**
   * @notice Slashes `account` by reducing its nonvoting locked gold by `penalty`.
   *         If there is not enough nonvoting locked gold to slash, calls into
   *         `Election.slashVotes` to slash the remaining gold. Also sends `reward`
   *         gold to the reporter, and penalty-reward to the Community Fund.
   * @param account Address of account being slashed.
   * @param penalty Amount to slash account.
   * @param reporter Address of account reporting the slasher.
   * @param reward Reward to give reporter.
   * @param lessers The groups receiving fewer votes than i'th group, or 0 if the i'th group has
   *                the fewest votes of any validator group.
   * @param greaters The groups receiving more votes than the i'th group, or 0 if the i'th group
   *                 has the most votes of any validator group.
   * @param indices The indices of the i'th group in `account`'s voting list.
   */
  function slash(
    address account,
    uint256 penalty,
    address reporter,
    uint256 reward,
    address[] calldata lessers,
    address[] calldata greaters,
    uint256[] calldata indices
  ) external onlySlasher {
    require(
      getAccountTotalLockedGold(account) >= penalty,
      "trying to slash more gold than is locked"
    );
    require(penalty >= reward, "reward cannot exceed penalty.");
    {
      uint256 nonvotingBalance = balances[account].nonvoting;
      uint256 difference = 0;
      // If not enough nonvoting, revoke the difference
      if (nonvotingBalance < penalty) {
        difference = penalty.sub(nonvotingBalance);
        require(
          getElection().forceRevokeVotes(account, difference, lessers, greaters, indices) ==
            difference
        );
      }
      // forceRevokeVotes does not increment nonvoting account balance, so we can't double count
      _decrementNonvotingAccountBalance(account, penalty - difference);
      _incrementNonvotingAccountBalance(reporter, reward);
    }
    address communityFund = registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID);
    getGoldToken().transfer(communityFund, penalty.sub(reward));
    emit AccountSlashed(account, penalty, reporter, reward);
  }
}

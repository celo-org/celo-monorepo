pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/ILockedGold.sol";

import "../common/Initializable.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";
import "../common/libraries/ReentrancyGuard.sol";

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

  // Iterable map to store whitelisted identifiers.
  // Necessary to allow iterating over whitelisted IDs to check ID's address at runtime.
  mapping(bytes32 => bool) internal slashingMap;
  bytes32[] public slashingWhitelist;

  modifier onlySlasher {
    require(
      registry.isOneOf(slashingWhitelist, msg.sender),
      "Caller is not a whitelisted slasher."
    );
    _;
  }

  function isSlasher(address slasher) external view returns (bool) {
    return (registry.isOneOf(slashingWhitelist, slasher));
  }

  uint256 public totalNonvoting;
  uint256 public unlockingPeriod;

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

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _unlockingPeriod The unlocking period in seconds.
   */
  function initialize(address registryAddress, uint256 _unlockingPeriod) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setUnlockingPeriod(_unlockingPeriod);
  }

  /**
   * @notice Sets the duration in seconds users must wait before withdrawing gold after unlocking.
   * @param value The unlocking period in seconds.
   */
  function setUnlockingPeriod(uint256 value) public onlyOwner {
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
    emit GoldRelocked(msg.sender, value);
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
    require(value <= address(this).balance, "Inconsistent balance");
    msg.sender.transfer(value);
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
    for (uint256 i = 0; i < length; i = i.add(1)) {
      PendingWithdrawal memory pendingWithdrawal = (balances[account].pendingWithdrawals[i]);
      values[i] = pendingWithdrawal.value;
      timestamps[i] = pendingWithdrawal.timestamp;
    }
    return (values, timestamps);
  }

  function getTotalPendingWithdrawals(address account) external view returns (uint256) {
    uint256 pendingWithdrawalSum = 0;
    PendingWithdrawal[] memory withdrawals = balances[account].pendingWithdrawals;
    for (uint256 i = 0; i < withdrawals.length; i = i.add(1)) {
      pendingWithdrawalSum = pendingWithdrawalSum.add(withdrawals[i].value);
    }
    return pendingWithdrawalSum;
  }

  function getSlashingWhitelist() external view returns (bytes32[] memory) {
    return slashingWhitelist;
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
   * @param slasherIdentifier Identifier to whitelist.
   */
  function addSlasher(string calldata slasherIdentifier) external onlyOwner {
    bytes32 keyBytes = keccak256(abi.encodePacked(slasherIdentifier));
    require(registry.getAddressFor(keyBytes) != address(0), "Identifier is not registered");
    require(!slashingMap[keyBytes], "Cannot add slasher ID twice.");
    slashingWhitelist.push(keyBytes);
    slashingMap[keyBytes] = true;
    emit SlasherWhitelistAdded(slasherIdentifier);
  }

  /**
   * @notice Removes `slasher` from whitelist of approved slashing addresses.
   * @param slasherIdentifier Identifier to remove from whitelist.
   * @param index Index of the provided identifier in slashingWhiteList array.
   */
  function removeSlasher(string calldata slasherIdentifier, uint256 index) external onlyOwner {
    bytes32 keyBytes = keccak256(abi.encodePacked(slasherIdentifier));
    require(slashingMap[keyBytes], "Cannot remove slasher ID not yet added.");
    require(index < slashingWhitelist.length, "Provided index exceeds whitelist bounds.");
    require(slashingWhitelist[index] == keyBytes, "Index doesn't match identifier");
    slashingWhitelist[index] = slashingWhitelist[slashingWhitelist.length - 1];
    slashingWhitelist.pop();
    slashingMap[keyBytes] = false;
    emit SlasherWhitelistRemoved(slasherIdentifier);
  }

  /**
   * @notice Slashes `account` by reducing its nonvoting locked gold by `penalty`.
   *         If there is not enough nonvoting locked gold to slash, calls into
   *         `Election.slashVotes` to slash the remaining gold. If `account` does not have
   *         `penalty` worth of locked gold, slashes `account`'s total locked gold.
   *         Also sends `reward` gold to the reporter, and penalty-reward to the Community Fund.
   * @param account Address of account being slashed.
   * @param penalty Amount to slash account.
   * @param reporter Address of account reporting the slasher.
   * @param reward Reward to give reporter.
   * @param lessers The groups receiving fewer votes than i'th group, or 0 if the i'th group has
   *                the fewest votes of any validator group.
   * @param greaters The groups receiving more votes than the i'th group, or 0 if the i'th group
   *                 has the most votes of any validator group.
   * @param indices The indices of the i'th group in `account`'s voting list.
   * @dev Fails if `reward` is greater than `account`'s total locked gold.
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
    uint256 maxSlash = Math.min(penalty, getAccountTotalLockedGold(account));
    require(maxSlash >= reward, "reward cannot exceed penalty.");
    // Local scoping is required to avoid Solc "stack too deep" error from too many locals.
    {
      uint256 nonvotingBalance = balances[account].nonvoting;
      uint256 difference = 0;
      // If not enough nonvoting, revoke the difference
      if (nonvotingBalance < maxSlash) {
        difference = maxSlash.sub(nonvotingBalance);
        require(
          getElection().forceDecrementVotes(account, difference, lessers, greaters, indices) ==
            difference,
          "Cannot revoke enough voting gold."
        );
      }
      // forceDecrementVotes does not increment nonvoting account balance, so we can't double count
      _decrementNonvotingAccountBalance(account, maxSlash.sub(difference));
      _incrementNonvotingAccountBalance(reporter, reward);
    }
    address communityFund = registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID);
    address payable communityFundPayable = address(uint160(communityFund));
    require(maxSlash.sub(reward) <= address(this).balance, "Inconsistent balance");
    communityFundPayable.transfer(maxSlash.sub(reward));
    emit AccountSlashed(account, maxSlash, reporter, reward);
  }
}

pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/ILockedGold.sol";

import "../common/Initializable.sol";
import "../common/interfaces/IERC20Token.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";

contract LockedGold is ILockedGold, ReentrancyGuard, Initializable, UsingRegistry {

  // TODO(asa): How do adjust for updated requirements?
  // Have a refreshRequirements function validators and groups can call
  struct MustMaintain {
    uint256 value;
    uint256 timestamp;
  }

  struct Authorizations {
    address voting;
    address validating;
  }

  struct PendingWithdrawal {
    uint256 value;
    uint256 timestamp;
  }

  struct Balances {
    // This contract does not store an account's locked gold that is being used in electing
    // validators.
    uint256 nonvoting;
    PendingWithdrawal[] pendingWithdrawals;
    MustMaintain requirements;
  }

  struct Account {
    bool exists;
    // Each account may authorize additional keys to use for voting or valdiating.
    // These keys may not be keys of other accounts, and may not be authorized by any other
    // account for any purpose.
    Authorizations authorizations;
    Balances balances;
  }

  mapping(address => Account) public accounts;
  // Maps voting and validating keys to the account that provided the authorization.
  mapping(address => address) public authorizations;
  uint256 public totalNonvoting;
  uint256 public unlockingPeriod;

  event VoterAuthorized(address indexed account, address voter);
  event ValidatorAuthorized(address indexed account, address validator);
  event GoldLocked(address indexed account, uint256 value);
  event GoldUnlocked(address indexed account, uint256 value, uint256 available);
  event GoldWithdrawn(address indexed account, uint256 value);
  event AccountMustMaintainSet(address indexed account, uint256 value, uint256 timestamp);

  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Creates an account.
   * @return True if account creation succeeded.
   */
  function createAccount() external returns (bool) {
    require(isNotAccount(msg.sender) && isNotAuthorized(msg.sender));
    Account storage account = accounts[msg.sender];
    account.exists = true;
    return true;
  }

  function authorizeVoter(
    address voter,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    nonReentrant
  {
    Account storage account = accounts[msg.sender];
    authorize(voter, account.authorizations.voting, v, r, s);
    account.authorizations.voting = voter;
    emit VoterAuthorized(msg.sender, voter);
  }

  function authorizeValidator(
    address validator,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    nonReentrant
  {
    Account storage account = accounts[msg.sender];
    authorize(validator, account.authorizations.validating, v, r, s);
    account.authorizations.validating = validator;
    emit ValidatorAuthorized(msg.sender, validator);
  }

  /**
   * @notice Locks gold to be used for voting.
   * @param value The amount of gold to be locked.
   */
  function lock(uint256 value) external nonReentrant {
    require(isAccount(msg.sender));
    require(msg.value == value && value > 0);
    _incrementNonvotingAccountBalance(msg.sender, value);
    emit GoldLocked(msg.sender, value);
  }

  function incrementNonvotingAccountBalance(address account, uint256 value) external onlyRegisteredContract('Election', msg.sender) {
    _incrementNonvotingAccountBalance(account, value);
  }

  function decrementNonvotingAccountBalance(address account, uint256 value) external onlyRegisteredContract('Election', msg.sender) {
    _decrementNonvotingAccountBalance(account, value);
  }

  function _incrementNonvotingAccountBalance(address account, uint256 value) private {
    accounts[account].gold.nonvoting = accounts[account].gold.nonvoting.add(value);
    totalNonvoting = totalNonvoting.add(value);
  }

  function _decrementNonvotingAccountBalance(address account, uint256 value) private {
    accounts[account].gold.nonvoting = accounts[account].gold.nonvoting.sub(value);
    totalNonvoting = totalNonvoting.sub(value);
  }

  // TODO: Can't unlock if voting in governance.
  function unlock(uint256 value) external nonReentrant {
    require(isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    MustMaintain memory requirement = account.requirement;
    require(
      now >= requirement.timestamp ||
      getAccountTotalLockedGold(msg.sender).sub(value) >= requirement.value
    );
    _decrementNonvotingAccountBalance(msg.sender, value);
    uint256 available = now.add(unlockingPeriod);
    account.balances.pendingWithdrawals.push(PendingWithdrawal(value, available));
    emit GoldUnlocked(msg.sender, value, available);
  }

  // TODO(asa): Allow partial relock
  function relock(uint256 index) external nonReentrant {
    require(isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    require(index < account.balances.pendingWithdrawals.length);
    uint256 value = account.balances.pendingWithdrawals[index].value;
    _incrementNonvotingAccountBalance(msg.sender, value);
    deletePendingWithdrawal(account.balances.pendingWithdrawals, index);
    emit GoldLocked(msg.sender, value);
  }

  function withdraw(uint256 index) external nonReentrant {
    require(isAccount(msg.sender));
    Account storage account = accounts[msg.sender];
    require(index < account.balances.pendingWithdrawals.length);
    PendingWithdrawal memory pendingWithdrawal = account.balances.pendingWithdrawals[index];
    require(now >= pendingWithdrawal.available);
    uint256 value = pendingWithdrawal.value;
    deletePendingWithdrawal(account.balances.pendingWithdrawals, index);
    IERC20Token goldToken = IERC20Token(registry.getAddressFor(GOLD_TOKEN_REGISTRY_ID));
    require(goldToken.transfer(msg.sender, value));
    emit GoldWithdrawn(msg.sender, value);
  }

  function setAccountMustMaintain(
    address account,
    uint256 value,
    uint256 timestamp
  )
    public
    onlyRegisteredContract('Election', msg.sender)
    nonReentrant
    returns (bool)
  {
    accounts[account].requirement = MustMaintain(value, timestamp);
    emit AccountMustMaintainSet(account, value, timestamp);
  }

  // TODO(asa): Dedup
  /**
   * @notice Returns the account associated with `accountOrVoter`.
   * @param accountOrVoter The address of the account or authorized voter.
   * @dev Fails if the `accountOrVoter` is not an account or authorized voter.
   * @return The associated account.
   */
  function getAccountFromVoter(address accountOrVoter) external view returns (address) {
    address authorizingAccount = authorizations[accountOrVoter];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].authorizations.voter == accountOrVoter);
      return authorizingAccount;
    } else {
      require(isAccount(accountOrVoter));
      return accountOrVoter;
    }
  }

  function getTotalLockedGold() external view returns (uint256) {
    return totalNonvoting.add(getElection().totalVotes());
  }

  function getAccountTotalLockedGold(address account) public view returns (uint256) {
    uint256 total = accounts[account].balances.nonvoting;
    return total.add(getElection().getAccountTotalVotes(account));
  }

  /**
   * @notice Returns the account associated with `accountOrValidator`.
   * @param accountOrValidator The address of the account or authorized validator.
   * @dev Fails if the `accountOrValidator` is not an account or authorized validator.
   * @return The associated account.
   */
  function getAccountFromValidator(address accountOrValidator) public view returns (address) {
    address authorizingAccount = authorizations[accountOrValidator];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].authorizations.validator == accountOrValidator);
      return authorizingAccount;
    } else {
      require(isAccount(accountOrValidator));
      return accountOrValidator;
    }
  }

  /**
   * @notice Returns the voter for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can vote.
   */
  function getVoterFromAccount(address account) public view returns (address) {
    require(isAccount(account));
    address voter = accounts[account].authorizations.voter;
    return voter == address(0) ? account : voter;
  }

  /**
   * @notice Returns the validator for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  function getValidatorFromAccount(address account) public view returns (address) {
    require(isAccount(account));
    address validator = accounts[account].authorizations.validator;
    return validator == address(0) ? account : validator;
  }

  /**
   * @notice Authorizes voting or validating power of `msg.sender`'s account to another address.
   * @param current The address to authorize.
   * @param previous The previous authorized address.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Fails if the address is already authorized or is an account.
   * @dev v, r, s constitute `authorize`'s signature on `msg.sender`.
   */
  function authorize(
    address current,
    address previous,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    private
    nonReentrant
  {
    require(isAccount(msg.sender) && isNotAccount(current) && isNotAuthorized(current));

    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == current);

    authorizations[previous] = address(0);
    authorizations[current] = msg.sender;
  }

  function isAccount(address account) internal view returns (bool) {
    return (accounts[account].exists);
  }

  function isNotAccount(address account) internal view returns (bool) {
    return (!accounts[account].exists);
  }

  function isNotAuthorized(address account) internal view returns (bool) {
    return (authorizations[account] == address(0));
  }

  function deletePendingWithdrawal(PendingWithdrawal[] storage list, uint256 index) private {
    uint256 lastIndex = list.length.sub(1);
    list[index] = list[lastIndex];
    list.length = lastIndex;
  }
}

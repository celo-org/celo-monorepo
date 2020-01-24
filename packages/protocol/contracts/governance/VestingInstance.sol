pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IVestingInstance.sol";

import "../common/UsingRegistry.sol";

contract VestingInstance is UsingRegistry, ReentrancyGuard, IVestingInstance {
  using SafeMath for uint256;

  struct VestingSchedule {
    // number of vesting periods
    uint256 vestingNumPeriods;
    // amount that is to be vested per period
    uint256 vestAmountPerPeriod;
    // durations in secs. of one period
    uint256 vestingPeriodSec;
    // timestamp for the starting point of the vesting. Timestamp is expressed in UNIX time, the same units as block.timestamp.
    uint256 vestingStartTime;
    // timestamp for the cliff starting point. Timestamp is expressed in UNIX time, the same units as block.timestamp.
    uint256 vestingCliffStartTime;
  }

  // beneficiary of the Celo Gold to be vested in this contract
  address payable public beneficiary;

  // indicates how much of the vested amount has been accummulatively withdrawn
  uint256 public totalWithdrawn;

  // the time at which the revocation has taken place
  uint256 public revokeTime;

  // the time at which the pausing shall end
  uint256 public pauseEndTime;

  // indicates if the contract is revocable
  bool public revocable;

  // revoking address
  address payable public revoker;

  // vested instance balance at revoke time
  uint256 public vestedBalanceAtRevoke;

  // maximum pause period in seconds
  uint256 public maxPausePeriod;

  // a public struct hosting the vesting scheme params
  VestingSchedule public vestingSchedule;

  event WithdrawalPaused(uint256 pauseStart, uint256 pauseEnd);
  event VestingRevoked(uint256 revokeTimestamp, uint256 vestedBalanceAtRevoke);

  modifier onlyRevoker() {
    require(msg.sender == revoker, "sender must be the vesting revoker");
    _;
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "sender must be the vesting beneficiary");
    _;
  }

  modifier onlyRevoked() {
    require(isRevoked(), "vesting instance must have already been revoked");
    _;
  }

  modifier onlyRevocable() {
    require(revocable, "vesting instance must be revocable");
    _;
  }

  modifier onlyRevokerAndRevoked() {
    require(
      msg.sender == revoker && isRevoked(),
      "sender must be the revoker and state must be revoked"
    );
    _;
  }

  modifier onlyWhenInProperState() {
    bool isRevoked = isRevoked();
    require(
      (msg.sender == revoker && isRevoked) || (msg.sender == beneficiary && !isRevoked),
      "either revoker in revoked state or beneficiary in unrevoked"
    );
    _;
  }

  function() external payable {} // solhint-disable no-empty-blocks

  /**
   * @notice A constructor for initialising a new instance of a Vesting Schedule contract
   * @param vestingBeneficiary address of the beneficiary to whom vested tokens are transferred
   * @param vestingNumPeriods number of vesting periods
   * @param vestingCliff duration in seconds of the cliff in which tokens will begin to vest
   * @param vestingStartTime the time (as Unix time) at which point vesting starts
   * @param vestingPeriodSec duration in seconds of the period in which the tokens will vest
   * @param vestAmountPerPeriod the vesting amount per period - vestingPeriodSec
   * @param vestingRevocable whether the vesting is revocable or not
   * @param vestingRevoker address of the person revoking the vesting
   * @param vestingMaxPausePeriod maximum pause period in seconds
   * @param registryAddress address of the deployed contracts registry
   */
  constructor(
    address payable vestingBeneficiary,
    uint256 vestingNumPeriods,
    uint256 vestingCliff,
    uint256 vestingStartTime,
    uint256 vestingPeriodSec,
    uint256 vestAmountPerPeriod,
    bool vestingRevocable,
    address payable vestingRevoker,
    uint256 vestingMaxPausePeriod,
    address registryAddress
  ) public {
    require(vestingNumPeriods >= 1, "There must be at least one vesting period");
    require(vestAmountPerPeriod > 0, "Vesting amount per period must be positive");
    require(vestingMaxPausePeriod > 0, "maximum pause period must be greater than zero");
    require(vestingBeneficiary != address(0), "Beneficiary is the zero address");
    require(vestingRevoker != address(0), "Revoker is the zero address");
    require(registryAddress != address(0), "Registry address cannot be the zero address");
    require(vestingNumPeriods.mul(vestAmountPerPeriod) > 0);
    require(
      vestingStartTime.add(vestingNumPeriods.mul(vestingPeriodSec)) > block.timestamp,
      "Vesting end time must be in the future"
    );

    setRegistry(registryAddress);

    vestingSchedule.vestingNumPeriods = vestingNumPeriods;
    vestingSchedule.vestAmountPerPeriod = vestAmountPerPeriod;
    vestingSchedule.vestingPeriodSec = vestingPeriodSec;
    vestingSchedule.vestingCliffStartTime = vestingStartTime.add(vestingCliff);
    vestingSchedule.vestingStartTime = vestingStartTime;

    beneficiary = vestingBeneficiary;
    revocable = vestingRevocable;
    revoker = vestingRevoker;
    maxPausePeriod = vestingMaxPausePeriod;
  }

  /**
   * @notice Returns if the vesting has been revoked or not.
   */
  function isRevoked() public view returns (bool) {
    return revokeTime > 0;
  }

  /**
   * @notice Returns if the vesting has been paused or not.
   */
  function isPaused() public view returns (bool) {
    return pauseEndTime > block.timestamp;
  }

  /**
   * @notice Transfers gold from the vesting back to beneficiary.
   * @param amount the requested gold amount
   */
  function withdraw(uint256 amount) external nonReentrant onlyBeneficiary {
    require(!isPaused(), "Withdrawals only allowed in the unpaused state");
    require(amount > 0, "withdrawable amount must be greater than zero");

    uint256 vestedAmount;
    if (isRevoked()) {
      vestedAmount = vestedBalanceAtRevoke;
    } else {
      vestedAmount = getCurrentVestedTotalAmount();
    }

    require(
      vestedAmount.sub(totalWithdrawn) >= amount,
      "Required amount is above withdrawable vested amount"
    );
    require(
      getRemainingUnlockedBalance() >= amount,
      "Insufficient unlocked balance to withdraw the amount from"
    );
    totalWithdrawn = totalWithdrawn.add(amount);
    require(getGoldToken().transfer(beneficiary, amount), "Withdrawal of gold failed");
    if (getRemainingTotalBalance() == 0) {
      selfdestruct(revoker);
    }
  }

  /**
   * @notice Refund revoker and beneficiary after the vesting has been revoked.
   */
  function refundAndFinalize() external nonReentrant onlyRevokerAndRevoked {
    require(getRemainingLockedBalance() == 0, "Some of the vested gold is still locked");
    uint256 beneficiaryAmount = vestedBalanceAtRevoke.sub(totalWithdrawn);
    require(
      getGoldToken().transfer(beneficiary, beneficiaryAmount),
      "Transfer of gold to beneficiary failed"
    );
    uint256 revokerAmount = getRemainingUnlockedBalance();
    require(getGoldToken().transfer(revoker, revokerAmount), "Transfer of gold to revoker failed");
    selfdestruct(revoker);
  }

  /**
   * @notice Revoke the vesting schedule
   */
  function revoke() external nonReentrant onlyRevoker onlyRevocable {
    require(!isRevoked(), "Vesting already revoked");
    revokeTime = block.timestamp;
    vestedBalanceAtRevoke = getCurrentVestedTotalAmount();
    emit VestingRevoked(revokeTime, vestedBalanceAtRevoke);
  }

  /**
   * @notice Allows only the revoker to pause the gold withdrawal
   * @param pausePeriod the period for which the withdrawal shall be paused
   */
  function pause(uint256 pausePeriod) external onlyRevoker onlyRevocable {
    require(!isPaused(), "Vesting withdrawals already paused");
    require(!isRevoked(), "Vesting already revoked");
    require(pausePeriod <= maxPausePeriod, "Pause period is limited by maximum pause period");
    pauseEndTime = block.timestamp.add(pausePeriod);
    emit WithdrawalPaused(block.timestamp, pauseEndTime);
  }

  /**
   * @notice Calculates the total balance of the vesting instance
   * @return The total vesting instance balance
   * @dev The returned amount may vary over time due to locked gold rewards
   */
  function getTotalBalance() public view returns (uint256) {
    return getRemainingUnlockedBalance().add(getRemainingLockedBalance()).add(totalWithdrawn);
  }

  /**
   * @notice Calculates the sum of locked and unlocked gold in the vesting instance
   * @return The remaining total vesting instance balance
   * @dev The returned amount may vary over time due to locked gold rewards
   */
  function getRemainingTotalBalance() public view returns (uint256) {
    return getRemainingUnlockedBalance().add(getRemainingLockedBalance());
  }

  /**
   * @notice Calculates remaining unlocked gold balance in the vesting instance
   * @return The available unlocked vesting instance gold balance
   */
  function getRemainingUnlockedBalance() public view returns (uint256) {
    return address(this).balance;
  }

  /**
   * @notice Calculates remaining locked gold balance in the vesting instance
   * @return The remaining locked vesting instance gold balance
   * @dev The returned amount may vary over time due to locked gold rewards
   */
  function getRemainingLockedBalance() public view returns (uint256) {
    return getLockedGold().getAccountTotalLockedGold(address(this));
  }

  /**
   * @notice Calculates initial vesting amount in the vesting instance
   * @return The initial vesting amount
   */
  function getInitialVestingAmount() public view returns (uint256) {
    return vestingSchedule.vestingNumPeriods.mul(vestingSchedule.vestAmountPerPeriod);
  }

  /**
   * @dev Calculates the total amount that has already vested up to now.
   * @return The already vested amount up to the point of call
   * @dev The returned amount may vary over time due to locked gold rewards
   */
  function getCurrentVestedTotalAmount() public view returns (uint256) {
    if (block.timestamp < vestingSchedule.vestingCliffStartTime) {
      return 0;
    }
    uint256 totalBalance = getTotalBalance();

    if (
      block.timestamp >=
      vestingSchedule.vestingStartTime.add(
        vestingSchedule.vestingNumPeriods.mul(vestingSchedule.vestingPeriodSec)
      )
    ) {
      return totalBalance;
    }

    uint256 timeSinceStart = block.timestamp.sub(vestingSchedule.vestingStartTime);
    uint256 periodsSinceStart = timeSinceStart.div(vestingSchedule.vestingPeriodSec);
    return totalBalance.mul(periodsSinceStart).div(vestingSchedule.vestingNumPeriods);
  }

  /**
   * @notice A wrapper function for the lock gold method
   * @param value the value of gold to be locked
   */
  function lockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    require(
      value <= address(this).balance,
      "Gold amount to lock is greater than the currently available gold"
    );
    getLockedGold().lock.gas(gasleft()).value(value)();
  }

  /**
   * @notice A wrapper function for the unlock gold method function
   * @param value the value of gold to be unlocked for the vesting instance
   */
  function unlockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().unlock(value);
  }

  /**
   * @notice A wrapper function for the relock locked gold method function
   * @param index the index of the pending locked gold withdrawal
   * @param value the value of gold to be relocked for the vesting instance
   */
  function relockGold(uint256 index, uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().relock(index, value);
  }

  /**
   * @notice A wrapper function for the withdraw locked gold method function
   * @param index the index of the pending locked gold withdrawal
   * @dev The amount shall be withdrawn back to the vesting instance
   */
  function withdrawLockedGold(uint256 index) external nonReentrant onlyWhenInProperState {
    getLockedGold().withdraw(index);
  }

  /**
   * @notice A wrapper function for the authorize vote signer account method
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev The v,r and s signature should be a signed message by the beneficiary being the authorized address
   */
  function authorizeVoteSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyWhenInProperState
  {
    getAccounts().authorizeVoteSigner(signer, v, r, s);
  }

  /**
   * @notice A wrapper setter function for a convenience Setter for the dataEncryptionKey and wallet address for an account
   * @param name A string to set as the name of the account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account
   */
  function setAccount(string calldata name, bytes calldata dataEncryptionKey, address walletAddress)
    external
    onlyWhenInProperState
  {
    getAccounts().setAccount(name, dataEncryptionKey, walletAddress);
  }

  /**
   * @notice A wrapper setter function for creating an account
   */
  function createAccount() external onlyWhenInProperState {
    require(getAccounts().createAccount(), "Account creation failed");
  }

  /**
   * @notice A wrapper setter function for the name of an account
   * @param name A string to set as the name of the account
   */
  function setAccountName(string calldata name) external onlyWhenInProperState {
    getAccounts().setName(name);
  }

  /**
   * @notice A wrapper setter function for the wallet address of an account
   * @param walletAddress The wallet address to set for the account
   */
  function setAccountWalletAddress(address walletAddress) external onlyWhenInProperState {
    getAccounts().setWalletAddress(walletAddress);
  }

  /**
   * @notice A wrapper setter function for the for the data encryption key and version of an account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   */
  function setAccountDataEncryptionKey(bytes calldata dataEncryptionKey)
    external
    onlyWhenInProperState
  {
    getAccounts().setAccountDataEncryptionKey(dataEncryptionKey);
  }

  /**
   * @notice A wrapper setter function for the metadata of an account
   * @param metadataURL The URL to access the metadata.
   */
  function setAccountMetadataURL(string calldata metadataURL) external onlyWhenInProperState {
    getAccounts().setMetadataURL(metadataURL);
  }

  /**
   * @notice Increments the number of total and pending votes for `group`.
   * @param group The validator group to vote for.
   * @param value The amount of gold to use to vote.
   * @param lesser The group receiving fewer votes than `group`, or 0 if `group` has the
   *   fewest votes of any validator group.
   * @param greater The group receiving more votes than `group`, or 0 if `group` has the
   *   most votes of any validator group.
   * @dev Fails if `group` is empty or not a validator group.
   */
  function vote(address group, uint256 value, address lesser, address greater)
    external
    nonReentrant
    onlyWhenInProperState
  {
    require(getElection().vote(group, value, lesser, greater), "voting for a group failed");
  }

  /**
   * @notice Converts `account`'s pending votes for `group` to active votes.
   * @param group The validator group to vote for.
   * @dev Pending votes cannot be activated until an election has been held.
   */
  function activate(address group) external nonReentrant onlyWhenInProperState {
    require(getElection().activate(group), "activating votes for a group failed");
  }

  /**
   * @notice Revokes `value` active votes for `group`
   * @param group The validator group to revoke votes from.
   * @param value The number of votes to revoke.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *   or 0 if that group has the most votes of any validator group.
   * @param index The index of the group in the account's voting list.
   * @dev Fails if the account has not voted on a validator group.
   */
  function revokeActive(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) external nonReentrant onlyWhenInProperState {
    require(
      getElection().revokeActive(group, value, lesser, greater, index),
      "revoking active votes for a group failed"
    );
  }

  /**
   * @notice Revokes `value` pending votes for `group`
   * @param group The validator group to revoke votes from.
   * @param value The number of votes to revoke.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *   or 0 if that group has the most votes of any validator group.
   * @param index The index of the group in the account's voting list.
   * @dev Fails if the account has not voted on a validator group.
   */
  function revokePending(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) external nonReentrant onlyWhenInProperState {
    require(
      getElection().revokePending(group, value, lesser, greater, index),
      "revoking pending votes for a group failed"
    );
  }
}

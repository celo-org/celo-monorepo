pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IVestingInstance.sol";

import "../common/UsingRegistry.sol";

contract VestingInstance is UsingRegistry, ReentrancyGuard, IVestingInstance {
  using SafeMath for uint256;

  struct VestingSchedule {
    // Number of vesting periods.
    uint256 vestingNumPeriods;
    // Amount that is to be vested per period.
    uint256 vestAmountPerPeriod;
    // Duration (in seconds) of one period.
    uint256 vestingPeriodSec;
    // Timestamp (in UNIX time) that vesting begins.
    uint256 vestingStartTime;
    // Timestamp (in UNIX time) of the vesting cliff.
    uint256 vestingCliffTime;
  }

  // Beneficiary of the Celo Gold vested in this contract.
  address payable public beneficiary;

  // Indicates how much of the vested amount has been withdrawn so far.
  uint256 public totalWithdrawn;

  // The time at which vesting was revoked.
  uint256 public revokeTime;

  // The time at which the current pause will end.
  uint256 public pauseEndTime;

  // Indicates if the contract is revocable.
  bool public revocable;

  // Address capable of revoking future vesting.
  address payable public revoker;

  // Vested instance balance at time of revocation.
  uint256 public vestedBalanceAtRevoke;

  // Maximum pause period (in seconds).
  uint256 public maxPausePeriod;

  // Public struct hosting the vesting scheme params.
  VestingSchedule public vestingSchedule;

  event WithdrawalPaused(uint256 pauseStart, uint256 pauseEnd);
  event VestingRevoked(uint256 revokeTimestamp, uint256 vestedBalanceAtRevoke);

  modifier onlyRevoker() {
    require(msg.sender == revoker, "Sender must be the registered revoker address");
    _;
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "Sender must be the registered beneficiary address");
    _;
  }

  modifier onlyRevoked() {
    require(isRevoked(), "Vesting instance must have already been revoked");
    _;
  }

  modifier onlyRevocable() {
    require(revocable, "Vesting instance must be revocable");
    _;
  }

  modifier onlyRevokerAndRevoked() {
    require(
      msg.sender == revoker && isRevoked(),
      "Sender must be the revoker and state must be revoked"
    );
    _;
  }

  modifier onlyWhenInProperState() {
    bool isRevoked = isRevoked();
    require(
      (msg.sender == revoker && isRevoked) || (msg.sender == beneficiary && !isRevoked),
      "Must be called by revoker in revoked state or beneficiary before revocation"
    );
    _;
  }

  function() external payable {} // solhint-disable no-empty-blocks

  /**
   * @notice A constructor for initialising a new instance of a Vesting Schedule contract.
   * @param vestingBeneficiary Address of the beneficiary to whom vested tokens are transferred.
   * @param vestingNumPeriods Number of vesting periods.
   * @param vestingCliff Duration (in seconds) after `vestingStartTime` of the golds' cliff.
   * @param vestingStartTime The time (in Unix time) at which point vesting starts.
   * @param vestingPeriodSec Duration (in seconds) of each vesting period.
   * @param vestAmountPerPeriod The vesting amount per period.
   * @param vestingRevocable Whether the vesting is revocable or not.
   * @param vestingRevoker Address capable of revoking future vesting.
   * @param vestingMaxPausePeriod Maximum pause period (in seconds).
   * @param registryAddress Address of the deployed contracts registry.
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
    require(vestAmountPerPeriod > 0, "The vesting amount per period must be greater than zero");
    require(vestingMaxPausePeriod > 0, "The maximum pause period must be greater than zero");
    require(
      vestingBeneficiary != address(0),
      "The vesting beneficiary cannot be the zero addresss"
    );
    require(vestingRevoker != address(0), "The vesting revoker cannot be the zero address");
    require(registryAddress != address(0), "The registry address cannot be the zero address");
    require(
      vestingStartTime.add(vestingNumPeriods.mul(vestingPeriodSec)) > block.timestamp,
      "Vesting end time must be in the future"
    );

    setRegistry(registryAddress);

    vestingSchedule.vestingNumPeriods = vestingNumPeriods;
    vestingSchedule.vestAmountPerPeriod = vestAmountPerPeriod;
    vestingSchedule.vestingPeriodSec = vestingPeriodSec;
    vestingSchedule.vestingCliffTime = vestingStartTime.add(vestingCliff);
    vestingSchedule.vestingStartTime = vestingStartTime;

    beneficiary = vestingBeneficiary;
    revocable = vestingRevocable;
    revoker = vestingRevoker;
    maxPausePeriod = vestingMaxPausePeriod;
  }

  /**
   * @notice Returns if the vesting has been revoked or not.
   * @return True if instance revoked.
   */
  function isRevoked() public view returns (bool) {
    return revokeTime > 0;
  }

  /**
   * @notice Returns if the vesting has been paused or not.
   * @return True if vesting is paused.
   */
  function isPaused() public view returns (bool) {
    return pauseEndTime > block.timestamp;
  }

  /**
   * @notice Transfers gold from this vesting instance to the beneficiary.
   * @param amount The requested gold amount.
   */
  function withdraw(uint256 amount) external nonReentrant onlyBeneficiary {
    require(!isPaused(), "Withdrawals only allowed in the unpaused state");
    require(amount > 0, "Requested withdrawal amount must be greater than zero");

    uint256 vestedAmount;
    if (isRevoked()) {
      vestedAmount = vestedBalanceAtRevoke;
    } else {
      vestedAmount = getCurrentVestedTotalAmount();
    }

    require(
      vestedAmount.sub(totalWithdrawn) >= amount,
      "Requested amount is greater than available vested funds"
    );
    require(
      getRemainingUnlockedBalance() >= amount,
      "Insufficient unlocked balance to withdraw amount"
    );
    totalWithdrawn = totalWithdrawn.add(amount);
    require(getGoldToken().transfer(beneficiary, amount), "Withdrawal of gold cannot fail");
    if (getRemainingTotalBalance() == 0) {
      selfdestruct(revoker);
    }
  }

  /**
   * @notice Refund revoker and beneficiary after the vesting has been revoked.
   */
  function refundAndFinalize() external nonReentrant onlyRevokerAndRevoked {
    require(getRemainingLockedBalance() == 0, "Total gold balanace must be unlocked");
    uint256 beneficiaryAmount = vestedBalanceAtRevoke.sub(totalWithdrawn);
    require(
      getGoldToken().transfer(beneficiary, beneficiaryAmount),
      "Transfer of gold to beneficiary cannot fail"
    );
    uint256 revokerAmount = getRemainingUnlockedBalance();
    require(
      getGoldToken().transfer(revoker, revokerAmount),
      "Transfer of gold to revoker cannot fail"
    );
    selfdestruct(revoker);
  }

  /**
   * @notice Revoke the future vesting schedule.
   */
  function revoke() external nonReentrant onlyRevoker onlyRevocable {
    require(!isRevoked(), "Vesting instance must not already be revoked");
    revokeTime = block.timestamp;
    vestedBalanceAtRevoke = getCurrentVestedTotalAmount();
    emit VestingRevoked(revokeTime, vestedBalanceAtRevoke);
  }

  /**
   * @notice Allows only `revoker` to pause the gold withdrawal.
   * @param pausePeriod The period for which the withdrawal shall be paused.
   */
  // TODO(lucas): pause should be callable on non-revocable contracts,
  //              but pausing needs an overhaul anyway.
  function pause(uint256 pausePeriod) external onlyRevoker onlyRevocable {
    require(!isPaused(), "Vesting withdrawals cannot already be paused");
    require(!isRevoked(), "Vesting cannot be paused if already revoked");
    require(pausePeriod <= maxPausePeriod, "Pause period cannot exceed `maxPausePeriod`");
    pauseEndTime = block.timestamp.add(pausePeriod);
    emit WithdrawalPaused(block.timestamp, pauseEndTime);
  }

  /**
   * @notice Calculates the total balance of the vesting instance including withdrawals.
   * @return The total vesting instance balance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getTotalBalance() public view returns (uint256) {
    return getRemainingUnlockedBalance().add(getRemainingLockedBalance()).add(totalWithdrawn);
  }

  /**
   * @notice Calculates the sum of locked and unlocked gold in the vesting instance.
   * @return The remaining total vesting instance balance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getRemainingTotalBalance() public view returns (uint256) {
    return getRemainingUnlockedBalance().add(getRemainingLockedBalance());
  }

  /**
   * @notice Calculates remaining unlocked gold balance in the vesting instance.
   * @return The available unlocked vesting instance gold balance.
   */
  function getRemainingUnlockedBalance() public view returns (uint256) {
    return address(this).balance;
  }

  /**
   * @notice Calculates remaining locked gold balance in the vesting instance.
   * @return The remaining locked vesting instance gold balance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getRemainingLockedBalance() public view returns (uint256) {
    return getLockedGold().getAccountTotalLockedGold(address(this));
  }

  /**
   * @notice Calculates initial vesting amount in the vesting instance.
   * @return The initial vesting amount.
   */
  function getInitialVestingAmount() public view returns (uint256) {
    return vestingSchedule.vestingNumPeriods.mul(vestingSchedule.vestAmountPerPeriod);
  }

  /**
   * @dev Calculates the total amount that has already vested up to now.
   * @return The already vested amount up to the point of call.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getCurrentVestedTotalAmount() public view returns (uint256) {
    if (block.timestamp < vestingSchedule.vestingCliffTime) {
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
   * @notice A wrapper function for the lock gold method.
   * @param value The value of gold to be locked.
   */
  function lockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    require(
      value <= address(this).balance,
      "Gold amount to lock cannot exceed the currently available gold"
    );
    getLockedGold().lock.gas(gasleft()).value(value)();
  }

  /**
   * @notice A wrapper function for the unlock gold method function.
   * @param value The value of gold to be unlocked for the vesting instance.
   */
  function unlockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().unlock(value);
  }

  /**
   * @notice A wrapper function for the relock locked gold method function.
   * @param index The index of the pending locked gold withdrawal.
   * @param value The value of gold to be relocked for the vesting instance.
   */
  function relockGold(uint256 index, uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().relock(index, value);
  }

  /**
   * @notice A wrapper function for the withdraw locked gold method function.
   * @param index The index of the pending locked gold withdrawal.
   * @dev The amount shall be withdrawn back to the vesting instance.
   */
  function withdrawLockedGold(uint256 index) external nonReentrant onlyWhenInProperState {
    getLockedGold().withdraw(index);
  }

  /**
   * @notice A wrapper function for the authorize vote signer account method.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev The v,r and s signature should be a signed message by the beneficiary
   *      encrypting the authorized address.
   */
  function authorizeVoteSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyWhenInProperState
  {
    getAccounts().authorizeVoteSigner(signer, v, r, s);
  }

  /**
   * @notice A convenience wrapper setter for the name, dataEncryptionKey
   *         and wallet address for an account.
   * @param name A string to set as the name of the account.
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account.
   */
  function setAccount(string calldata name, bytes calldata dataEncryptionKey, address walletAddress)
    external
    onlyWhenInProperState
  {
    getAccounts().setAccount(name, dataEncryptionKey, walletAddress);
  }

  /**
   * @notice A wrapper setter function for creating an account.
   */
  function createAccount() external onlyWhenInProperState {
    require(getAccounts().createAccount(), "Account creation failed");
  }

  /**
   * @notice A wrapper setter function for the name of an account.
   * @param name A string to set as the name of the account.
   */
  function setAccountName(string calldata name) external onlyWhenInProperState {
    getAccounts().setName(name);
  }

  /**
   * @notice A wrapper setter function for the wallet address of an account.
   * @param walletAddress The wallet address to set for the account.
   */
  function setAccountWalletAddress(address walletAddress) external onlyWhenInProperState {
    getAccounts().setWalletAddress(walletAddress);
  }

  /**
   * @notice A wrapper setter function for the for the data encryption key
   *         and version of an account.
   * @param dataEncryptionKey Secp256k1 public key for data encryption.
   *                          Preferably compressed.
   */
  function setAccountDataEncryptionKey(bytes calldata dataEncryptionKey)
    external
    onlyWhenInProperState
  {
    getAccounts().setAccountDataEncryptionKey(dataEncryptionKey);
  }

  /**
   * @notice A wrapper setter function for the metadata of an account.
   * @param metadataURL The URL to access the metadata..
   */
  function setAccountMetadataURL(string calldata metadataURL) external onlyWhenInProperState {
    getAccounts().setMetadataURL(metadataURL);
  }

  /**
   * @notice Increments the number of total and pending votes for `group`.
   * @param group The validator group to vote for.
   * @param value The amount of gold to use to vote.
   * @param lesser The group receiving fewer votes than `group`, or 0 if `group` has the
   *               fewest votes of any validator group.
   * @param greater The group receiving more votes than `group`, or 0 if `group` has the
   *                most votes of any validator group.
   * @dev Fails if `group` is empty or not a validator group.
   */
  function vote(address group, uint256 value, address lesser, address greater)
    external
    nonReentrant
    onlyWhenInProperState
  {
    require(getElection().vote(group, value, lesser, greater), "Voting for a group failed");
  }

  /**
   * @notice Converts `account`'s pending votes for `group` to active votes.
   * @param group The validator group to vote for.
   * @dev Pending votes cannot be activated until an election has been held.
   */
  function activate(address group) external nonReentrant onlyWhenInProperState {
    require(getElection().activate(group), "Activating votes for a group failed");
  }

  /**
   * @notice Revokes `value` active votes for `group`.
   * @param group The validator group to revoke votes from.
   * @param value The number of votes to revoke.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *               or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *               or 0 if that group has the most votes of any validator group.
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
      "Revoking active votes for a group failed"
    );
  }

  /**
   * @notice Revokes `value` pending votes for `group`.
   * @param group The validator group to revoke votes from.
   * @param value The number of votes to revoke.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *               or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *                or 0 if that group has the most votes of any validator group.
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
      "Revoking pending votes for a group failed"
    );
  }
}

pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IVestingInstance.sol";

import "../common/UsingRegistry.sol";

contract VestingInstance is UsingRegistry, ReentrancyGuard, IVestingInstance {
  using SafeMath for uint256;

  struct VestingSchedule {
    // total that is to be vested
    uint256 vestingAmount;
    // amount that is to be vested per period
    uint256 vestAmountPerPeriod;
    // durations in secs. of one period
    uint256 vestingPeriodSec;
    // timestamp for the starting point of the vesting. Timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 vestingStartTime;
    // timestamps for the cliff starting point. Timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 vestingCliffStartTime;
  }

  // beneficiary of the Celo Gold to be vested in this contract
  address payable public beneficiary;

  // indicates how much of the vested amount has been withdrawn
  uint256 public currentlyWithdrawn;

  // indicates if the vesting has been revoked. false by default
  bool public revoked;

  // indicates if the withdrawing has been paused
  bool public paused;

  // the time at which the revocation has taken place
  uint256 public revokeTime;

  // the time at which the pausing shall end
  uint256 public pauseEndTime;

  // indicates if the contract is revokable
  bool public revocable;

  // revoking address
  address payable public revoker;

  // amount owned by the beneficiary at revoke time
  uint256 public beneficiaryWithdrawableAtRevoke;

  // a public struct hosting the vesting scheme params
  VestingSchedule public vestingSchedule;

  event WithdrawalPaused(uint256 pausePeriod, uint256 pauseTimestamp);
  event VestingRevoked(uint256 revokeTimestamp, uint256 beneficiaryWithdrawableAtRevoke);

  modifier onlyRevoker() {
    require(msg.sender == revoker, "sender must be the vesting revoker");
    _;
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "sender must be the vesting beneficiary");
    _;
  }

  modifier onlyRevoked() {
    require(revoked, "vesting instance must have already been revoked");
    _;
  }

  modifier onlyRevokerAndRevoked() {
    require(
      msg.sender == revoker && revoked,
      "sender must be the revoker and state must be revoked"
    );
    _;
  }

  modifier onlyWhenInProperState() {
    require(
      (msg.sender == revoker && revoked) || (msg.sender == beneficiary && !revoked),
      "either revoker in revoked state or beneficiary in unrevoked"
    );
    _;
  }

  function() external payable {} // solhint-disable no-empty-blocks

  /**
   * @notice A constructor for initialising a new instance of a Vesting Schedule contract
   * @param vestingBeneficiary address of the beneficiary to whom vested tokens are transferred
   * @param vestingAmount the amount that is to be vested by the contract
   * @param vestingCliff duration in seconds of the cliff in which tokens will begin to vest
   * @param vestingStartTime the time (as Unix time) at which point vesting starts
   * @param vestingPeriodSec duration in seconds of the period in which the tokens will vest
   * @param vestAmountPerPeriod the vesting amound per period where period is the vestingAmount distributed over the vestingPeriodSec
   * @param vestingRevocable whether the vesting is revocable or not
   * @param vestingRevoker address of the person revoking the vesting
   * @param registryAddress address of the deployed contracts registry
   */
  constructor(
    address payable vestingBeneficiary,
    uint256 vestingAmount,
    uint256 vestingCliff,
    uint256 vestingStartTime,
    uint256 vestingPeriodSec,
    uint256 vestAmountPerPeriod,
    bool vestingRevocable,
    address payable vestingRevoker,
    address registryAddress
  ) public {
    uint256 numPeriods = vestingAmount.div(vestAmountPerPeriod);
    require(numPeriods >= 1, "There must be at least one vesting period");
    require(
      numPeriods.mul(vestAmountPerPeriod) == vestingAmount,
      "Vesting amount per period and total vesting amount are inconsistent"
    );
    require(vestingBeneficiary != address(0), "Beneficiary is the zero address");
    require(vestingAmount > 0, "Vesting amount must be positive");
    require(vestingCliff <= vestingPeriodSec, "Vesting cliff is longer than vesting duration");
    require(
      vestingStartTime.add(numPeriods.mul(vestingPeriodSec)) > block.timestamp,
      "Vesting end time must be in the future"
    );

    setRegistry(registryAddress);

    vestingSchedule.vestingAmount = vestingAmount;
    vestingSchedule.vestAmountPerPeriod = vestAmountPerPeriod;
    vestingSchedule.vestingPeriodSec = vestingPeriodSec;
    vestingSchedule.vestingCliffStartTime = vestingStartTime.add(vestingCliff);
    vestingSchedule.vestingStartTime = vestingStartTime;

    beneficiary = vestingBeneficiary;
    revocable = vestingRevocable;
    revoker = vestingRevoker;
  }

  /**
   * @notice Transfers gold from the vesting back to beneficiary.
   * @param amount the requested gold amount
   */
  function withdraw(uint256 amount) external nonReentrant onlyBeneficiary {
    bool isPaused = block.timestamp < pauseEndTime;
    require(!isPaused, "Withdrawals only allowed in the unpaused state");

    if (!revoked) {
      uint256 withdrawableAmount = getWithdrawableAmount();
      require(withdrawableAmount > 0, "No gold is due for withdrawal");
      require(
        withdrawableAmount >= amount,
        "Required withdraw amount is above the allowed withdrawal limit"
      );
      currentlyWithdrawn = currentlyWithdrawn.add(withdrawableAmount);
      require(getGoldToken().transfer(beneficiary, amount), "Withdrawal of gold failed");
      if (getVestingInstanceTotalBalance().sub(currentlyWithdrawn) == 0) {
        selfdestruct(beneficiary);
      }
    } else {
      // e.g revoked
      require(
        getVestingInstanceAvailableBalance() >= beneficiaryWithdrawableAtRevoke,
        "Insufficient contract balance to withdraw in the revoked state"
      );
      require(
        beneficiaryWithdrawableAtRevoke >= amount,
        "Required withdraw amount is above the allowed limit"
      );
      require(getGoldToken().transfer(beneficiary, amount), "Withdrawal of gold failed");
    }
  }

  /**
   * @notice Refund revoker and beneficiary after the vesting has been revoked.
   */
  function refundAndFinalize() external nonReentrant onlyRevokerAndRevoked {
    require(getVestingInstanceLockedBalance() == 0, "Some of the vested gold is still locked");
    require(
      getVestingInstanceAvailableBalance() >= beneficiaryWithdrawableAtRevoke,
      "Insufficient contract balance to refund beneficiary"
    );
    require(
      getGoldToken().transfer(beneficiary, beneficiaryWithdrawableAtRevoke),
      "Refund of gold to beneficiary failed"
    );
    uint256 revokerRefund = getVestingInstanceAvailableBalance().sub(
      beneficiaryWithdrawableAtRevoke
    );
    require(getGoldToken().transfer(revoker, revokerRefund), "Refund of gold to revoker failed");
    selfdestruct(beneficiary);
  }

  /**
   * @notice Revoke the vesting scheme
   */
  function revoke() external nonReentrant onlyRevoker {
    require(revocable, "Revoking is not allowed");
    require(!revoked, "Vesting already revoked");
    revokeTime = block.timestamp;
    revoked = true;
    beneficiaryWithdrawableAtRevoke = getWithdrawableAmount();
    emit VestingRevoked(revokeTime, beneficiaryWithdrawableAtRevoke);
  }

  /**
   * @notice Allows only the revoker to pause the gold withdrawal
   * @param pausePeriod the period for which the withdrawal shall be paused
   */
  function pause(uint256 pausePeriod) external onlyRevoker {
    require(
      !paused || (paused && pauseEndTime < block.timestamp),
      "Vesting withdrawals already paused"
    );
    require(revocable, "Vesting must be revokable");
    require(!revoked, "Vesting already revoked");
    require(pausePeriod <= 365 days, "Pause period is limited to max. 365 days");
    paused = true;
    pauseEndTime = block.timestamp.add(pausePeriod);
    emit WithdrawalPaused(pausePeriod, block.timestamp);
  }

  /**
   * @notice Calculates the sum of non-locked, locked, available and withdrawn gold
   * @return The total vesting instance balance
   */
  function getVestingInstanceTotalBalance() public view returns (uint256) {
    return
      getVestingInstanceAvailableBalance().add(getVestingInstanceLockedBalance()).add(
        currentlyWithdrawn
      );
  }

  /**
   * @notice Calculates the sum of non-locked, locked and available gold
   * @return The total vesting instance non-withdrawn balance
   */
  function getVestingInstanceNonWithdrawnTotalBalance() public view returns (uint256) {
    return getVestingInstanceAvailableBalance().add(getVestingInstanceLockedBalance());
  }

  /**
   * @notice Calculates available gold balance in the vesting instance
   * @return The available vesting instance balance
   */
  function getVestingInstanceAvailableBalance() public view returns (uint256) {
    return address(this).balance;
  }

  /**
   * @notice Calculates locked gold balance in the vesting instance
   * @return The locked vesting instance balance
   */
  function getVestingInstanceLockedBalance() public view returns (uint256) {
    return getLockedGold().getAccountTotalLockedGold(address(this));
  }

  /**
   * @dev Calculates the amount that has already vested up to now and is available for withdraw.
   * @return The withdrawable amount up to the point of call
   * @dev Function is also made public in order to be called for informational purpose
   */
  function getWithdrawableAmount() public view returns (uint256) {
    return calculateVestedAmount().sub(currentlyWithdrawn).sub(getVestingInstanceLockedBalance());
  }

  /**
   * @dev Calculates the amount that has already vested up to now.
   * @return The already vested amount up to the point of call
   */
  function calculateVestedAmount() private view returns (uint256) {
    if (block.timestamp < vestingSchedule.vestingCliffStartTime) {
      return 0;
    }
    uint256 totalBalance = getVestingInstanceTotalBalance();
    uint256 vestingPeriods = uint256(
      vestingSchedule.vestingAmount.div(vestingSchedule.vestAmountPerPeriod)
    );

    if (
      block.timestamp >=
      vestingSchedule.vestingStartTime.add(vestingPeriods.mul(vestingSchedule.vestingPeriodSec))
    ) {
      return totalBalance;
    }

    uint256 timeSinceStart = block.timestamp.sub(vestingSchedule.vestingStartTime);
    uint256 periodsSinceStart = uint256(timeSinceStart.div(vestingSchedule.vestingPeriodSec));
    return totalBalance.mul(periodsSinceStart).div(vestingPeriods);
  }

  /**
   * @notice A wrapper function for the lock gold method
   * @param value the value of gold to be locked
   * @dev To be called only by the beneficiary of the vesting
   */
  function lockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    // the beneficiary may not lock more than the vesting currently has available
    require(
      value <= address(this).balance,
      "Gold amount to lock is greater than the currently available gold"
    );
    getLockedGold().lock.gas(gasleft()).value(value)();
  }

  /**
   * @notice A wrapper function for the unlock gold method function
   * @param value the value of gold to be unlocked for the vesting instance
   * @dev To be called only by the beneficiary of the vesting
   */
  function unlockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().unlock(value);
  }

  /**
   * @notice A wrapper function for the relock locked gold method function
   * @param index the index of the pending locked gold withdrawal
   * @param value the value of gold to be relocked for the vesting instance
   * @dev To be called only by the beneficiary of the vesting.
   */
  function relockGold(uint256 index, uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().relock(index, value);
  }

  /**
   * @notice A wrapper function for the withdraw locked gold method function
   * @param index the index of the pending locked gold withdrawal
   * @dev To be called only by the beneficiary of the vesting. The amount shall be withdrawn back to the vesting instance
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
   * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the authorized address
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
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccount(string calldata name, bytes calldata dataEncryptionKey, address walletAddress)
    external
    onlyWhenInProperState
  {
    getAccounts().setAccount(name, dataEncryptionKey, walletAddress);
  }

  /**
   * @notice A wrapper setter function for creating an account
   * @dev To be called only by the beneficiary of the vesting.
   */
  function createAccount() external onlyWhenInProperState {
    require(getAccounts().createAccount(), "Account creation failed");
  }

  /**
   * @notice A wrapper setter function for the name of an account
   * @param name A string to set as the name of the account
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccountName(string calldata name) external onlyWhenInProperState {
    getAccounts().setName(name);
  }

  /**
   * @notice A wrapper setter function for the wallet address of an account
   * @param walletAddress The wallet address to set for the account
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccountWalletAddress(address walletAddress) external onlyWhenInProperState {
    getAccounts().setWalletAddress(walletAddress);
  }

  /**
   * @notice A wrapper setter function for the for the data encryption key and version of an account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @dev To be called only by the beneficiary of the vesting.
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
   * @dev To be called only by the beneficiary of the vesting.
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

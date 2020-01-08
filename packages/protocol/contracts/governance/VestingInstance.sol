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
  address public beneficiary;

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

  // revoking address and refund destination
  address public revoker;
  address public refundDestination;

  // a public struct hosting the vesting scheme params
  VestingSchedule public vestingSchedule;

  event WithdrawalPaused(uint256 pausePeriod, uint256 pauseTimestamp);
  event VestingRevoked(uint256 revokeTimestamp);

  modifier onlyRevoker() {
    require(msg.sender == revoker, "sender must be the vesting revoker");
    _;
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "sender must be the vesting beneficiary");
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
   * @param vestingRefundDestination address of the refund receiver after the vesting is deemed revoked
   * @param registryAddress address of the deployed contracts registry
   */
  constructor(
    address vestingBeneficiary,
    uint256 vestingAmount,
    uint256 vestingCliff,
    uint256 vestingStartTime,
    uint256 vestingPeriodSec,
    uint256 vestAmountPerPeriod,
    bool vestingRevocable,
    address vestingRevoker,
    address vestingRefundDestination,
    address registryAddress
  ) public {
    uint256 numPeriods = vestingAmount.div(vestAmountPerPeriod);
    require(numPeriods >= 1, "There must be at least one vesting period");
    require(
      numPeriods.mul(vestAmountPerPeriod) == vestingAmount,
      "Vesting amount per period and total vesting amount are inconsistent"
    );
    require(vestingBeneficiary != address(0), "Beneficiary is the zero address");
    require(vestingRefundDestination != address(0), "Refund destination is the zero address");
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
    refundDestination = vestingRefundDestination;
    revoker = vestingRevoker;
  }

  /**
   * @notice Transfers available released tokens from the vesting back to beneficiary.
   */
  function withdraw() external nonReentrant onlyBeneficiary {
    bool isPaused = block.timestamp < pauseEndTime;
    require(!isPaused, "Withdrawals only allowed in the unpaused state");
    uint256 withdrawableAmount = getWithdrawableAmountAtTimestamp(block.timestamp);
    require(withdrawableAmount > 0, "No gold is due for withdrawal");
    currentlyWithdrawn = currentlyWithdrawn.add(withdrawableAmount);
    require(getGoldToken().transfer(beneficiary, withdrawableAmount), "Withdrawal of gold failed");
  }

  /**
   * @notice Allows only the revoker to revoke the vesting. Gold already vested
   * remains in the contract, the rest is returned to the _refundDestination.
   * @param revokeTimestamp the revocation timestamp
   * @dev If revokeTimestamp is less than the current block timestamp, it is set equal to the latter
   */
  function revoke(uint256 revokeTimestamp) external nonReentrant onlyRevoker {
    require(revocable, "Revoking is not allowed");
    require(!revoked, "Vesting already revoked");
    revokeTime = revokeTimestamp > block.timestamp ? revokeTimestamp : block.timestamp;
    uint256 balance = getVestingInstanceTotalBalance();
    uint256 withdrawableAmount = getWithdrawableAmountAtTimestamp(revokeTime);
    uint256 refundAmount = balance.sub(withdrawableAmount);
    revoked = true;
    require(
      getGoldToken().transfer(refundDestination, refundAmount),
      "Transfer of refund upon revokation failed"
    );
    emit VestingRevoked(revokeTime);
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
   * @dev Calculates the amount that has already vested but hasn't been withdrawn yet.
   * @param timestamp the timestamp at which to calculate the withdrawable amount
   * @return The withdrawable amount at the timestamp
   * @dev Function is also made public in order to be called for informational purpose
   */
  function getWithdrawableAmountAtTimestamp(uint256 timestamp) public view returns (uint256) {
    return calculateVestedAmountAtTimestamp(timestamp).sub(currentlyWithdrawn);
  }

  /**
   * @notice Calculates both non-locked and locked gold balance parts and returns their sum as the total balance of the vesting instance
   * @return The total vesting instance balance
   */
  function getVestingInstanceTotalBalance() public view returns (uint256) {
    uint256 nonLockedBalance = getGoldToken().balanceOf(address(this));
    uint256 lockedBalance = getLockedGold().getAccountTotalLockedGold(address(this));
    return nonLockedBalance.add(lockedBalance);
  }

  /**
   * @dev Calculates the amount that has already vested.
   * @param timestamp the timestamp at which to calculate the already vested amount
   */
  function calculateVestedAmountAtTimestamp(uint256 timestamp) private view returns (uint256) {
    if (timestamp < vestingSchedule.vestingCliffStartTime) {
      return 0;
    }
    uint256 currentBalance = getVestingInstanceTotalBalance();
    uint256 totalBalance = currentBalance.add(currentlyWithdrawn);
    uint256 vestingPeriods = uint256(
      vestingSchedule.vestingAmount.div(vestingSchedule.vestAmountPerPeriod)
    );

    if (
      timestamp >=
      vestingSchedule.vestingStartTime.add(vestingPeriods.mul(vestingSchedule.vestingPeriodSec)) ||
      revoked
    ) {
      return totalBalance;
    }

    uint256 timeSinceStart = timestamp.sub(vestingSchedule.vestingStartTime);
    uint256 periodsSinceStart = uint256(timeSinceStart.div(vestingSchedule.vestingPeriodSec));
    return totalBalance.mul(periodsSinceStart).div(vestingPeriods);
  }

  /**
   * @notice A wrapper function for the lock gold method
   * @param value the value of gold to be locked
   * @dev To be called only by the beneficiary of the vesting
   */
  function lockGold(uint256 value) external nonReentrant onlyBeneficiary {
    // the beneficiary may not lock more than the vesting currently has available
    require(
      value <= address(this).balance,
      "Gold amount to lock is greater than the currently vested amount"
    );
    getLockedGold().lock.gas(gasleft()).value(value)();
  }

  /**
   * @notice A wrapper function for the unlock gold method function
   * @param value the value of gold to be unlocked for the vesting instance
   * @dev To be called only by the beneficiary of the vesting
   */
  function unlockGold(uint256 value) external nonReentrant onlyBeneficiary {
    getLockedGold().unlock(value);
  }

  /**
   * @notice A wrapper function for the relock locked gold method function
   * @param index the index of the pending locked gold withdrawal
   * @param value the value of gold to be relocked for the vesting instance
   * @dev To be called only by the beneficiary of the vesting.
   */
  function relockGold(uint256 index, uint256 value) external nonReentrant onlyBeneficiary {
    getLockedGold().relock(index, value);
  }

  /**
   * @notice A wrapper function for the withdraw locked gold method function
   * @param index the index of the pending locked gold withdrawal
   * @dev To be called only by the beneficiary of the vesting. The amount shall be withdrawn back to the vesting instance
   */
  function withdrawLockedGold(uint256 index) external nonReentrant onlyBeneficiary {
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
    onlyBeneficiary
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
    onlyBeneficiary
  {
    getAccounts().setAccount(name, dataEncryptionKey, walletAddress);
  }

  /**
   * @notice A wrapper setter function for creating an account
   * @dev To be called only by the beneficiary of the vesting.
   */
  function createAccount() external onlyBeneficiary {
    require(getAccounts().createAccount(), "Account creation failed");
  }

  /**
   * @notice A wrapper setter function for the name of an account
   * @param name A string to set as the name of the account
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccountName(string calldata name) external onlyBeneficiary {
    getAccounts().setName(name);
  }

  /**
   * @notice A wrapper setter function for the wallet address of an account
   * @param walletAddress The wallet address to set for the account
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccountWalletAddress(address walletAddress) external onlyBeneficiary {
    getAccounts().setWalletAddress(walletAddress);
  }

  /**
   * @notice A wrapper setter function for the for the data encryption key and version of an account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccountDataEncryptionKey(bytes calldata dataEncryptionKey) external onlyBeneficiary {
    getAccounts().setAccountDataEncryptionKey(dataEncryptionKey);
  }

  /**
   * @notice A wrapper setter function for the metadata of an account
   * @param metadataURL The URL to access the metadata.
   * @dev To be called only by the beneficiary of the vesting.
   */
  function setAccountMetadataURL(string calldata metadataURL) external onlyBeneficiary {
    getAccounts().setMetadataURL(metadataURL);
  }
}

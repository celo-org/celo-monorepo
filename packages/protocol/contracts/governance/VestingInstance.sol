pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/UsingRegistry.sol";

contract VestingSchedule is UsingRegistry, ReentrancyGuard {
  modifier onlyRevoker() {
    require(msg.sender == revoker, "sender must be the vesting revoker");
    _;
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "sender must be the vesting beneficiary");
    _;
  }

  using SafeMath for uint256;

  struct VestingScheme {
    // total that is to be vested
    uint256 vestingAmount;
    // amount that is to be vested per period
    uint256 vestAmountPerPeriod;
    // number of vesting periods
    uint256 vestingPeriods;
    // durations in secs. of one period
    uint256 vestingPeriodSec;
    // timestamp for the starting point of the vesting. Timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 vestingStartTime;
    // timestamps for the cliff starting point. Timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 cliffStartTime;
  }

  // beneficiary of the amount
  address public beneficiary;

  // indicates how much of the vested amount has been withdrawn (i.e. withdrawn)
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
  VestingScheme public vestingScheme;

  event WithdrawalPaused(uint256 pausePeriod, uint256 pauseTimestamp);

  /**
     * @notice A constructor for initialising a new instance of a Vesting Schedule contract
     * @param beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param vestingAmount the amount that is to be vested by the contract
     * @param vestingCliff duration in seconds of the cliff in which tokens will begin to vest
     * @param vestingStartTime the time (as Unix time) at which point vesting starts
     * @param vestingPeriodSec duration in seconds of the period in which the tokens will vest
     * @param vestAmountPerPeriod the vesting amound per period where period is the vestingAmount distributed over the vestingPeriodSec
     * @param revocable whether the vesting is revocable or not
     * @param revoker address of the person revoking the vesting
     * @param refundDestination address of the refund receiver after the vesting is deemed revoked
     */
  constructor(
    address beneficiary,
    uint256 vestingAmount,
    uint256 vestingCliff,
    uint256 vestingStartTime,
    uint256 vestingPeriodSec,
    uint256 vestAmountPerPeriod,
    bool revocable,
    address revoker,
    address refundDestination
  ) public {
    // perform checks on the input data
    require(vestingAmount > 0, "Vesting amount must be positive");
    require(beneficiary != address(0), "Beneficiary is the zero address");
    require(refundDestination != address(0), "Refund destination is the zero address");
    require(vestingCliff <= vestingPeriodSec, "Vesting cliff is longer than vesting duration");
    require(vestingPeriodSec > 0, "Vesting period is 0 s.");
    require(
      vestAmountPerPeriod <= vestingAmount,
      "Vesting amount per period is greater than the total vesting amount"
    );
    require(
      vestingStartTime.add(vestingCliff) > block.timestamp,
      "Vesting end time is before current time"
    );

    // init the vesting scheme
    vestingScheme.vestingPeriods = vestingAmount.div(vestAmountPerPeriod);
    vestingScheme.vestingAmount = vestingAmount;
    vestingScheme.vestAmountPerPeriod = vestAmountPerPeriod;
    vestingScheme.vestingPeriodSec = vestingPeriodSec;
    vestingScheme.cliffStartTime = vestingStartTime.add(vestingCliff);
    vestingScheme.vestingStartTime = vestingStartTime;

    // init the state vars
    beneficiary = beneficiary;
    revocable = revocable;
    refundDestination = refundDestination;
    revoker = revoker;
  }

  /**
     * @notice Transfers available released tokens from the vesting back to beneficiary.
     */
  function withdraw() external nonReentrant onlyBeneficiary {
    bool isUnpaused = !paused || (paused && block.timestamp >= pauseEndTime);
    require(isUnpaused, "Withdrawals only allowed in the unpaused state");
    if (isUnpaused) paused = false;
    uint256 withdrawableAmount = getWithdrawableAmountAtTimestamp(block.timestamp);
    require(withdrawableAmount > 0, "No gold is due for withdrawal");
    currentlyWithdrawn = currentlyWithdrawn.add(withdrawableAmount);
    require(getGoldToken().transfer(beneficiary, withdrawableAmount), "Withdrawal of gold failed");
  }

  /**
     * @notice Allows only the revoker to revoke the vesting. Gold already vested
     * remains in the contract, the rest is returned to the _refundDestination.
     * @param revokeTime the revocation timestamp
     * @dev revokeTime the revocation timestamp. If is less than the current block timestamp, it is set equal
     */
  function revoke(revokeTime) external nonReentrant onlyRevoker {
    require(revocable, "Revoking is not allowed");
    require(!revoked, "Vesting already revoked");
    uint256 revokeTimestamp = revokeTime > block.timestamp ? revokeTime : block.timestamp;
    uint256 balance = getGoldToken().balanceOf(address(this));
    uint256 withdrawableAmount = getWithdrawableAmountAtTimestamp(revokeTimestamp);
    uint256 refundAmount = balance.sub(withdrawableAmount);
    revoked = true;
    revokeTime = revokeTimestamp;
    require(
      getGoldToken().transfer(refundDestination, refundAmount),
      "Transfer of refund upon revokation failed"
    );
  }

  /**
     * @notice Allows only the revoker to pause the gold withdrawal
     * @param pausePeriod the period for which the withdrawal shall be paused
     */
  function pause(pausePeriod) external onlyRevoker {
    require(!paused, "Vesting withdrawals already paused");
    require(revocable, "Vesting must be revokable");
    require(!revoked, "Vesting already revoked");
    require(pausePeriod <= 365 days, "Pause period is limited to max. 365 days");
    paused = true;
    pauseEndTime = block.timestamp + pausePeriod;
    emit WithdrawalPaused(pausePeriod, block.timestamp);
  }

  /**
     * @dev Calculates the amount that has already vested but hasn't been withdrawn yet.
     * @param timestamp the timestamp at which the calculate the withdrawable amount
     * @dev Function is also made public in order to be called for informational purpose
     */
  function getWithdrawableAmountAtTimestamp(uint256 timestamp) public view returns (uint256) {
    return calculateFreeAmountAtTimestamp(timestamp).sub(currentlyWithdrawn);
  }

  /**
     * @dev Calculates the amount that has already vested.
     * @param timestamp the timestamp at which the calculate the already vested amount
     */
  function calculateFreeAmountAtTimestamp(uint256 timestamp) private view returns (uint256) {
    uint256 currentBalance = getGoldToken().balanceOf(address(this));
    uint256 totalBalance = currentBalance.add(currentlyWithdrawn);

    if (timestamp < vestingScheme.cliffStartTime) {
      return 0;
    }
    if (
      timestamp >=
      vestingScheme.vestingStartTime.add(
        vestingScheme.vestingPeriods.mul(vestingScheme.vestingPeriodSec)
      ) ||
      revoked
    ) {
      return totalBalance;
    }

    uint256 vestingCurveGradient = (timestamp.sub(vestingScheme.vestingStartTime)).div(
      vestingScheme.vestingPeriodSec
    );
    return
      ((currentBalance.mul(vestingCurveGradient)).mul(vestingScheme.vestAmountPerPeriod)).div(
        totalBalance
      );
  }

  /**
     * @notice A wrapper func for the lock gold method
     * @param value the value of gold to be locked
     * @dev To be called only by the beneficiary of the vesting
     */
  function lockGold(uint256 value) external nonReentrant onlyBeneficiary {
    // the beneficiary may not lock more than the vesting currently has available
    require(
      value <= getGoldToken().balanceOf(address(this)),
      "Gold amount to lock is greater than the currently vested amount"
    );
    address(getLockedGold()).lock.gas(gasleft()).value(value)();
  }

  /**
     * @notice A wrapper func for the unlock gold method function
     * @param value the value of gold to be unlocked for the vesting instance
     * @dev To be called only by the beneficiary of the vesting
     */
  function unlockGold(uint256 value) external nonReentrant onlyBeneficiary {
    getLockedGold().unlock(value);
  }

  /**
     * @notice A wrapper func for the relock locked gold method function
     * @param index the index of the pending locked gold withdrawal
     * @dev To be called only by the beneficiary of the vesting.
     */
  function relockGold(uint256 index) external nonReentrant onlyBeneficiary {
    getLockedGold().relock(index);
  }

  /**
     * @notice A wrapper func for the withdraw locked gold method function
     * @param index the index of the pending locked gold withdrawal
     * @dev To be called only by the beneficiary of the vesting. The amount shall be withdrawn back to the vesting instance
     */
  function withdrawLockedGold(uint256 index) external nonReentrant onlyBeneficiary {
    getLockedGold().withdraw(index);
  }

  /**
     * @notice A wrapper func for the authorize vote signer account method
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
     * @notice A wrapper func for the authorize validator signer account method
     * @param signer The address of the signing key to authorize.
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the the authorized address
     */
  function authorizeValidatorSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyBeneficiary
  {
    getAccounts().authorizeValidatorSigner(signer, v, r, s);
  }

  /**
     * @notice A wrapper func for the authorize validator signer account method
     * @param signer The address of the signing key to authorize.
     * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the authorized address
     */
  function authorizeValidatorSigner(
    address signer,
    bytes calldata ecdsaPublicKey,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external nonReentrant onlyBeneficiary {
    getAccounts().authorizeValidatorSigner(signer, ecdsaPublicKey, v, r, s);
  }

  /**
     * @notice A wrapper func for the authorize attestation signer account method
     * @param signer The address of the signing key to authorize.
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the authorized address
     */
  function authorizeAttestationSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyBeneficiary
  {
    getAccounts().authorizeAttestationSigner(signer, v, r, s);
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
  function setAccountName(string memory name) external onlyBeneficiary {
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
  function setAccountDataEncryptionKey(bytes memory dataEncryptionKey) external onlyBeneficiary {
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

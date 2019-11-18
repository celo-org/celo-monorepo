pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/UsingRegistry.sol";

contract VestingSchedule is UsingRegistry {

    modifier onlyRevoker() {
      require(msg.sender == mRevoker, "sender must be the vesting revoker");
      _;
    }

    modifier onlyBeneficiary() {
      require(msg.sender == mRevoker, "sender must be the vesting beneficiary");
      _;
    }

    using SafeMath for uint256;

    event VestingGoldLocked(uint256 amount, uint256 timestamp);
    event VestingGoldUnlocked(uint256 amount, uint256 timestamp);
    event VestingGoldRelocked(uint256 index, uint256 timestamp);
    event VestingGoldWithdrawn(uint256 index, uint256 timestamp);
    event VestingAccountVoterAuthorized(address authorizer, address voter, uint256 timestamp);
    event VestingAccountValidatorAuthorized(address authorizer, address validator, uint256 timestamp);
    event VestingAccountAttestatorAuthorized(address authorizer, address attestator, uint256 timestamp);
    event VestingWithdrawn(address beneficiary, uint256 amount, uint256 timestamp);
    event VestingRevoked(address revoker, address refundDestination, uint256 refundDestinationAmount, uint256 timestamp);

    // total that is to be vested
    uint256 public mVestingAmount;

    // amount that is to be vested per period
    uint256 public mVestAmountPerPeriod;

    // number of vesting periods
    uint256 public mVestingPeriods;

    // beneficiary of the amount
    address public mBeneficiary;

    // durations in secs. of one period
    uint256 public mVestingPeriodSec;

    // timestamps for start and cliff starting points. Timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 public mCliffStartTime;
    uint256 public mVestingStartTime;

    // indicates if the contract is revokable
    bool public mRevocable;

    // revoking address and refund destination
    address public mRefundDestination;
    address public mRevoker;

    // indicates how much of the vested amount has been released for withdrawal (i.e. withdrawn)
    uint256 public mCurrentlyReleased;

    // indicates if the vesting has been revoked. false by default
    bool public mRevoked;

    // the time at which the revocation has taken place
    uint256 public mRevokeTime;

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
    constructor (address beneficiary,
                uint256 vestingAmount,
                uint256 vestingCliff,
                uint256 vestingStartTime,
                uint256 vestingPeriodSec,
                uint256 vestAmountPerPeriod,
                bool    revocable,
                address revoker,
                address refundDestination) public {

        // do some basic checks
        require(vestingAmount > 0, "Amount must be positive");
        require(beneficiary != address(0), "Beneficiary is the zero address");
        require(refundDestination != address(0), "Refund destination is the zero address");
        require(vestingCliff <= vestingPeriodSec, "Vesting cliff is longer than duration");
        require(vestingPeriodSec > 0, "Vesting period is 0 s.");
        require(vestAmountPerPeriod <= vestingAmount, "Vesting amount per period is greater than the total vesting amount");
        require(vestingStartTime.add(vestingCliff) > block.timestamp, "Final time is before current time");

        //make the vesting instance an account
        bool accountCreated = getAccounts().createAccount();
        require(accountCreated);

        mVestingPeriods = vestingAmount.div(vestAmountPerPeriod);
        mBeneficiary = beneficiary;
        mVestingAmount = vestingAmount;
        mVestAmountPerPeriod = vestAmountPerPeriod;
        mRevocable = revocable;
        mVestingPeriodSec = vestingPeriodSec;
        mCliffStartTime = vestingStartTime.add(vestingCliff);
        mVestingStartTime = vestingStartTime;
        mRefundDestination = refundDestination;
        mRevoker = revoker;
    }

    /**
     * @notice Transfers available released tokens from the vesting back to beneficiary.
     */
    function withdraw() external onlyBeneficiary {
        uint256 releasableAmount = _getReleasableAmount(block.timestamp);

        require(releasableAmount > 0, "No unreleased tokens are due for withdraw");

        mCurrentlyReleased = mCurrentlyReleased.add(releasableAmount);

        getGoldToken().safeTransfer(mBeneficiary, releasableAmount);

        emit VestingWithdrawn(msg.sender, releasableAmount, block.timestamp);
    }

    /**
     * @notice Allows only the revoker to revoke the vesting. Gold already vested
     * remains in the contract, the rest is returned to the _refundDestination.
     * @param revokeTime the revocation timestamp
     * @dev revokeTime the revocation timestamp. If is less than the current block timestamp, it is set equal
     */
    function revoke(revokeTime) external onlyRevoker {
        require(mRevocable, "Revoking is not allowed");
        require(!mRevoked, "Vesting already revoked");

        uint256 revokeTimestamp = revokeTime > block.timestamp ? revokeTime : block.timestamp;

        uint256 balance = getGoldToken().balanceOf(address(this));
        uint256 releasableAmount = _getReleasableAmount(revokeTimestamp);
        uint256 refund = balance.sub(releasableAmount);

        mRevoked = true;
        mRevokeTime = revokeTimestamp;

        getGoldToken().transfer(mRefundDestination, refund);

        emit VestingRevoked(msg.sender, mRefundDestination, refund, mRevokeTime);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been withdrawn (released) yet.
     * @param timestamp the timestamp at which the calculate the releasable amount
     */
    function _getReleasableAmount(uint256 timestamp) public view returns (uint256) {
        return _calculateFreeAmount(timestamp).sub(mCurrentlyReleased);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param timestamp the timestamp at which the calculate the already vested amount
     */
    function _calculateFreeAmount(uint256 timestamp) private view returns (uint256) {
        uint256 currentBalance = getGoldToken().balanceOf(address(this));
        uint256 totalBalance = currentBalance.add(mCurrentlyReleased);

        if (timestamp < mCliffStartTime) {
            return 0;
        }
        if (timestamp >= mVestingStartTime.add( mVestingPeriods.mul(mVestingPeriodSec) ) || mRevoked) {
            return totalBalance;
        }
        
        uint256 gradient = (timestamp.sub(mVestingStartTime)).div(mVestingPeriodSec);
        return  ( (currentBalance.mul(gradient)).mul(mVestAmountPerPeriod) ).div(totalBalance);
    }

    /**
     * @notice A wrapper func for the lock gold method
     * @param value the value to gold to be locked
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting
     */
    function lockGold(uint256 value) external onlyBeneficiary returns (bool) {

      // the beneficiary may not lock more than the vesting has currently released
      uint256 unreleasedAmount = _getReleasableAmount(block.timestamp);
      require(unreleasedAmount >= value, "Gold Amount to lock must not be less that the currently releasable amount");

      bool success;
      (success,) = address(getLockedGold()).lock.gas(gasleft()).value(msg.value)();
      require(success);
      emit VestingGoldLocked(msg.value, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the unlock gold method function
     * @param value the value to gold to be unlocked for the vesting instance
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting
     */
    function unlockGold(uint256 value) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getLockedGold()).unlock.gas(gasleft()).value(msg.value)(value);
      require(success);
      emit VestingGoldUnlocked(msg.value, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the relock locked gold method function
     * @param index the index of the pending locked gold withdrawal
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting.
     */
    function relockLockedGold(uint256 index) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getLockedGold()).relock.gas(gasleft())(index);
      require(success);
      emit VestingGoldRelocked(index, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the withdraw locked gold method function
     * @param index the index of the pending locked gold withdrawal
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting. The amount shall be withdrawn back by the vesting instance
     */
    function withdrawLockedGold(uint256 index) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getLockedGold()).withdraw.gas(gasleft())(index);
      require(success);
      emit VestingGoldWithdrawn(index, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the authorize vote signer account method
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the vesting contract instance address
     */
    function authorizeVoteSigner(uint8 v, bytes32 r, bytes32 s) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).authorizeVoteSigner.gas(gasleft())(beneficiary, v, r, s);
      require(success);
      emit VestingAccountVoterAuthorized(address(this), beneficiary, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the authorize validator signer account method
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the vesting contract instance address
     */
    function authorizeValidatorSigner(uint8 v, bytes32 r, bytes32 s) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).authorizeValidatorSigner.gas(gasleft())(beneficiary, v, r, s);
      require(success);
      emit VestingAccountValidatorAuthorized(address(this), beneficiary, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the authorize validator signer account method
     * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the vesting contract instance address
     */
    function authorizeValidatorSigner(bytes calldata ecdsaPublicKey, uint8 v, bytes32 r, bytes32 s) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).authorizeValidatorSigner.gas(gasleft())(beneficiary, ecdsaPublicKey, v, r, s);
      require(success);
      emit VestingAccountValidatorAuthorized(address(this), beneficiary, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper func for the authorize attestation signer account method
     * @param v The recovery id of the incoming ECDSA signature.
     * @param r Output value r of the ECDSA signature.
     * @param s Output value s of the ECDSA signature.
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting. The v,r and s signature should be a signed message by the beneficiary being the vesting contract instance address
     */
    function authorizeAttestationSigner(uint8 v, bytes32 r, bytes32 s) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).authorizeAttestationSigner.gas(gasleft())(beneficiary, v, r, s);
      require(success);
      emit VestingAccountAttestatorAuthorized(address(this), beneficiary, block.timestamp);
      return success;
    }

    /**
     * @notice A wrapper setter function for the name of an account
     * @param name A string to set as the name of the account
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting.
     */
    function setAccountName(string memory name) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).setName.gas(gasleft())(name);
      require(success);
      return success;
    }

    /**
     * @notice A wrapper setter function for the wallet address of an account
     * @param walletAddress The wallet address to set for the account
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting.
     */
    function setAccountWalletAddress(address name) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).setWalletAddress.gas(gasleft())(walletAddress);
      require(success);
      return success;
    }

    /**
     * @notice A wrapper setter function for the for the data encryption key and version of an account
     * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting.
     */
    function setAccountDataEncryptionKey(bytes memory dataEncryptionKey) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).setAccountDataEncryptionKey.gas(gasleft())(dataEncryptionKey);
      require(success);
      return success;
    }

    /**
     * @notice A wrapper setter function for the metadata of an account
     * @param metadataURL The URL to access the metadata.
     * @return True if the transaction succeeds.
     * @dev To be called only by the beneficiary of the vesting.
     */
    function setAccountMetadataURL(string calldata metadataURL) external onlyBeneficiary returns (bool) {
      bool success;
      (success,) = address(getAccounts()).setMetadataURL.gas(gasleft())(metadataURL);
      require(success);
      return success;
    }

}
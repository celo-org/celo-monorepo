pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IReleaseGold.sol";
import "./interfaces/IValidators.sol";
import "../common/FixidityLib.sol";
import "../common/libraries/ReentrancyGuard.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";

contract ReleaseGold is UsingRegistry, ReentrancyGuard, IReleaseGold, Initializable {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  struct ReleaseSchedule {
    // Timestamp (in UNIX time) that releasing begins.
    uint256 releaseStartTime;
    // Timestamp (in UNIX time) of the releasing cliff.
    uint256 releaseCliff;
    // Number of release periods.
    uint256 numReleasePeriods;
    // Duration (in seconds) of one period.
    uint256 releasePeriod;
    // Amount that is to be released per period.
    uint256 amountReleasedPerPeriod;
  }

  struct RevocationInfo {
    // Indicates if the contract is revocable.
    bool revocable;
    // Indicates if the contract can expire `EXPIRATION_TIME` after releasing finishes.
    bool canExpire;
    // Released gold instance balance at time of revocation.
    uint256 releasedBalanceAtRevoke;
    // The time at which the release schedule was revoked.
    uint256 revokeTime;
  }

  // uint256(-1) == 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
  uint256 internal constant MAX_UINT = uint256(-1);

  // Duration (in seconds) after gold is fully released
  // when gold should be switched back to control of releaseOwner.
  // 2 years
  uint256 public constant EXPIRATION_TIME = 63072000;

  // Beneficiary of the Celo Gold released in this contract.
  address payable public beneficiary;

  // Address capable of (where applicable) revoking, setting the liquidity provision, and
  // adjusting the maximum withdrawal amount.
  address public releaseOwner;

  // Address that receives refunded gold if contract is revoked.
  address payable public refundAddress;

  // Indicates how much of the released amount has been withdrawn so far.
  uint256 public totalWithdrawn;

  // Indicates the maximum gold currently available for distribution, regardless of schedule.
  // Only settable by the `releaseOwner` address, subject to grant conditions.
  uint256 public maxDistribution;

  // Indicates if the schedule contains a liquidity provision that has not yet been met.
  // Only settable by the `releaseOwner` address, subject to grant conditions.
  bool public liquidityProvisionMet;

  // Indicates if this schedule's unreleased gold can be used for validating.
  bool public canValidate;

  // Indicates if this schedule's unreleased gold can be used for voting.
  bool public canVote;

  // Public struct housing params pertaining to releasing gold.
  ReleaseSchedule public releaseSchedule;

  // Public struct housing params pertaining to revocation.
  RevocationInfo public revocationInfo;

  event ReleaseGoldInstanceCreated(address indexed beneficiary, address indexed atAddress);
  event ReleaseScheduleRevoked(uint256 revokeTimestamp, uint256 releasedBalanceAtRevoke);
  event ReleaseGoldInstanceDestroyed(address indexed beneficiary, address indexed atAddress);
  event DistributionLimitSet(address indexed beneficiary, uint256 maxDistribution);
  event LiquidityProvisionSet(address indexed beneficiary);
  event CanExpireSet(bool canExpire);
  event BeneficiarySet(address indexed beneficiary);

  modifier onlyReleaseOwner() {
    require(msg.sender == releaseOwner, "Sender must be the registered releaseOwner address");
    _;
  }

  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary, "Sender must be the registered beneficiary address");
    _;
  }

  modifier onlyRevoked() {
    require(isRevoked(), "Release schedule instance must have already been revoked");
    _;
  }

  modifier onlyRevocable() {
    require(revocationInfo.revocable, "Release schedule instance must be revocable");
    _;
  }

  modifier onlyCanVote() {
    require(canVote, "Release Gold contract does not have permission to vote");
    _;
  }

  modifier onlyCanValidate() {
    require(canValidate, "Release Gold contract does not have permission to validate");
    _;
  }

  modifier onlyReleaseOwnerAndRevoked() {
    require(
      msg.sender == releaseOwner && isRevoked(),
      "Sender must be the releaseOwner and state must be revoked"
    );
    _;
  }

  modifier onlyBeneficiaryAndNotRevoked() {
    require(
      msg.sender == beneficiary && !isRevoked(),
      "Sender must be the beneficiary and state must not be revoked"
    );
    _;
  }

  modifier onlyWhenInProperState() {
    bool isRevoked = isRevoked();
    require(
      (msg.sender == releaseOwner && isRevoked) || (msg.sender == beneficiary && !isRevoked),
      "Must be called by releaseOwner when revoked or beneficiary before revocation"
    );
    _;
  }

  modifier onlyExpired() {
    require(revocationInfo.canExpire, "Contract must be expirable");
    uint256 releaseEndTime = releaseSchedule.releaseStartTime.add(
      releaseSchedule.numReleasePeriods.mul(releaseSchedule.releasePeriod)
    );
    require(
      block.timestamp >= releaseEndTime.add(EXPIRATION_TIME),
      "`EXPIRATION_TIME` must have passed after the end of releasing"
    );
    _;
  }

  function() external payable {} // solhint-disable no-empty-blocks

  /**
   * @notice Wrapper function for stable token transfer function.
   */
  function transfer(address to, uint256 value) external onlyWhenInProperState {
    IERC20(registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID)).transfer(to, value);
  }

  /**
   * @notice A constructor for initialising a new instance of a Releasing Schedule contract.
   * @param releaseStartTime The time (in Unix time) at which point releasing starts.
   * @param releaseCliffTime Duration (in seconds) after `releaseStartTime` of the golds' cliff.
   * @param numReleasePeriods Number of releasing periods.
   * @param releasePeriod Duration (in seconds) of each release period.
   * @param amountReleasedPerPeriod The released gold amount per period.
   * @param revocable Whether the release schedule is revocable or not.
   * @param _beneficiary Address of the beneficiary to whom released tokens are transferred.
   * @param _releaseOwner Address capable of revoking, setting the liquidity provision
   *                      and setting the withdrawal amount.
   *                      0x0 if grant is not subject to these operations.
   * @param _refundAddress Address that receives refunded funds if contract is revoked.
   *                       0x0 if contract is not revocable.
   * @param subjectToLiquidityProvision If this schedule is subject to a liquidity provision.
   * @param initialDistributionRatio Amount in range [0, 1000] (3 significant figures)
   *                                 indicating % of total balance available for distribution.
   * @param _canValidate If this schedule's gold can be used for validating.
   * @param _canVote If this schedule's gold can be used for voting.
   * @param registryAddress Address of the deployed contracts registry.
   */
  function initialize(
    uint256 releaseStartTime,
    uint256 releaseCliffTime,
    uint256 numReleasePeriods,
    uint256 releasePeriod,
    uint256 amountReleasedPerPeriod,
    bool revocable,
    address payable _beneficiary,
    address _releaseOwner,
    address payable _refundAddress,
    bool subjectToLiquidityProvision,
    uint256 initialDistributionRatio,
    bool _canValidate,
    bool _canVote,
    address registryAddress
  ) external initializer {
    _transferOwnership(msg.sender);
    releaseSchedule.numReleasePeriods = numReleasePeriods;
    releaseSchedule.amountReleasedPerPeriod = amountReleasedPerPeriod;
    releaseSchedule.releasePeriod = releasePeriod;
    releaseSchedule.releaseCliff = releaseStartTime.add(releaseCliffTime);
    releaseSchedule.releaseStartTime = releaseStartTime;
    // Expiry is opt-in for folks who can validate, opt-out for folks who cannot.
    // This is because folks who are running Validators or Groups are likely to want to keep
    // cGLD in the ReleaseGold contract even after it becomes withdrawable.
    revocationInfo.canExpire = !canValidate;
    require(releaseSchedule.numReleasePeriods >= 1, "There must be at least one releasing period");
    require(
      releaseSchedule.amountReleasedPerPeriod > 0,
      "The released amount per period must be greater than zero"
    );
    require(
      _beneficiary != address(0),
      "The release schedule beneficiary cannot be the zero addresss"
    );
    require(registryAddress != address(0), "The registry address cannot be the zero address");
    require(
      address(this).balance ==
        releaseSchedule.amountReleasedPerPeriod.mul(releaseSchedule.numReleasePeriods),
      "Contract balance must equal the entire grant amount"
    );
    require(!(revocable && _canValidate), "Revocable contracts cannot validate");
    require(initialDistributionRatio <= 1000, "Initial distribution ratio out of bounds");
    require(
      (revocable && _refundAddress != address(0)) || (!revocable && _refundAddress == address(0)),
      "If contract is revocable there must be an address to refund"
    );

    setRegistry(registryAddress);
    _setBeneficiary(_beneficiary);
    revocationInfo.revocable = revocable;
    releaseOwner = _releaseOwner;
    refundAddress = _refundAddress;

    if (initialDistributionRatio < 1000) {
      // Cannot use `getTotalBalance()` here because the factory has not yet sent the gold.
      uint256 totalGrant = releaseSchedule.amountReleasedPerPeriod.mul(
        releaseSchedule.numReleasePeriods
      );
      // Initial ratio is expressed to 3 significant figures: [0, 1000].
      maxDistribution = totalGrant.mul(initialDistributionRatio).div(1000);
    } else {
      maxDistribution = MAX_UINT;
    }
    liquidityProvisionMet = (subjectToLiquidityProvision) ? false : true;
    canValidate = _canValidate;
    canVote = _canVote;
    emit ReleaseGoldInstanceCreated(beneficiary, address(this));
  }

  /**
   * @notice Returns if the release schedule has been revoked or not.
   * @return True if instance revoked.
   */
  function isRevoked() public view returns (bool) {
    return revocationInfo.revokeTime > 0;
  }

  /**
   * @notice Controls if the liquidity provision has been met, allowing gold to be withdrawn.
   */
  function setLiquidityProvision() external onlyReleaseOwner {
    require(!liquidityProvisionMet, "Liquidity provision has already been set");
    liquidityProvisionMet = true;
    emit LiquidityProvisionSet(beneficiary);
  }

  /**
   * @notice Controls if the contract can be expired.
   * @param _canExpire If the contract is expirable.
   */
  function setCanExpire(bool _canExpire) external onlyBeneficiary {
    require(
      revocationInfo.canExpire != _canExpire,
      "Expiration flag is already set to desired value"
    );
    revocationInfo.canExpire = _canExpire;
    emit CanExpireSet(revocationInfo.canExpire);
  }

  /**
   * @notice Controls the maximum distribution ratio.
   *         Calculates `distributionRatio`/1000 of current `totalBalance()`
   *         and sets this value as the maximum allowed gold to be currently withdrawn.
   * @param distributionRatio Amount in range [0, 1000] (3 significant figures)
   *                          indicating % of total balance available for distribution.
   */
  function setMaxDistribution(uint256 distributionRatio) external onlyReleaseOwner {
    require(distributionRatio <= 1000, "Max distribution ratio must be within bounds");
    require(
      maxDistribution != MAX_UINT,
      "Cannot set max distribution lower if already set to 1000"
    );
    // If ratio is 1000, we set maxDistribution to maxUint to account for future rewards.
    if (distributionRatio == 1000) {
      maxDistribution = MAX_UINT;
    } else {
      uint256 totalBalance = getTotalBalance();
      require(totalBalance > 0, "Do not set max distribution before factory sends the gold");
      maxDistribution = totalBalance.mul(distributionRatio).div(1000);
    }
    emit DistributionLimitSet(beneficiary, maxDistribution);
  }

  /**
   * @notice Sets the beneficiary of the instance
   * @param newBeneficiary The address of the new beneficiary
   */
  function setBeneficiary(address payable newBeneficiary) external onlyOwner {
    _setBeneficiary(newBeneficiary);
  }

  /**
   * @notice Sets the beneficiary of the instance
   * @param newBeneficiary The address of the new beneficiary
   */
  function _setBeneficiary(address payable newBeneficiary) private {
    require(newBeneficiary != address(0x0), "Can't set the beneficiary to the zero address");
    beneficiary = newBeneficiary;
    emit BeneficiarySet(newBeneficiary);
  }

  /**
   * @notice Transfers gold from this release schedule instance to the beneficiary.
   * @param amount The requested gold amount.
   */
  function withdraw(uint256 amount) external nonReentrant onlyBeneficiary {
    require(amount > 0, "Requested withdrawal amount must be greater than zero");
    require(liquidityProvisionMet, "Requested withdrawal before liquidity provision is met");

    uint256 releasedAmount;
    if (isRevoked()) {
      releasedAmount = revocationInfo.releasedBalanceAtRevoke;
    } else {
      releasedAmount = getCurrentReleasedTotalAmount();
    }

    require(
      releasedAmount.sub(totalWithdrawn) >= amount,
      "Requested amount is greater than available released funds"
    );
    require(
      maxDistribution >= totalWithdrawn.add(amount),
      "Requested amount exceeds current alloted maximum distribution"
    );
    require(
      getRemainingUnlockedBalance() >= amount,
      "Insufficient unlocked balance to withdraw amount"
    );
    totalWithdrawn = totalWithdrawn.add(amount);
    beneficiary.transfer(amount);
    if (getRemainingTotalBalance() == 0) {
      emit ReleaseGoldInstanceDestroyed(beneficiary, address(this));
      selfdestruct(refundAddress);
    }
  }

  /**
   * @notice Refund the releaseOwner and beneficiary after the release schedule has been revoked.
   */
  function refundAndFinalize() external nonReentrant onlyReleaseOwnerAndRevoked {
    require(getRemainingLockedBalance() == 0, "Total gold balance must be unlocked");
    uint256 beneficiaryAmount = revocationInfo.releasedBalanceAtRevoke.sub(totalWithdrawn);
    require(address(this).balance >= beneficiaryAmount, "Inconsistent balance");
    beneficiary.transfer(beneficiaryAmount);
    uint256 revokerAmount = getRemainingUnlockedBalance();
    refundAddress.transfer(revokerAmount);
    emit ReleaseGoldInstanceDestroyed(beneficiary, address(this));
    selfdestruct(refundAddress);
  }

  /**
   * @notice Revoke the future release schedule.
   */
  function revoke() external nonReentrant onlyReleaseOwner onlyRevocable {
    require(!isRevoked(), "Release schedule instance must not already be revoked");
    revocationInfo.revokeTime = block.timestamp;
    revocationInfo.releasedBalanceAtRevoke = getCurrentReleasedTotalAmount();
    emit ReleaseScheduleRevoked(revocationInfo.revokeTime, revocationInfo.releasedBalanceAtRevoke);
  }

  /**
   * @notice Mark the contract as expired, freeing all remaining gold for refund to `refundAddress`
   * @dev Only callable `EXPIRATION_TIME` after the final gold release.
   */
  function expire() external nonReentrant onlyReleaseOwner onlyExpired {
    require(!isRevoked(), "Release schedule instance must not already be revoked");
    revocationInfo.revokeTime = block.timestamp;
    revocationInfo.releasedBalanceAtRevoke = totalWithdrawn;
    emit ReleaseScheduleRevoked(revocationInfo.revokeTime, totalWithdrawn);
  }

  /**
   * @notice Calculates the total balance of the release schedule instance including withdrawals.
   * @return The total released instance gold balance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getTotalBalance() public view returns (uint256) {
    return getRemainingUnlockedBalance().add(getRemainingLockedBalance()).add(totalWithdrawn);
  }

  /**
   * @notice Calculates the sum of locked and unlocked gold in the release schedule instance.
   * @return The remaining total released instance gold balance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getRemainingTotalBalance() public view returns (uint256) {
    return getRemainingUnlockedBalance().add(getRemainingLockedBalance());
  }

  /**
   * @notice Calculates remaining unlocked gold balance in the release schedule instance.
   * @return The available unlocked release schedule instance gold balance.
   */
  function getRemainingUnlockedBalance() public view returns (uint256) {
    return address(this).balance;
  }

  /**
   * @notice Calculates remaining locked gold balance in the release schedule instance.
   *         The returned amount also includes pending withdrawals to maintain consistent releases.
   * @return The remaining locked gold of the release schedule instance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getRemainingLockedBalance() public view returns (uint256) {
    uint256 pendingWithdrawalSum = 0;
    if (getAccounts().isAccount(address(this))) {
      pendingWithdrawalSum = getLockedGold().getTotalPendingWithdrawals(address(this));
    }
    return getLockedGold().getAccountTotalLockedGold(address(this)).add(pendingWithdrawalSum);
  }

  /**
   * @dev Calculates the total amount that has already released up to now.
   * @return The already released amount up to the point of call.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getCurrentReleasedTotalAmount() public view returns (uint256) {
    if (block.timestamp < releaseSchedule.releaseCliff || !liquidityProvisionMet) {
      return 0;
    }
    uint256 totalBalance = getTotalBalance();

    if (
      block.timestamp >=
      releaseSchedule.releaseStartTime.add(
        releaseSchedule.numReleasePeriods.mul(releaseSchedule.releasePeriod)
      )
    ) {
      return totalBalance;
    }

    uint256 timeSinceStart = block.timestamp.sub(releaseSchedule.releaseStartTime);
    uint256 periodsSinceStart = timeSinceStart.div(releaseSchedule.releasePeriod);
    return totalBalance.mul(periodsSinceStart).div(releaseSchedule.numReleasePeriods);
  }

  /**
   * @notice A wrapper function for the lock gold method.
   * @param value The value of gold to be locked.
   */
  function lockGold(uint256 value) external nonReentrant onlyBeneficiaryAndNotRevoked {
    getLockedGold().lock.gas(gasleft()).value(value)();
  }

  /**
   * @notice A wrapper function for the unlock gold method function.
   * @param value The value of gold to be unlocked for the release schedule instance.
   */
  function unlockGold(uint256 value) external nonReentrant onlyWhenInProperState {
    getLockedGold().unlock(value);
  }

  /**
   * @notice A wrapper function for the relock locked gold method function.
   * @param index The index of the pending locked gold withdrawal.
   * @param value The value of gold to be relocked for the release schedule instance.
   */
  function relockGold(uint256 index, uint256 value)
    external
    nonReentrant
    onlyBeneficiaryAndNotRevoked
  {
    getLockedGold().relock(index, value);
  }

  /**
   * @notice A wrapper function for the withdraw locked gold method function.
   * @param index The index of the pending locked gold withdrawal.
   * @dev The amount shall be withdrawn back to the release schedule instance.
   */
  function withdrawLockedGold(uint256 index) external nonReentrant onlyWhenInProperState {
    getLockedGold().withdraw(index);
  }

  /**
   * @notice Funds a signer address so that transaction fees can be paid.
   * @param signer The signer address to fund.
   * @dev Note that this effectively decreases the total balance by 1 cGLD.
   */
  function fundSigner(address payable signer) private {
    // Fund signer account with 1 cGLD.
    uint256 value = 1 ether;
    require(address(this).balance >= value, "no available cGLD to fund signer");
    signer.transfer(value);
    require(getRemainingTotalBalance() > 0, "no remaining balance");
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
  function authorizeVoteSigner(address payable signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyCanVote
    onlyWhenInProperState
  {
    // If no previous signer has been authorized, fund the new signer so that tx fees can be paid.
    if (getAccounts().getVoteSigner(address(this)) == address(this)) {
      fundSigner(signer);
    }
    getAccounts().authorizeVoteSigner(signer, v, r, s);
  }

  /**
   * @notice A wrapper function for the authorize validator signer account method.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev The v,r and s signature should be a signed message by the beneficiary
   *      encrypting the authorized address.
   */
  function authorizeValidatorSigner(address payable signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyCanValidate
    onlyWhenInProperState
  {
    // If no previous signer has been authorized, fund the new signer so that tx fees can be paid.
    if (getAccounts().getValidatorSigner(address(this)) == address(this)) {
      fundSigner(signer);
    }
    getAccounts().authorizeValidatorSigner(signer, v, r, s);
  }

  /**
   * @notice A wrapper function for the authorize validator signer with public key account method.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @dev The v,r and s signature should be a signed message by the beneficiary
   *      encrypting the authorized address.
   */
  function authorizeValidatorSignerWithPublicKey(
    address payable signer,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes calldata ecdsaPublicKey
  ) external nonReentrant onlyCanValidate onlyWhenInProperState {
    // If no previous signer has been authorized, fund the new signer so that tx fees can be paid.
    if (getAccounts().getValidatorSigner(address(this)) == address(this)) {
      fundSigner(signer);
    }
    getAccounts().authorizeValidatorSignerWithPublicKey(signer, v, r, s, ecdsaPublicKey);
  }

  /**
   * @notice A wrapper function for the authorize validator signer with keys account method.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass
   *   proof of possession. 96 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 48 bytes.
   * @dev The v,r and s signature should be a signed message by the beneficiary
   *      encrypting the authorized address.
   */
  function authorizeValidatorSignerWithKeys(
    address payable signer,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes calldata ecdsaPublicKey,
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external nonReentrant onlyCanValidate onlyWhenInProperState {
    // If no previous signer has been authorized, fund the new signer so that tx fees can be paid.
    if (getAccounts().getValidatorSigner(address(this)) == address(this)) {
      fundSigner(signer);
    }
    getAccounts().authorizeValidatorSignerWithKeys(
      signer,
      v,
      r,
      s,
      ecdsaPublicKey,
      blsPublicKey,
      blsPop
    );
  }

  /**
   * @notice A wrapper function for the authorize attestation signer account method.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev The v,r and s signature should be a signed message by the beneficiary
   *      encrypting the authorized address.
   */
  function authorizeAttestationSigner(address payable signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyCanValidate
    onlyWhenInProperState
  {
    getAccounts().authorizeAttestationSigner(signer, v, r, s);
  }

  /**
   * @notice A convenience wrapper setter for the name, dataEncryptionKey
   *         and wallet address for an account.
   * @param name A string to set as the name of the account.
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Wallet address can be zero. This means that the owner of the wallet
   *      does not want to be paid directly without interaction, and instead wants users to
   *      contact them, using the data encryption key, and arrange a payment.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender` (unless the wallet address
   *      is 0x0 or msg.sender).
   */
  function setAccount(
    string calldata name,
    bytes calldata dataEncryptionKey,
    address walletAddress,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external onlyBeneficiaryAndNotRevoked {
    getAccounts().setAccount(name, dataEncryptionKey, walletAddress, v, r, s);
  }

  /**
   * @notice A wrapper setter function for creating an account.
   */
  function createAccount() external onlyCanVote onlyBeneficiaryAndNotRevoked {
    require(getAccounts().createAccount(), "Account creation failed");
  }

  /**
   * @notice A wrapper setter function for the name of an account.
   * @param name A string to set as the name of the account.
   */
  function setAccountName(string calldata name) external onlyBeneficiaryAndNotRevoked {
    getAccounts().setName(name);
  }

  /**
   * @notice A wrapper setter function for the wallet address of an account.
   * @param walletAddress The wallet address to set for the account.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Wallet address can be zero. This means that the owner of the wallet
   *      does not want to be paid directly without interaction, and instead wants users to
   *      contact them, using the data encryption key, and arrange a payment.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender` (unless the wallet address
   *      is 0x0 or msg.sender).
   */
  function setAccountWalletAddress(address walletAddress, uint8 v, bytes32 r, bytes32 s)
    external
    onlyBeneficiaryAndNotRevoked
  {
    getAccounts().setWalletAddress(walletAddress, v, r, s);
  }

  /**
   * @notice A wrapper setter function for the for the data encryption key
   *         and version of an account.
   * @param dataEncryptionKey Secp256k1 public key for data encryption.
   *                          Preferably compressed.
   */
  function setAccountDataEncryptionKey(bytes calldata dataEncryptionKey)
    external
    onlyBeneficiaryAndNotRevoked
  {
    getAccounts().setAccountDataEncryptionKey(dataEncryptionKey);
  }

  /**
   * @notice A wrapper setter function for the metadata of an account.
   * @param metadataURL The URL to access the metadata..
   */
  function setAccountMetadataURL(string calldata metadataURL)
    external
    onlyBeneficiaryAndNotRevoked
  {
    getAccounts().setMetadataURL(metadataURL);
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
    getElection().revokeActive(group, value, lesser, greater, index);
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
    getElection().revokePending(group, value, lesser, greater, index);
  }
}

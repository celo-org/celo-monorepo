pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IReleaseGoldInstance.sol";
import "../common/FixidityLib.sol";

import "../common/UsingRegistry.sol";

contract ReleaseGoldInstance is UsingRegistry, ReentrancyGuard, IReleaseGoldInstance {
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
    // Released gold instance balance at time of revocation.
    uint256 releasedBalanceAtRevoke;
    // The time at which the release schedule was revoked.
    uint256 revokeTime;
  }

  uint256 internal constant MAX_UINT = 0xffffffffffffffffffffffffffffffff;

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

  event ReleaseScheduleRevoked(uint256 revokeTimestamp, uint256 releasedBalanceAtRevoke);
  event DistributionLimitSet(address indexed beneficiary, uint256 maxDistribution);
  event LiquidityProvisionSet(address indexed beneficiary);

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

  function() external payable {} // solhint-disable no-empty-blocks

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
   * @param initialDistributionPercentage Percentage of total rewards available for distribution.
   *                                      Expressed to 3 significant figures [0, 1000].
   * @param _canValidate If this schedule's gold can be used for validating.
   * @param _canVote If this schedule's gold can be used for voting.
   * @param registryAddress Address of the deployed contracts registry.
   */
  constructor(
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
    uint256 initialDistributionPercentage,
    bool _canValidate,
    bool _canVote,
    address registryAddress
  ) public {
    releaseSchedule.numReleasePeriods = numReleasePeriods;
    releaseSchedule.amountReleasedPerPeriod = amountReleasedPerPeriod;
    releaseSchedule.releasePeriod = releasePeriod;
    releaseSchedule.releaseCliff = releaseStartTime.add(releaseCliffTime);
    releaseSchedule.releaseStartTime = releaseStartTime;
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
      releaseSchedule.releaseStartTime.add(
        releaseSchedule.numReleasePeriods.mul(releaseSchedule.releasePeriod)
      ) >
        block.timestamp,
      "Release schedule end time must be in the future"
    );
    require(!(revocable && _canValidate), "Revocable contracts cannot validate");
    require(initialDistributionPercentage <= 1000, "Initial distribution percentage out of bounds");
    require(
      (revocable && _refundAddress != address(0)) || (!revocable && _refundAddress == address(0)),
      "If contract is revocable there must be an address to refund"
    );

    setRegistry(registryAddress);
    beneficiary = _beneficiary;
    revocationInfo.revocable = revocable;
    releaseOwner = _releaseOwner;
    refundAddress = _refundAddress;

    if (initialDistributionPercentage < 1000) {
      // Cannot use `getTotalBalance()` here because the factory has not yet sent the gold.
      uint256 totalGrant = releaseSchedule.amountReleasedPerPeriod.mul(
        releaseSchedule.numReleasePeriods
      );
      // Initial percentage is expressed to 3 significant figures: [0, 1000].
      maxDistribution = totalGrant.mul(initialDistributionPercentage).div(1000);
    } else {
      maxDistribution = MAX_UINT;
    }

    liquidityProvisionMet = (subjectToLiquidityProvision) ? false : true;
    canValidate = _canValidate;
    canVote = _canVote;
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
   * @notice Controls the maximum distribution percentage.
   *         Calculates `distributionPercentage` of current `totalBalance()`
   *         and sets this value as the maximum allowed gold to be currently withdrawn.
   * @param distributionPercentage Percentage in range [0, 1000] (3 significant figures)
   *                               indicating % of total balance available for distribution.
   */
  function setMaxDistribution(uint256 distributionPercentage) external onlyReleaseOwner {
    require(distributionPercentage <= 1000, "Max distribution percentage must be within bounds");
    // If percentage is 100%, we set maxDistribution to maxUint to account for future rewards.
    if (distributionPercentage == 1000) {
      maxDistribution = MAX_UINT;
    } else {
      uint256 totalBalance = getTotalBalance();
      maxDistribution = totalBalance.mul(distributionPercentage).div(1000);
    }
    emit DistributionLimitSet(beneficiary, maxDistribution);
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
      maxDistribution >= totalWithdrawn + amount,
      "Requested amount exceeds current alloted maximum distribution"
    );
    require(
      getRemainingUnlockedBalance() >= amount,
      "Insufficient unlocked balance to withdraw amount"
    );
    totalWithdrawn = totalWithdrawn.add(amount);
    require(getGoldToken().transfer(beneficiary, amount), "Withdrawal of gold failed");
    if (getRemainingTotalBalance() == 0) {
      selfdestruct(refundAddress);
    }
  }

  /**
   * @notice Refund the releaseOwner and beneficiary after the release schedule has been revoked.
   */
  function refundAndFinalize() external nonReentrant onlyReleaseOwnerAndRevoked {
    require(getRemainingLockedBalance() == 0, "Total gold balance must be unlocked");
    uint256 beneficiaryAmount = revocationInfo.releasedBalanceAtRevoke.sub(totalWithdrawn);
    require(
      getGoldToken().transfer(beneficiary, beneficiaryAmount),
      "Transfer of gold to beneficiary failed"
    );
    uint256 revokerAmount = getRemainingUnlockedBalance();
    require(
      getGoldToken().transfer(refundAddress, revokerAmount),
      "Transfer of gold to refundAddress failed"
    );
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
   * @return The remaining locked gold of the release schedule instance.
   * @dev The returned amount may vary over time due to locked gold rewards.
   */
  function getRemainingLockedBalance() public view returns (uint256) {
    return getLockedGold().getAccountTotalLockedGold(address(this));
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
    onlyCanVote
    onlyWhenInProperState
  {
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
  function authorizeValidatorSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    onlyCanValidate
    onlyWhenInProperState
  {
    getAccounts().authorizeValidatorSigner(signer, v, r, s);
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
  function authorizeAttestationSigner(address signer, uint8 v, bytes32 r, bytes32 s)
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
   */
  function setAccount(string calldata name, bytes calldata dataEncryptionKey, address walletAddress)
    external
    onlyBeneficiaryAndNotRevoked
  {
    getAccounts().setAccount(name, dataEncryptionKey, walletAddress);
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
   */
  function setAccountWalletAddress(address walletAddress) external onlyBeneficiaryAndNotRevoked {
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

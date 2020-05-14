pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./interfaces/IValidators.sol";

import "../identity/interfaces/IRandom.sol";

import "../common/CalledByVm.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/AddressLinkedList.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title A contract for registering and electing Validator Groups and Validators.
 */
contract Validators is
  IValidators,
  Ownable,
  ReentrancyGuard,
  Initializable,
  UsingRegistry,
  UsingPrecompiles,
  CalledByVm
{
  using FixidityLib for FixidityLib.Fraction;
  using AddressLinkedList for LinkedList.List;
  using SafeMath for uint256;
  using BytesLib for bytes;

  // For Validators, these requirements must be met in order to:
  //   1. Register a validator
  //   2. Affiliate with and be added to a group
  //   3. Receive epoch payments (note that the group must meet the group requirements as well)
  // Accounts may de-register their Validator `duration` seconds after they were last a member of a
  // group, after which no restrictions on Locked Gold will apply to the account.
  //
  // For Validator Groups, these requirements must be met in order to:
  //   1. Register a group
  //   2. Add a member to a group
  //   3. Receive epoch payments
  // Note that for groups, the requirement value is multiplied by the number of members, and is
  // enforced for `duration` seconds after the group last had that number of members.
  // Accounts may de-register their Group `duration` seconds after they were last non-empty, after
  // which no restrictions on Locked Gold will apply to the account.
  struct LockedGoldRequirements {
    uint256 value;
    // In seconds.
    uint256 duration;
  }

  struct ValidatorGroup {
    bool exists;
    LinkedList.List members;
    FixidityLib.Fraction commission;
    FixidityLib.Fraction nextCommission;
    uint256 nextCommissionBlock;
    // sizeHistory[i] contains the last time the group contained i members.
    uint256[] sizeHistory;
    SlashingInfo slashInfo;
  }

  // Stores the epoch number at which a validator joined a particular group.
  struct MembershipHistoryEntry {
    uint256 epochNumber;
    address group;
  }

  // Stores the per-epoch membership history of a validator, used to determine which group
  // commission should be paid to at the end of an epoch.
  // Stores a timestamp of the last time the validator was removed from a group, used to determine
  // whether or not a group can de-register.
  struct MembershipHistory {
    // The key to the most recent entry in the entries mapping.
    uint256 tail;
    // The number of entries in this validators membership history.
    uint256 numEntries;
    mapping(uint256 => MembershipHistoryEntry) entries;
    uint256 lastRemovedFromGroupTimestamp;
  }

  struct SlashingInfo {
    FixidityLib.Fraction multiplier;
    uint256 lastSlashed;
  }

  struct PublicKeys {
    bytes ecdsa;
    bytes bls;
  }

  struct Validator {
    PublicKeys publicKeys;
    address affiliation;
    FixidityLib.Fraction score;
    MembershipHistory membershipHistory;
  }

  // Parameters that govern the calculation of validator's score.
  struct ValidatorScoreParameters {
    uint256 exponent;
    FixidityLib.Fraction adjustmentSpeed;
  }

  mapping(address => ValidatorGroup) private groups;
  mapping(address => Validator) private validators;
  address[] private registeredGroups;
  address[] private registeredValidators;
  LockedGoldRequirements public validatorLockedGoldRequirements;
  LockedGoldRequirements public groupLockedGoldRequirements;
  ValidatorScoreParameters private validatorScoreParameters;
  uint256 public membershipHistoryLength;
  uint256 public maxGroupSize;
  // The number of blocks to delay a ValidatorGroup's commission update
  uint256 public commissionUpdateDelay;
  uint256 public slashingMultiplierResetPeriod;

  event MaxGroupSizeSet(uint256 size);
  event CommissionUpdateDelaySet(uint256 delay);
  event ValidatorScoreParametersSet(uint256 exponent, uint256 adjustmentSpeed);
  event GroupLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event ValidatorLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event MembershipHistoryLengthSet(uint256 length);
  event ValidatorRegistered(address indexed validator);
  event ValidatorDeregistered(address indexed validator);
  event ValidatorAffiliated(address indexed validator, address indexed group);
  event ValidatorDeaffiliated(address indexed validator, address indexed group);
  event ValidatorEcdsaPublicKeyUpdated(address indexed validator, bytes ecdsaPublicKey);
  event ValidatorBlsPublicKeyUpdated(address indexed validator, bytes blsPublicKey);
  event ValidatorScoreUpdated(address indexed validator, uint256 score, uint256 epochScore);
  event ValidatorGroupRegistered(address indexed group, uint256 commission);
  event ValidatorGroupDeregistered(address indexed group);
  event ValidatorGroupMemberAdded(address indexed group, address indexed validator);
  event ValidatorGroupMemberRemoved(address indexed group, address indexed validator);
  event ValidatorGroupMemberReordered(address indexed group, address indexed validator);
  event ValidatorGroupCommissionUpdateQueued(
    address indexed group,
    uint256 commission,
    uint256 activationBlock
  );
  event ValidatorGroupCommissionUpdated(address indexed group, uint256 commission);
  event ValidatorEpochPaymentDistributed(
    address indexed validator,
    uint256 validatorPayment,
    address indexed group,
    uint256 groupPayment
  );

  modifier onlySlasher() {
    require(getLockedGold().isSlasher(msg.sender), "Only registered slasher can call");
    _;
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param groupRequirementValue The Locked Gold requirement amount for groups.
   * @param groupRequirementDuration The Locked Gold requirement duration for groups.
   * @param validatorRequirementValue The Locked Gold requirement amount for validators.
   * @param validatorRequirementDuration The Locked Gold requirement duration for validators.
   * @param validatorScoreExponent The exponent used in calculating validator scores.
   * @param validatorScoreAdjustmentSpeed The speed at which validator scores are adjusted.
   * @param _membershipHistoryLength The max number of entries for validator membership history.
   * @param _maxGroupSize The maximum group size.
   * @param _commissionUpdateDelay The number of blocks to delay a ValidatorGroup's commission
   * update.
   * @dev Should be called only once.
   */
  function initialize(
    address registryAddress,
    uint256 groupRequirementValue,
    uint256 groupRequirementDuration,
    uint256 validatorRequirementValue,
    uint256 validatorRequirementDuration,
    uint256 validatorScoreExponent,
    uint256 validatorScoreAdjustmentSpeed,
    uint256 _membershipHistoryLength,
    uint256 _slashingMultiplierResetPeriod,
    uint256 _maxGroupSize,
    uint256 _commissionUpdateDelay
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setGroupLockedGoldRequirements(groupRequirementValue, groupRequirementDuration);
    setValidatorLockedGoldRequirements(validatorRequirementValue, validatorRequirementDuration);
    setValidatorScoreParameters(validatorScoreExponent, validatorScoreAdjustmentSpeed);
    setMaxGroupSize(_maxGroupSize);
    setCommissionUpdateDelay(_commissionUpdateDelay);
    setMembershipHistoryLength(_membershipHistoryLength);
    setSlashingMultiplierResetPeriod(_slashingMultiplierResetPeriod);
  }

  /**
   * @notice Updates the block delay for a ValidatorGroup's commission udpdate
   * @param delay Number of blocks to delay the update
   */
  function setCommissionUpdateDelay(uint256 delay) public onlyOwner {
    require(delay != commissionUpdateDelay, "commission update delay not changed");
    commissionUpdateDelay = delay;
    emit CommissionUpdateDelaySet(delay);
  }

  /**
   * @notice Updates the maximum number of members a group can have.
   * @param size The maximum group size.
   * @return True upon success.
   */
  function setMaxGroupSize(uint256 size) public onlyOwner returns (bool) {
    require(0 < size, "Max group size cannot be zero");
    require(size != maxGroupSize, "Max group size not changed");
    maxGroupSize = size;
    emit MaxGroupSizeSet(size);
    return true;
  }

  /**
   * @notice Updates the number of validator group membership entries to store.
   * @param length The number of validator group membership entries to store.
   * @return True upon success.
   */
  function setMembershipHistoryLength(uint256 length) public onlyOwner returns (bool) {
    require(0 < length, "Membership history length cannot be zero");
    require(length != membershipHistoryLength, "Membership history length not changed");
    membershipHistoryLength = length;
    emit MembershipHistoryLengthSet(length);
    return true;
  }

  /**
   * @notice Updates the validator score parameters.
   * @param exponent The exponent used in calculating the score.
   * @param adjustmentSpeed The speed at which the score is adjusted.
   * @return True upon success.
   */
  function setValidatorScoreParameters(uint256 exponent, uint256 adjustmentSpeed)
    public
    onlyOwner
    returns (bool)
  {
    require(
      adjustmentSpeed <= FixidityLib.fixed1().unwrap(),
      "Adjustment speed cannot be larger than 1"
    );
    require(
      exponent != validatorScoreParameters.exponent ||
        !FixidityLib.wrap(adjustmentSpeed).equals(validatorScoreParameters.adjustmentSpeed),
      "Adjustment speed and exponent not changed"
    );
    validatorScoreParameters = ValidatorScoreParameters(
      exponent,
      FixidityLib.wrap(adjustmentSpeed)
    );
    emit ValidatorScoreParametersSet(exponent, adjustmentSpeed);
    return true;
  }

  /**
   * @notice Returns the maximum number of members a group can add.
   * @return The maximum number of members a group can add.
   */
  function getMaxGroupSize() external view returns (uint256) {
    return maxGroupSize;
  }

  /**
   * @notice Returns the block delay for a ValidatorGroup's commission udpdate.
   * @return The block delay for a ValidatorGroup's commission udpdate.
   */
  function getCommissionUpdateDelay() external view returns (uint256) {
    return commissionUpdateDelay;
  }

  /**
   * @notice Updates the Locked Gold requirements for Validator Groups.
   * @param value The per-member amount of Locked Gold required.
   * @param duration The time (in seconds) that these requirements persist for.
   * @return True upon success.
   */
  function setGroupLockedGoldRequirements(uint256 value, uint256 duration)
    public
    onlyOwner
    returns (bool)
  {
    LockedGoldRequirements storage requirements = groupLockedGoldRequirements;
    require(
      value != requirements.value || duration != requirements.duration,
      "Group requirements not changed"
    );
    groupLockedGoldRequirements = LockedGoldRequirements(value, duration);
    emit GroupLockedGoldRequirementsSet(value, duration);
    return true;
  }

  /**
   * @notice Updates the Locked Gold requirements for Validators.
   * @param value The amount of Locked Gold required.
   * @param duration The time (in seconds) that these requirements persist for.
   * @return True upon success.
   */
  function setValidatorLockedGoldRequirements(uint256 value, uint256 duration)
    public
    onlyOwner
    returns (bool)
  {
    LockedGoldRequirements storage requirements = validatorLockedGoldRequirements;
    require(
      value != requirements.value || duration != requirements.duration,
      "Validator requirements not changed"
    );
    validatorLockedGoldRequirements = LockedGoldRequirements(value, duration);
    emit ValidatorLockedGoldRequirementsSet(value, duration);
    return true;
  }

  /**
   * @notice Registers a validator unaffiliated with any validator group.
   * @param ecdsaPublicKey The ECDSA public key that the validator is using for consensus, should
   *   match the validator signer. 64 bytes.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass
   *   proof of possession. 96 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 48 bytes.
   * @return True upon success.
   * @dev Fails if the account is already a validator or validator group.
   * @dev Fails if the account does not have sufficient Locked Gold.
   */
  function registerValidator(
    bytes calldata ecdsaPublicKey,
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(!isValidator(account) && !isValidatorGroup(account), "Already registered");
    uint256 lockedGoldBalance = getLockedGold().getAccountTotalLockedGold(account);
    require(lockedGoldBalance >= validatorLockedGoldRequirements.value, "Deposit too small");
    Validator storage validator = validators[account];
    address signer = getAccounts().getValidatorSigner(account);
    _updateEcdsaPublicKey(validator, account, signer, ecdsaPublicKey);
    _updateBlsPublicKey(validator, account, blsPublicKey, blsPop);
    registeredValidators.push(account);
    updateMembershipHistory(account, address(0));
    emit ValidatorRegistered(account);
    return true;
  }

  /**
   * @notice Returns the parameters that govern how a validator's score is calculated.
   * @return The parameters that goven how a validator's score is calculated.
   */
  function getValidatorScoreParameters() external view returns (uint256, uint256) {
    return (validatorScoreParameters.exponent, validatorScoreParameters.adjustmentSpeed.unwrap());
  }

  /**
   * @notice Returns the group membership history of a validator.
   * @param account The validator whose membership history to return.
   * @return The group membership history of a validator.
   */
  function getMembershipHistory(address account)
    external
    view
    returns (uint256[] memory, address[] memory, uint256, uint256)
  {
    MembershipHistory storage history = validators[account].membershipHistory;
    uint256[] memory epochs = new uint256[](history.numEntries);
    address[] memory membershipGroups = new address[](history.numEntries);
    for (uint256 i = 0; i < history.numEntries; i = i.add(1)) {
      uint256 index = history.tail.add(i);
      epochs[i] = history.entries[index].epochNumber;
      membershipGroups[i] = history.entries[index].group;
    }
    return (epochs, membershipGroups, history.lastRemovedFromGroupTimestamp, history.tail);
  }

  /**
   * @notice Calculates the validator score for an epoch from the uptime value for the epoch.
   * @param uptime The Fixidity representation of the validator's uptime, between 0 and 1.
   * @dev epoch_score = uptime ** exponent
   * @return Fixidity representation of the epoch score between 0 and 1.
   */
  function calculateEpochScore(uint256 uptime) public view returns (uint256) {
    require(uptime <= FixidityLib.fixed1().unwrap(), "Uptime cannot be larger than one");
    uint256 numerator;
    uint256 denominator;
    (numerator, denominator) = fractionMulExp(
      FixidityLib.fixed1().unwrap(),
      FixidityLib.fixed1().unwrap(),
      uptime,
      FixidityLib.fixed1().unwrap(),
      validatorScoreParameters.exponent,
      18
    );
    return FixidityLib.newFixedFraction(numerator, denominator).unwrap();
  }

  /**
   * @notice Calculates the aggregate score of a group for an epoch from individual uptimes.
   * @param uptimes Array of Fixidity representations of the validators' uptimes, between 0 and 1.
   * @dev group_score = average(uptimes ** exponent)
   * @return Fixidity representation of the group epoch score between 0 and 1.
   */
  function calculateGroupEpochScore(uint256[] calldata uptimes) external view returns (uint256) {
    require(uptimes.length > 0, "Uptime array empty");
    require(uptimes.length <= maxGroupSize, "Uptime array larger than maximum group size");
    FixidityLib.Fraction memory sum;
    for (uint256 i = 0; i < uptimes.length; i = i.add(1)) {
      sum = sum.add(FixidityLib.wrap(calculateEpochScore(uptimes[i])));
    }
    return sum.divide(FixidityLib.newFixed(uptimes.length)).unwrap();
  }

  /**
   * @notice Updates a validator's score based on its uptime for the epoch.
   * @param signer The validator signer of the validator account whose score needs updating.
   * @param uptime The Fixidity representation of the validator's uptime, between 0 and 1.
   * @return True upon success.
   */
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) external onlyVm() {
    _updateValidatorScoreFromSigner(signer, uptime);
  }

  /**
   * @notice Updates a validator's score based on its uptime for the epoch.
   * @param signer The validator signer of the validator whose score needs updating.
   * @param uptime The Fixidity representation of the validator's uptime, between 0 and 1.
   * @dev new_score = uptime ** exponent * adjustmentSpeed + old_score * (1 - adjustmentSpeed)
   * @return True upon success.
   */
  function _updateValidatorScoreFromSigner(address signer, uint256 uptime) internal {
    address account = getAccounts().signerToAccount(signer);
    require(isValidator(account), "Not a validator");

    FixidityLib.Fraction memory epochScore = FixidityLib.wrap(calculateEpochScore(uptime));
    FixidityLib.Fraction memory newComponent = validatorScoreParameters.adjustmentSpeed.multiply(
      epochScore
    );

    FixidityLib.Fraction memory currentComponent = FixidityLib.fixed1().subtract(
      validatorScoreParameters.adjustmentSpeed
    );
    currentComponent = currentComponent.multiply(validators[account].score);
    validators[account].score = FixidityLib.wrap(
      Math.min(epochScore.unwrap(), newComponent.add(currentComponent).unwrap())
    );
    emit ValidatorScoreUpdated(account, validators[account].score.unwrap(), epochScore.unwrap());
  }

  /**
   * @notice Distributes epoch payments to the account associated with `signer` and its group.
   * @param signer The validator signer of the account to distribute the epoch payment to.
   * @param maxPayment The maximum payment to the validator. Actual payment is based on score and
   *   group commission.
   * @return The total payment paid to the validator and their group.
   */
  function distributeEpochPaymentsFromSigner(address signer, uint256 maxPayment)
    external
    onlyVm()
    returns (uint256)
  {
    return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }

  /**
   * @notice Distributes epoch payments to the account associated with `signer` and its group.
   * @param signer The validator signer of the validator to distribute the epoch payment to.
   * @param maxPayment The maximum payment to the validator. Actual payment is based on score and
   *   group commission.
   * @return The total payment paid to the validator and their group.
   */
  function _distributeEpochPaymentsFromSigner(address signer, uint256 maxPayment)
    internal
    returns (uint256)
  {
    address account = getAccounts().signerToAccount(signer);
    require(isValidator(account), "Not a validator");
    // The group that should be paid is the group that the validator was a member of at the
    // time it was elected.
    address group = getMembershipInLastEpoch(account);
    require(group != address(0), "Validator not registered with a group");
    // Both the validator and the group must maintain the minimum locked gold balance in order to
    // receive epoch payments.
    if (meetsAccountLockedGoldRequirements(account) && meetsAccountLockedGoldRequirements(group)) {
      FixidityLib.Fraction memory totalPayment = FixidityLib
        .newFixed(maxPayment)
        .multiply(validators[account].score)
        .multiply(groups[group].slashInfo.multiplier);
      uint256 groupPayment = totalPayment.multiply(groups[group].commission).fromFixed();
      uint256 validatorPayment = totalPayment.fromFixed().sub(groupPayment);
      getStableToken().mint(group, groupPayment);
      getStableToken().mint(account, validatorPayment);
      emit ValidatorEpochPaymentDistributed(account, validatorPayment, group, groupPayment);
      return totalPayment.fromFixed();
    } else {
      return 0;
    }
  }

  /**
   * @notice De-registers a validator.
   * @param index The index of this validator in the list of all registered validators.
   * @return True upon success.
   * @dev Fails if the account is not a validator.
   * @dev Fails if the validator has been a member of a group too recently.
   */
  function deregisterValidator(uint256 index) external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidator(account), "Not a validator");

    // Require that the validator has not been a member of a validator group for
    // `validatorLockedGoldRequirements.duration` seconds.
    Validator storage validator = validators[account];
    if (validator.affiliation != address(0)) {
      require(
        !groups[validator.affiliation].members.contains(account),
        "Has been group member recently"
      );
    }
    uint256 requirementEndTime = validator.membershipHistory.lastRemovedFromGroupTimestamp.add(
      validatorLockedGoldRequirements.duration
    );
    require(requirementEndTime < now, "Not yet requirement end time");

    // Remove the validator.
    deleteElement(registeredValidators, account, index);
    delete validators[account];
    emit ValidatorDeregistered(account);
    return true;
  }

  /**
   * @notice Affiliates a validator with a group, allowing it to be added as a member.
   * @param group The validator group with which to affiliate.
   * @return True upon success.
   * @dev De-affiliates with the previously affiliated group if present.
   */
  function affiliate(address group) external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidator(account), "Not a validator");
    require(isValidatorGroup(group), "Not a validator group");
    require(meetsAccountLockedGoldRequirements(account), "Validator doesn't meet requirements");
    require(meetsAccountLockedGoldRequirements(group), "Group doesn't meet requirements");
    Validator storage validator = validators[account];
    if (validator.affiliation != address(0)) {
      _deaffiliate(validator, account);
    }
    validator.affiliation = group;
    emit ValidatorAffiliated(account, group);
    return true;
  }

  /**
   * @notice De-affiliates a validator, removing it from the group for which it is a member.
   * @return True upon success.
   * @dev Fails if the account is not a validator with non-zero affiliation.
   */
  function deaffiliate() external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidator(account), "Not a validator");
    Validator storage validator = validators[account];
    require(validator.affiliation != address(0), "deaffiliate: not affiliated");
    _deaffiliate(validator, account);
    return true;
  }

  /**
   * @notice Updates a validator's BLS key.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass
   *   proof of possession. 48 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 48 bytes.
   * @return True upon success.
   */
  function updateBlsPublicKey(bytes calldata blsPublicKey, bytes calldata blsPop)
    external
    returns (bool)
  {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidator(account), "Not a validator");
    Validator storage validator = validators[account];
    require(
      _updateBlsPublicKey(validator, account, blsPublicKey, blsPop),
      "Error updating BLS public key"
    );
    return true;
  }

  /**
   * @notice Updates a validator's BLS key.
   * @param validator The validator whose BLS public key should be updated.
   * @param account The address under which the validator is registered.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass
   *   proof of possession. 96 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 48 bytes.
   * @return True upon success.
   */
  function _updateBlsPublicKey(
    Validator storage validator,
    address account,
    bytes memory blsPublicKey,
    bytes memory blsPop
  ) private returns (bool) {
    require(blsPublicKey.length == 96, "Wrong BLS public key length");
    require(blsPop.length == 48, "Wrong BLS PoP length");
    require(checkProofOfPossession(account, blsPublicKey, blsPop), "Invalid BLS PoP");
    validator.publicKeys.bls = blsPublicKey;
    emit ValidatorBlsPublicKeyUpdated(account, blsPublicKey);
    return true;
  }

  /**
   * @notice Updates a validator's ECDSA key.
   * @param account The address under which the validator is registered.
   * @param signer The address which the validator is using to sign consensus messages.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @return True upon success.
   */
  function updateEcdsaPublicKey(address account, address signer, bytes calldata ecdsaPublicKey)
    external
    onlyRegisteredContract(ACCOUNTS_REGISTRY_ID)
    returns (bool)
  {
    require(isValidator(account), "Not a validator");
    Validator storage validator = validators[account];
    require(
      _updateEcdsaPublicKey(validator, account, signer, ecdsaPublicKey),
      "Error updating ECDSA public key"
    );
    return true;
  }

  /**
   * @notice Updates a validator's ECDSA key.
   * @param validator The validator whose ECDSA public key should be updated.
   * @param signer The address with which the validator is signing consensus messages.
   * @param ecdsaPublicKey The ECDSA public key that the validator is using for consensus. Should
   *   match `signer`. 64 bytes.
   * @return True upon success.
   */
  function _updateEcdsaPublicKey(
    Validator storage validator,
    address account,
    address signer,
    bytes memory ecdsaPublicKey
  ) private returns (bool) {
    require(ecdsaPublicKey.length == 64, "Wrong ECDSA public key length");
    require(
      address(uint160(uint256(keccak256(ecdsaPublicKey)))) == signer,
      "ECDSA key does not match signer"
    );
    validator.publicKeys.ecdsa = ecdsaPublicKey;
    emit ValidatorEcdsaPublicKeyUpdated(account, ecdsaPublicKey);
    return true;
  }

  /**
   * @notice Updates a validator's ECDSA and BLS keys.
   * @param account The address under which the validator is registered.
   * @param signer The address which the validator is using to sign consensus messages.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass
   *   proof of possession. 96 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 48 bytes.
   * @return True upon success.
   */
  function updatePublicKeys(
    address account,
    address signer,
    bytes calldata ecdsaPublicKey,
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external onlyRegisteredContract(ACCOUNTS_REGISTRY_ID) returns (bool) {
    require(isValidator(account), "Not a validator");
    Validator storage validator = validators[account];
    require(
      _updateEcdsaPublicKey(validator, account, signer, ecdsaPublicKey),
      "Error updating ECDSA public key"
    );
    require(
      _updateBlsPublicKey(validator, account, blsPublicKey, blsPop),
      "Error updating BLS public key"
    );
    return true;
  }

  /**
   * @notice Registers a validator group with no member validators.
   * @param commission Fixidity representation of the commission this group receives on epoch
   *   payments made to its members.
   * @return True upon success.
   * @dev Fails if the account is already a validator or validator group.
   * @dev Fails if the account does not have sufficient weight.
   */
  function registerValidatorGroup(uint256 commission) external nonReentrant returns (bool) {
    require(commission <= FixidityLib.fixed1().unwrap(), "Commission can't be greater than 100%");
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(!isValidator(account), "Already registered as validator");
    require(!isValidatorGroup(account), "Already registered as group");
    uint256 lockedGoldBalance = getLockedGold().getAccountTotalLockedGold(account);
    require(lockedGoldBalance >= groupLockedGoldRequirements.value, "Not enough locked gold");
    ValidatorGroup storage group = groups[account];
    group.exists = true;
    group.commission = FixidityLib.wrap(commission);
    group.slashInfo = SlashingInfo(FixidityLib.fixed1(), 0);
    registeredGroups.push(account);
    emit ValidatorGroupRegistered(account, commission);
    return true;
  }

  /**
   * @notice De-registers a validator group.
   * @param index The index of this validator group in the list of all validator groups.
   * @return True upon success.
   * @dev Fails if the account is not a validator group with no members.
   * @dev Fails if the group has had members too recently.
   */
  function deregisterValidatorGroup(uint256 index) external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    // Only Validator Groups that have never had members or have been empty for at least
    // `groupLockedGoldRequirements.duration` seconds can be deregistered.
    require(isValidatorGroup(account), "Not a validator group");
    require(groups[account].members.numElements == 0, "Validator group not empty");
    uint256[] storage sizeHistory = groups[account].sizeHistory;
    if (sizeHistory.length > 1) {
      require(
        sizeHistory[1].add(groupLockedGoldRequirements.duration) < now,
        "Hasn't been empty for long enough"
      );
    }
    delete groups[account];
    deleteElement(registeredGroups, account, index);
    emit ValidatorGroupDeregistered(account);
    return true;
  }

  /**
   * @notice Adds a member to the end of a validator group's list of members.
   * @param validator The validator to add to the group
   * @return True upon success.
   * @dev Fails if `validator` has not set their affiliation to this account.
   * @dev Fails if the group has zero members.
   */
  function addMember(address validator) external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(groups[account].members.numElements > 0, "Validator group empty");
    return _addMember(account, validator, address(0), address(0));
  }

  /**
   * @notice Adds the first member to a group's list of members and marks it eligible for election.
   * @param validator The validator to add to the group
   * @param lesser The address of the group that has received fewer votes than this group.
   * @param greater The address of the group that has received more votes than this group.
   * @return True upon success.
   * @dev Fails if `validator` has not set their affiliation to this account.
   * @dev Fails if the group has > 0 members.
   */
  function addFirstMember(address validator, address lesser, address greater)
    external
    nonReentrant
    returns (bool)
  {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(groups[account].members.numElements == 0, "Validator group not empty");
    return _addMember(account, validator, lesser, greater);
  }

  /**
   * @notice Adds a member to the end of a validator group's list of members.
   * @param group The address of the validator group.
   * @param validator The validator to add to the group.
   * @param lesser The address of the group that has received fewer votes than this group.
   * @param greater The address of the group that has received more votes than this group.
   * @return True upon success.
   * @dev Fails if `validator` has not set their affiliation to this account.
   * @dev Fails if the group has > 0 members.
   */
  function _addMember(address group, address validator, address lesser, address greater)
    private
    returns (bool)
  {
    require(isValidatorGroup(group) && isValidator(validator), "Not validator and group");
    ValidatorGroup storage _group = groups[group];
    require(_group.members.numElements < maxGroupSize, "group would exceed maximum size");
    require(validators[validator].affiliation == group, "Not affiliated to group");
    require(!_group.members.contains(validator), "Already in group");
    uint256 numMembers = _group.members.numElements.add(1);
    _group.members.push(validator);
    require(meetsAccountLockedGoldRequirements(group), "Group requirements not met");
    require(meetsAccountLockedGoldRequirements(validator), "Validator requirements not met");
    if (numMembers == 1) {
      getElection().markGroupEligible(group, lesser, greater);
    }
    updateMembershipHistory(validator, group);
    updateSizeHistory(group, numMembers.sub(1));
    emit ValidatorGroupMemberAdded(group, validator);
    return true;
  }

  /**
   * @notice Removes a member from a validator group.
   * @param validator The validator to remove from the group
   * @return True upon success.
   * @dev Fails if `validator` is not a member of the account's group.
   */
  function removeMember(address validator) external nonReentrant returns (bool) {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidatorGroup(account) && isValidator(validator), "is not group and validator");
    return _removeMember(account, validator);
  }

  /**
   * @notice Reorders a member within a validator group.
   * @param validator The validator to reorder.
   * @param lesserMember The member who will be behind `validator`, or 0 if `validator` will be the
   *   last member.
   * @param greaterMember The member who will be ahead of `validator`, or 0 if `validator` will be
   *   the first member.
   * @return True upon success.
   * @dev Fails if `validator` is not a member of the account's validator group.
   */
  function reorderMember(address validator, address lesserMember, address greaterMember)
    external
    nonReentrant
    returns (bool)
  {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidatorGroup(account), "Not a group");
    require(isValidator(validator), "Not a validator");
    ValidatorGroup storage group = groups[account];
    require(group.members.contains(validator), "Not a member of the group");
    group.members.update(validator, lesserMember, greaterMember);
    emit ValidatorGroupMemberReordered(account, validator);
    return true;
  }

  /**
   * @notice Queues an update to a validator group's commission.
   * If there was a previously scheduled update, that is overwritten.
   * @param commission Fixidity representation of the commission this group receives on epoch
   *   payments made to its members. Must be in the range [0, 1.0].
   */
  function setNextCommissionUpdate(uint256 commission) external {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidatorGroup(account), "Not a validator group");
    ValidatorGroup storage group = groups[account];
    require(commission <= FixidityLib.fixed1().unwrap(), "Commission can't be greater than 100%");
    require(commission != group.commission.unwrap(), "Commission must be different");

    group.nextCommission = FixidityLib.wrap(commission);
    group.nextCommissionBlock = block.number.add(commissionUpdateDelay);
    emit ValidatorGroupCommissionUpdateQueued(account, commission, group.nextCommissionBlock);
  }
  /**
   * @notice Updates a validator group's commission based on the previously queued update
   */
  function updateCommission() external {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidatorGroup(account), "Not a validator group");
    ValidatorGroup storage group = groups[account];

    require(group.nextCommissionBlock != 0, "No commission update queued");
    require(group.nextCommissionBlock <= block.number, "Can't apply commission update yet");

    group.commission = group.nextCommission;
    delete group.nextCommission;
    delete group.nextCommissionBlock;
    emit ValidatorGroupCommissionUpdated(account, group.commission.unwrap());
  }

  /**
   * @notice Returns the current locked gold balance requirement for the supplied account.
   * @param account The account that may have to meet locked gold balance requirements.
   * @return The current locked gold balance requirement for the supplied account.
   */
  function getAccountLockedGoldRequirement(address account) public view returns (uint256) {
    if (isValidator(account)) {
      return validatorLockedGoldRequirements.value;
    } else if (isValidatorGroup(account)) {
      uint256 multiplier = Math.max(1, groups[account].members.numElements);
      uint256[] storage sizeHistory = groups[account].sizeHistory;
      if (sizeHistory.length > 0) {
        for (uint256 i = sizeHistory.length.sub(1); i > 0; i = i.sub(1)) {
          if (sizeHistory[i].add(groupLockedGoldRequirements.duration) >= now) {
            multiplier = Math.max(i, multiplier);
            break;
          }
        }
      }
      return groupLockedGoldRequirements.value.mul(multiplier);
    }
    return 0;
  }

  /**
   * @notice Returns whether or not an account meets its Locked Gold requirements.
   * @param account The address of the account.
   * @return Whether or not an account meets its Locked Gold requirements.
   */
  function meetsAccountLockedGoldRequirements(address account) public view returns (bool) {
    uint256 balance = getLockedGold().getAccountTotalLockedGold(account);
    return balance >= getAccountLockedGoldRequirement(account);
  }

  /**
   * @notice Returns the validator BLS key.
   * @param signer The account that registered the validator or its authorized signing address.
   * @return The validator BLS key.
   */
  function getValidatorBlsPublicKeyFromSigner(address signer)
    external
    view
    returns (bytes memory blsPublicKey)
  {
    address account = getAccounts().signerToAccount(signer);
    require(isValidator(account), "Not a validator");
    return validators[account].publicKeys.bls;
  }

  /**
   * @notice Returns validator information.
   * @param account The account that registered the validator.
   * @return The unpacked validator struct.
   */
  function getValidator(address account)
    public
    view
    returns (
      bytes memory ecdsaPublicKey,
      bytes memory blsPublicKey,
      address affiliation,
      uint256 score,
      address signer
    )
  {
    require(isValidator(account), "Not a validator");
    Validator storage validator = validators[account];
    return (
      validator.publicKeys.ecdsa,
      validator.publicKeys.bls,
      validator.affiliation,
      validator.score.unwrap(),
      getAccounts().getValidatorSigner(account)
    );
  }

  /**
   * @notice Returns validator group information.
   * @param account The account that registered the validator group.
   * @return The unpacked validator group struct.
   */
  function getValidatorGroup(address account)
    external
    view
    returns (address[] memory, uint256, uint256, uint256, uint256[] memory, uint256, uint256)
  {
    require(isValidatorGroup(account), "Not a validator group");
    ValidatorGroup storage group = groups[account];
    return (
      group.members.getKeys(),
      group.commission.unwrap(),
      group.nextCommission.unwrap(),
      group.nextCommissionBlock,
      group.sizeHistory,
      group.slashInfo.multiplier.unwrap(),
      group.slashInfo.lastSlashed
    );
  }

  /**
   * @notice Returns the number of members in a validator group.
   * @param account The address of the validator group.
   * @return The number of members in a validator group.
   */
  function getGroupNumMembers(address account) public view returns (uint256) {
    require(isValidatorGroup(account), "Not validator group");
    return groups[account].members.numElements;
  }

  /**
   * @notice Returns the top n group members for a particular group.
   * @param account The address of the validator group.
   * @param n The number of members to return.
   * @return The top n group members for a particular group.
   */
  function getTopGroupValidators(address account, uint256 n)
    external
    view
    returns (address[] memory)
  {
    address[] memory topAccounts = groups[account].members.headN(n);
    address[] memory topValidators = new address[](n);
    for (uint256 i = 0; i < n; i = i.add(1)) {
      topValidators[i] = getAccounts().getValidatorSigner(topAccounts[i]);
    }
    return topValidators;
  }

  /**
   * @notice Returns the number of members in the provided validator groups.
   * @param accounts The addresses of the validator groups.
   * @return The number of members in the provided validator groups.
   */
  function getGroupsNumMembers(address[] calldata accounts)
    external
    view
    returns (uint256[] memory)
  {
    uint256[] memory numMembers = new uint256[](accounts.length);
    for (uint256 i = 0; i < accounts.length; i = i.add(1)) {
      numMembers[i] = getGroupNumMembers(accounts[i]);
    }
    return numMembers;
  }

  /**
   * @notice Returns the number of registered validators.
   * @return The number of registered validators.
   */
  function getNumRegisteredValidators() external view returns (uint256) {
    return registeredValidators.length;
  }

  /**
   * @notice Returns the Locked Gold requirements for validators.
   * @return The Locked Gold requirements for validators.
   */
  function getValidatorLockedGoldRequirements() external view returns (uint256, uint256) {
    return (validatorLockedGoldRequirements.value, validatorLockedGoldRequirements.duration);
  }

  /**
   * @notice Returns the Locked Gold requirements for validator groups.
   * @return The Locked Gold requirements for validator groups.
   */
  function getGroupLockedGoldRequirements() external view returns (uint256, uint256) {
    return (groupLockedGoldRequirements.value, groupLockedGoldRequirements.duration);
  }

  /**
   * @notice Returns the list of registered validator accounts.
   * @return The list of registered validator accounts.
   */
  function getRegisteredValidators() external view returns (address[] memory) {
    return registeredValidators;
  }

  /**
   * @notice Returns the list of signers for the registered validator accounts.
   * @return The list of signers for registered validator accounts.
   */
  function getRegisteredValidatorSigners() external view returns (address[] memory) {
    IAccounts accounts = getAccounts();
    address[] memory signers = new address[](registeredValidators.length);
    for (uint256 i = 0; i < signers.length; i = i.add(1)) {
      signers[i] = accounts.getValidatorSigner(registeredValidators[i]);
    }
    return signers;
  }

  /**
   * @notice Returns the list of registered validator group accounts.
   * @return The list of registered validator group addresses.
   */
  function getRegisteredValidatorGroups() external view returns (address[] memory) {
    return registeredGroups;
  }

  /**
   * @notice Returns whether a particular account has a registered validator group.
   * @param account The account.
   * @return Whether a particular address is a registered validator group.
   */
  function isValidatorGroup(address account) public view returns (bool) {
    return groups[account].exists;
  }

  /**
   * @notice Returns whether a particular account has a registered validator.
   * @param account The account.
   * @return Whether a particular address is a registered validator.
   */
  function isValidator(address account) public view returns (bool) {
    return validators[account].publicKeys.bls.length > 0;
  }

  /**
   * @notice Deletes an element from a list of addresses.
   * @param list The list of addresses.
   * @param element The address to delete.
   * @param index The index of `element` in the list.
   */
  function deleteElement(address[] storage list, address element, uint256 index) private {
    require(index < list.length && list[index] == element, "deleteElement: index out of range");
    uint256 lastIndex = list.length.sub(1);
    list[index] = list[lastIndex];
    delete list[lastIndex];
    list.length = lastIndex;
  }

  /**
   * @notice Removes a member from a validator group.
   * @param group The group from which the member should be removed.
   * @param validator The validator to remove from the group.
   * @return True upon success.
   * @dev If `validator` was the only member of `group`, `group` becomes unelectable.
   * @dev Fails if `validator` is not a member of `group`.
   */
  function _removeMember(address group, address validator) private returns (bool) {
    ValidatorGroup storage _group = groups[group];
    require(validators[validator].affiliation == group, "Not affiliated to group");
    require(_group.members.contains(validator), "Not a member of the group");
    _group.members.remove(validator);
    uint256 numMembers = _group.members.numElements;
    // Empty validator groups are not electable.
    if (numMembers == 0) {
      getElection().markGroupIneligible(group);
    }
    updateMembershipHistory(validator, address(0));
    updateSizeHistory(group, numMembers.add(1));
    emit ValidatorGroupMemberRemoved(group, validator);
    return true;
  }

  /**
   * @notice Updates the group membership history of a particular account.
   * @param account The account whose group membership has changed.
   * @param group The group that the account is now a member of.
   * @return True upon success.
   * @dev Note that this is used to determine a validator's membership at the time of an election,
   *   and so group changes within an epoch will overwrite eachother.
   */
  function updateMembershipHistory(address account, address group) private returns (bool) {
    MembershipHistory storage history = validators[account].membershipHistory;
    uint256 epochNumber = getEpochNumber();
    uint256 head = history.numEntries == 0 ? 0 : history.tail.add(history.numEntries.sub(1));

    if (history.numEntries > 0 && group == address(0)) {
      history.lastRemovedFromGroupTimestamp = now;
    }

    if (history.entries[head].epochNumber == epochNumber) {
      // There have been no elections since the validator last changed membership, overwrite the
      // previous entry.
      history.entries[head] = MembershipHistoryEntry(epochNumber, group);
      return true;
    }

    // There have been elections since the validator last changed membership, create a new entry.
    uint256 index = history.numEntries == 0 ? 0 : head.add(1);
    history.entries[index] = MembershipHistoryEntry(epochNumber, group);
    if (history.numEntries < membershipHistoryLength) {
      // Not enough entries, don't remove any.
      history.numEntries = history.numEntries.add(1);
    } else if (history.numEntries == membershipHistoryLength) {
      // Exactly enough entries, delete the oldest one to account for the one we added.
      delete history.entries[history.tail];
      history.tail = history.tail.add(1);
    } else {
      // Too many entries, delete the oldest two to account for the one we added.
      delete history.entries[history.tail];
      delete history.entries[history.tail.add(1)];
      history.numEntries = history.numEntries.sub(1);
      history.tail = history.tail.add(2);
    }
    return true;
  }

  /**
   * @notice Updates the size history of a validator group.
   * @param group The account whose group size has changed.
   * @param size The new size of the group.
   * @dev Used to determine how much gold an account needs to keep locked.
   */
  function updateSizeHistory(address group, uint256 size) private {
    uint256[] storage sizeHistory = groups[group].sizeHistory;
    if (size == sizeHistory.length) {
      sizeHistory.push(now);
    } else if (size < sizeHistory.length) {
      sizeHistory[size] = now;
    } else {
      require(false, "Unable to update size history");
    }
  }

  /**
   * @notice Returns the group that `account` was a member of at the end of the last epoch.
   * @param signer The signer of the account whose group membership should be returned.
   * @return The group that `account` was a member of at the end of the last epoch.
   */
  function getMembershipInLastEpochFromSigner(address signer) external view returns (address) {
    address account = getAccounts().signerToAccount(signer);
    require(isValidator(account), "Not a validator");
    return getMembershipInLastEpoch(account);
  }

  /**
   * @notice Returns the group that `account` was a member of at the end of the last epoch.
   * @param account The account whose group membership should be returned.
   * @return The group that `account` was a member of at the end of the last epoch.
   */
  function getMembershipInLastEpoch(address account) public view returns (address) {
    uint256 epochNumber = getEpochNumber();
    MembershipHistory storage history = validators[account].membershipHistory;
    uint256 head = history.numEntries == 0 ? 0 : history.tail.add(history.numEntries.sub(1));
    // If the most recent entry in the membership history is for the current epoch number, we need
    // to look at the previous entry.
    if (history.entries[head].epochNumber == epochNumber) {
      if (head > history.tail) {
        head = head.sub(1);
      }
    }
    return history.entries[head].group;
  }

  /**
   * @notice De-affiliates a validator, removing it from the group for which it is a member.
   * @param validator The validator to deaffiliate from their affiliated validator group.
   * @param validatorAccount The LockedGold account of the validator.
   * @return True upon success.
   */
  function _deaffiliate(Validator storage validator, address validatorAccount)
    private
    returns (bool)
  {
    address affiliation = validator.affiliation;
    ValidatorGroup storage group = groups[affiliation];
    if (group.members.contains(validatorAccount)) {
      _removeMember(affiliation, validatorAccount);
    }
    validator.affiliation = address(0);
    emit ValidatorDeaffiliated(validatorAccount, affiliation);
    return true;
  }

  /**
   * @notice Removes a validator from the group for which it is a member.
   * @param validatorAccount The validator to deaffiliate from their affiliated validator group.
   */
  function forceDeaffiliateIfValidator(address validatorAccount) external nonReentrant onlySlasher {
    if (isValidator(validatorAccount)) {
      Validator storage validator = validators[validatorAccount];
      if (validator.affiliation != address(0)) {
        _deaffiliate(validator, validatorAccount);
      }
    }
  }

  /**
   * @notice Sets the slashingMultiplierRestPeriod property if called by owner.
   * @param value New reset period for slashing multiplier.
   */
  function setSlashingMultiplierResetPeriod(uint256 value) public nonReentrant onlyOwner {
    slashingMultiplierResetPeriod = value;
  }

  /**
   * @notice Resets a group's slashing multiplier if it has been >= the reset period since
   *         the last time the group was slashed.
   */
  function resetSlashingMultiplier() external nonReentrant {
    address account = getAccounts().validatorSignerToAccount(msg.sender);
    require(isValidatorGroup(account), "Not a validator group");
    ValidatorGroup storage group = groups[account];
    require(
      now >= group.slashInfo.lastSlashed.add(slashingMultiplierResetPeriod),
      "`resetSlashingMultiplier` called before resetPeriod expired"
    );
    group.slashInfo.multiplier = FixidityLib.fixed1();
  }

  /**
   * @notice Halves the group's slashing multiplier.
   * @param account The group being slashed.
   */
  function halveSlashingMultiplier(address account) external nonReentrant onlySlasher {
    require(isValidatorGroup(account), "Not a validator group");
    ValidatorGroup storage group = groups[account];
    group.slashInfo.multiplier = FixidityLib.wrap(group.slashInfo.multiplier.unwrap().div(2));
    group.slashInfo.lastSlashed = now;
  }

  /**
   * @notice Getter for a group's slashing multiplier.
   * @param account The group to fetch slashing multiplier for.
   */
  function getValidatorGroupSlashingMultiplier(address account) external view returns (uint256) {
    require(isValidatorGroup(account), "Not a validator group");
    ValidatorGroup storage group = groups[account];
    return group.slashInfo.multiplier.unwrap();
  }

  /**
   * @notice Returns the group that `account` was a member of during `epochNumber`.
   * @param account The account whose group membership should be returned.
   * @param epochNumber The epoch number we are querying this account's membership at.
   * @param index The index into the validator's history struct for their history at `epochNumber`.
   * @return The group that `account` was a member of during `epochNumber`.
   */
  function groupMembershipInEpoch(address account, uint256 epochNumber, uint256 index)
    external
    view
    returns (address)
  {
    require(isValidator(account), "Not a validator");
    require(epochNumber <= getEpochNumber(), "Epoch cannot be larger than current");
    MembershipHistory storage history = validators[account].membershipHistory;
    require(index < history.tail.add(history.numEntries), "index out of bounds");
    require(index >= history.tail && history.numEntries > 0, "index out of bounds");
    bool isExactMatch = history.entries[index].epochNumber == epochNumber;
    bool isLastEntry = index.sub(history.tail) == history.numEntries.sub(1);
    bool isWithinRange = history.entries[index].epochNumber < epochNumber &&
      (history.entries[index.add(1)].epochNumber > epochNumber || isLastEntry);
    require(
      isExactMatch || isWithinRange,
      "provided index does not match provided epochNumber at index in history."
    );
    return history.entries[index].group;
  }

}

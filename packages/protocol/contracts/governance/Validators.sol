pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./interfaces/IValidators.sol";

import "../identity/interfaces/IRandom.sol";

import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/AddressLinkedList.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

/**
 * @title A contract for registering and electing Validator Groups and Validators.
 */
contract Validators is
  IValidators,
  Ownable,
  ReentrancyGuard,
  Initializable,
  UsingRegistry,
  UsingPrecompiles
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

  // If we knew what time the validator was last in a group, we could enforce that to deregister a
  // group, you need to have had 0 members for `duration`, and to deregister a validator, you need
  // to have been out of a group for `duration`...

  struct ValidatorGroup {
    bool exists;
    LinkedList.List members;
    // TODO(asa): Add a function that allows groups to update their commission.
    FixidityLib.Fraction commission;
    // sizeHistory[i] contains the last time the group contained i members.
    uint256[] sizeHistory;
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

  struct Validator {
    bytes publicKeysData;
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
  uint256 public validatorEpochPayment;
  uint256 public membershipHistoryLength;
  uint256 public maxGroupSize;

  event MaxGroupSizeSet(uint256 size);
  event ValidatorEpochPaymentSet(uint256 value);
  event ValidatorScoreParametersSet(uint256 exponent, uint256 adjustmentSpeed);
  event GroupLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event ValidatorLockedGoldRequirementsSet(uint256 value, uint256 duration);
  event MembershipHistoryLengthSet(uint256 length);
  event ValidatorRegistered(address indexed validator, bytes publicKeysData);
  event ValidatorDeregistered(address indexed validator);
  event ValidatorAffiliated(address indexed validator, address indexed group);
  event ValidatorDeaffiliated(address indexed validator, address indexed group);
  event ValidatorPublicKeysDataUpdated(address indexed validator, bytes publicKeysData);
  event ValidatorGroupRegistered(address indexed group, uint256 commission);
  event ValidatorGroupDeregistered(address indexed group);
  event ValidatorGroupMemberAdded(address indexed group, address indexed validator);
  event ValidatorGroupMemberRemoved(address indexed group, address indexed validator);
  event ValidatorGroupMemberReordered(address indexed group, address indexed validator);
  event ValidatorGroupCommissionUpdated(address indexed group, uint256 commission);

  modifier onlyVm() {
    require(msg.sender == address(0));
    _;
  }

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param groupRequirementValue The Locked Gold requirement amount for groups.
   * @param groupRequirementDuration The Locked Gold requirement duration for groups.
   * @param validatorRequirementValue The Locked Gold requirement amount for validators.
   * @param validatorRequirementDuration The Locked Gold requirement duration for validators.
   * @param validatorScoreExponent The exponent used in calculating validator scores.
   * @param validatorScoreAdjustmentSpeed The speed at which validator scores are adjusted.
   * @param _validatorEpochPayment The duration the above gold remains locked after deregistration.
   * @param _membershipHistoryLength The max number of entries for validator membership history.
   * @param _maxGroupSize The maximum group size.
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
    uint256 _validatorEpochPayment,
    uint256 _membershipHistoryLength,
    uint256 _maxGroupSize
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setGroupLockedGoldRequirements(groupRequirementValue, groupRequirementDuration);
    setValidatorLockedGoldRequirements(validatorRequirementValue, validatorRequirementDuration);
    setValidatorScoreParameters(validatorScoreExponent, validatorScoreAdjustmentSpeed);
    setMaxGroupSize(_maxGroupSize);
    setValidatorEpochPayment(_validatorEpochPayment);
    setMembershipHistoryLength(_membershipHistoryLength);
  }

  /**
   * @notice Updates the maximum number of members a group can have.
   * @param size The maximum group size.
   * @return True upon success.
   */
  function setMaxGroupSize(uint256 size) public onlyOwner returns (bool) {
    require(0 < size && size != maxGroupSize);
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
    require(0 < length && length != membershipHistoryLength);
    membershipHistoryLength = length;
    emit MembershipHistoryLengthSet(length);
    return true;
  }

  /**
   * @notice Sets the per-epoch payment in Celo Dollars for validators, less group commission.
   * @param value The value in Celo Dollars.
   * @return True upon success.
   */
  function setValidatorEpochPayment(uint256 value) public onlyOwner returns (bool) {
    require(value != validatorEpochPayment);
    validatorEpochPayment = value;
    emit ValidatorEpochPaymentSet(value);
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
    require(adjustmentSpeed <= FixidityLib.fixed1().unwrap());
    require(
      exponent != validatorScoreParameters.exponent ||
        !FixidityLib.wrap(adjustmentSpeed).equals(validatorScoreParameters.adjustmentSpeed)
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
    require(value != requirements.value || duration != requirements.duration);
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
    require(value != requirements.value || duration != requirements.duration);
    validatorLockedGoldRequirements = LockedGoldRequirements(value, duration);
    emit ValidatorLockedGoldRequirementsSet(value, duration);
    return true;
  }

  /**
   * @notice Registers a validator unaffiliated with any validator group.
   * @param publicKeysData Comprised of three tightly-packed elements:
   *    - publicKey - The public key that the validator is using for consensus, should match
   *      msg.sender. 64 bytes.
   *    - blsPublicKey - The BLS public key that the validator is using for consensus, should pass
   *      proof of possession. 48 bytes.
   *    - blsPoP - The BLS public key proof of possession. 96 bytes.
   * @return True upon success.
   * @dev Fails if the account is already a validator or validator group.
   * @dev Fails if the account does not have sufficient Locked Gold.
   */
  function registerValidator(bytes calldata publicKeysData) external nonReentrant returns (bool) {
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(!isValidator(account) && !isValidatorGroup(account));
    uint256 lockedGoldBalance = getLockedGold().getAccountTotalLockedGold(account);
    require(lockedGoldBalance >= validatorLockedGoldRequirements.value);
    Validator storage validator = validators[account];
    _updatePublicKeysData(validator, publicKeysData);
    validator.publicKeysData = publicKeysData;
    registeredValidators.push(account);
    updateMembershipHistory(account, address(0));
    emit ValidatorRegistered(account, publicKeysData);
    return true;
  }

  /**
   * @notice Returns the parameters that goven how a validator's score is calculated.
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
    returns (uint256[] memory, address[] memory, uint256)
  {
    MembershipHistory storage history = validators[account].membershipHistory;
    uint256[] memory epochs = new uint256[](history.numEntries);
    address[] memory membershipGroups = new address[](history.numEntries);
    for (uint256 i = 0; i < history.numEntries; i = i.add(1)) {
      uint256 index = history.tail.add(i);
      epochs[i] = history.entries[index].epochNumber;
      membershipGroups[i] = history.entries[index].group;
    }
    return (epochs, membershipGroups, history.lastRemovedFromGroupTimestamp);
  }

  /**
   * @notice Updates a validator's score based on its uptime for the epoch.
   * @param validator The address of the validator.
   * @param uptime The Fixidity representation of the validator's uptime, between 0 and 1.
   * @return True upon success.
   */
  function updateValidatorScore(address validator, uint256 uptime) external onlyVm() {
    _updateValidatorScore(validator, uptime);
  }

  /**
   * @notice Updates a validator's score based on its uptime for the epoch.
   * @param validator The address of the validator.
   * @param uptime The Fixidity representation of the validator's uptime, between 0 and 1.
   * @dev new_score = uptime ** exponent * adjustmentSpeed + old_score * (1 - adjustmentSpeed)
   * @return True upon success.
   */
  function _updateValidatorScore(address validator, uint256 uptime) internal {
    address account = getAccounts().validationSignerToAccount(validator);
    require(isValidator(account));
    require(uptime <= FixidityLib.fixed1().unwrap());

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

    FixidityLib.Fraction memory epochScore = FixidityLib.wrap(numerator).divide(
      FixidityLib.wrap(denominator)
    );
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
  }

  /**
   * @notice Distributes epoch payments to `validator` and its group.
   */
  function distributeEpochPayment(address validator) external onlyVm() {
    _distributeEpochPayment(validator);
  }

  /**
   * @notice Distributes epoch payments to `validator` and its group.
   */
  function _distributeEpochPayment(address validator) internal {
    address account = getAccounts().validationSignerToAccount(validator);
    require(isValidator(account));
    // The group that should be paid is the group that the validator was a member of at the
    // time it was elected.
    address group = getMembershipInLastEpoch(account);
    // Both the validator and the group must maintain the minimum locked gold balance in order to
    // receive epoch payments.
    if (meetsAccountLockedGoldRequirements(account) && meetsAccountLockedGoldRequirements(group)) {
      FixidityLib.Fraction memory totalPayment = FixidityLib
        .newFixed(validatorEpochPayment)
        .multiply(validators[account].score);
      uint256 groupPayment = totalPayment.multiply(groups[group].commission).fromFixed();
      uint256 validatorPayment = totalPayment.fromFixed().sub(groupPayment);
      getStableToken().mint(group, groupPayment);
      getStableToken().mint(account, validatorPayment);
    }
  }

  /**
   * @notice De-registers a validator.
   * @param index The index of this validator in the list of all registered validators.
   * @return True upon success.
   * @dev Fails if the account is not a validator.
   */
  function deregisterValidator(uint256 index) external nonReentrant returns (bool) {
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(isValidator(account));

    // Require that the validator has not been a member of a validator group for
    // `validatorLockedGoldRequirements.duration` seconds.
    Validator storage validator = validators[account];
    if (validator.affiliation != address(0)) {
      require(!groups[validator.affiliation].members.contains(account));
    }
    uint256 requirementEndTime = validator.membershipHistory.lastRemovedFromGroupTimestamp.add(
      validatorLockedGoldRequirements.duration
    );
    require(requirementEndTime < now);

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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(isValidator(account) && isValidatorGroup(group));
    require(meetsAccountLockedGoldRequirements(account));
    require(meetsAccountLockedGoldRequirements(group));
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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(isValidator(account));
    Validator storage validator = validators[account];
    require(validator.affiliation != address(0));
    _deaffiliate(validator, account);
    return true;
  }

  /**
   * @notice Updates a validator's public keys data.
   * @param publicKeysData Comprised of three tightly-packed elements:
   *    - publicKey - The public key that the validator is using for consensus, should match
   *      msg.sender. 64 bytes.
   *    - blsPublicKey - The BLS public key that the validator is using for consensus, should pass
   *      proof of possession. 48 bytes.
   *    - blsPoP - The BLS public key proof of possession. 96 bytes.
   * @return True upon success.
   */
  function updatePublicKeysData(bytes calldata publicKeysData) external returns (bool) {
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(isValidator(account));
    Validator storage validator = validators[account];
    _updatePublicKeysData(validator, publicKeysData);
    emit ValidatorPublicKeysDataUpdated(account, publicKeysData);
    return true;
  }

  /**
   * @notice Updates a validator's public keys data.
   * @param validator The validator whose public keys data should be updated.
   * @param publicKeysData Comprised of three tightly-packed elements:
   *    - publicKey - The public key that the validator is using for consensus, should match
   *      msg.sender. 64 bytes.
   *    - blsPublicKey - The BLS public key that the validator is using for consensus, should pass
   *      proof of possession. 48 bytes.
   *    - blsPoP - The BLS public key proof of possession. 96 bytes.
   * @return True upon success.
   */
  function _updatePublicKeysData(Validator storage validator, bytes memory publicKeysData)
    private
    returns (bool)
  {
    require(
      // secp256k1 public key + BLS public key + BLS proof of possession
      publicKeysData.length == (64 + 48 + 96)
    );
    // Use the proof of possession bytes
    require(checkProofOfPossession(msg.sender, publicKeysData.slice(64, 48 + 96)));
    validator.publicKeysData = publicKeysData;
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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(!isValidator(account) && !isValidatorGroup(account));
    uint256 lockedGoldBalance = getLockedGold().getAccountTotalLockedGold(account);
    require(lockedGoldBalance >= groupLockedGoldRequirements.value);
    ValidatorGroup storage group = groups[account];
    group.exists = true;
    group.commission = FixidityLib.wrap(commission);
    registeredGroups.push(account);
    emit ValidatorGroupRegistered(account, commission);
    return true;
  }

  /**
   * @notice De-registers a validator group.
   * @param index The index of this validator group in the list of all validator groups.
   * @return True upon success.
   * @dev Fails if the account is not a validator group with no members.
   */
  function deregisterValidatorGroup(uint256 index) external nonReentrant returns (bool) {
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    // Only Validator Groups that have never had members or have been empty for at least
    // `groupLockedGoldRequirements.duration` seconds can be deregistered.
    require(isValidatorGroup(account) && groups[account].members.numElements == 0);
    uint256[] storage sizeHistory = groups[account].sizeHistory;
    if (sizeHistory.length > 1) {
      require(sizeHistory[1].add(groupLockedGoldRequirements.duration) < now);
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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(groups[account].members.numElements > 0);
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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(groups[account].members.numElements == 0);
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
    require(isValidatorGroup(group) && isValidator(validator));
    ValidatorGroup storage _group = groups[group];
    require(_group.members.numElements < maxGroupSize, "group would exceed maximum size");
    require(validators[validator].affiliation == group && !_group.members.contains(validator));
    uint256 numMembers = _group.members.numElements.add(1);
    require(meetsAccountLockedGoldRequirements(group));
    require(meetsAccountLockedGoldRequirements(validator));
    _group.members.push(validator);
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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
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
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(isValidatorGroup(account) && isValidator(validator));
    ValidatorGroup storage group = groups[account];
    require(group.members.contains(validator));
    group.members.update(validator, lesserMember, greaterMember);
    emit ValidatorGroupMemberReordered(account, validator);
    return true;
  }

  /**
   * @notice Updates a validator group's commission.
   * @param commission Fixidity representation of the commission this group receives on epoch
   *   payments made to its members. Must be in the range [0, 1.0].
   * @return True upon success.
   */
  function updateCommission(uint256 commission) external returns (bool) {
    address account = getAccounts().activeValidationSignerToAccount(msg.sender);
    require(isValidatorGroup(account));
    ValidatorGroup storage group = groups[account];
    require(commission <= FixidityLib.fixed1().unwrap(), "Commission can't be greater than 100%");
    require(commission != group.commission.unwrap(), "Commission must be different");
    group.commission = FixidityLib.wrap(commission);
    emit ValidatorGroupCommissionUpdated(account, commission);
    return true;
  }

  /**
   * @notice Returns the locked gold balance requirement for the supplied account.
   * @param account The account that may have to meet locked gold balance requirements.
   * @return The locked gold balance requirement for the supplied account.
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
   * @notice Returns validator information.
   * @param account The account that registered the validator.
   * @return The unpacked validator struct.
   */
  function getValidator(address account)
    external
    view
    returns (bytes memory publicKeysData, address affiliation, uint256 score)
  {
    require(isValidator(account));
    Validator storage validator = validators[account];
    return (validator.publicKeysData, validator.affiliation, validator.score.unwrap());
  }

  /**
   * @notice Returns validator group information.
   * @param account The account that registered the validator group.
   * @return The unpacked validator group struct.
   */
  function getValidatorGroup(address account)
    external
    view
    returns (address[] memory, uint256, uint256[] memory)
  {
    require(isValidatorGroup(account));
    ValidatorGroup storage group = groups[account];
    return (group.members.getKeys(), group.commission.unwrap(), group.sizeHistory);
  }

  /**
   * @notice Returns the number of members in a validator group.
   * @param account The address of the validator group.
   * @return The number of members in a validator group.
   */
  function getGroupNumMembers(address account) public view returns (uint256) {
    require(isValidatorGroup(account));
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
      topValidators[i] = getAccounts().getValidationSigner(topAccounts[i]);
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
    return validators[account].publicKeysData.length > 0;
  }

  /**
   * @notice Deletes an element from a list of addresses.
   * @param list The list of addresses.
   * @param element The address to delete.
   * @param index The index of `element` in the list.
   */
  function deleteElement(address[] storage list, address element, uint256 index) private {
    require(index < list.length && list[index] == element);
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
    require(validators[validator].affiliation == group && _group.members.contains(validator));
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
}

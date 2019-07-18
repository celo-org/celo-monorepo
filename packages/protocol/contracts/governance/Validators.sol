pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "./AddressLinkedList.sol";
import "./AddressSortedLinkedList.sol";
import "./UsingBondedDeposits.sol";
import "./interfaces/IValidators.sol";
import "../common/Initializable.sol";
import "../stability/FractionUtil.sol";


/**
 * @title A contract for registering and electing Validator Groups and Validators.
 */
contract Validators is IValidators, Ownable, ReentrancyGuard, Initializable, UsingBondedDeposits {

  using AddressLinkedList for LinkedList.List;
  using AddressSortedLinkedList for SortedLinkedList.List;
  using SafeMath for uint256;
  using FractionUtil for FractionUtil.Fraction;

  // TODO(asa): These strings should be modifiable
  struct ValidatorGroup {
    string identifier;
    string name;
    string url;
    LinkedList.List members;
  }

  // TODO(asa): These strings should be modifiable
  struct Validator {
    string identifier;
    string name;
    string url;
    bytes publicKey;
    address affiliation;
  }

  struct BondedDeposit {
    uint256 noticePeriod;
    uint256 value;
  }

  mapping(address => ValidatorGroup) private groups;
  mapping(address => Validator) private validators;
  // TODO(asa): Implement abstaining
  mapping(address => address) public voters;
  address[] private _groups;
  address[] private _validators;
  SortedLinkedList.List private votes;
  // TODO(asa): Support different requirements for groups vs. validators.
  BondedDeposit private registrationRequirement;
  uint256 public minElectableValidators;
  uint256 public maxElectableValidators;

  event MinElectableValidatorsSet(
    uint256 minElectableValidators
  );

  event MaxElectableValidatorsSet(
    uint256 maxElectableValidators
  );

  event RegistrationRequirementSet(
    uint256 value,
    uint256 noticePeriod
  );

  event ValidatorRegistered(
    address indexed validator,
    string identifier,
    string name,
    string url,
    bytes publicKey
  );

  event ValidatorDeregistered(
    address indexed validator
  );

  event ValidatorAffiliated(
    address indexed validator,
    address indexed group
  );

  event ValidatorDeaffiliated(
    address indexed validator,
    address indexed group
  );

  event ValidatorGroupRegistered(
    address indexed group,
    string identifier,
    string name,
    string url
  );

  event ValidatorGroupDeregistered(
    address indexed group
  );

  event ValidatorGroupMemberAdded(
    address indexed group,
    address indexed validator
  );

  event ValidatorGroupMemberRemoved(
    address indexed group,
    address indexed validator
  );

  event ValidatorGroupMemberReordered(
    address indexed group,
    address indexed validator
  );

  event ValidatorGroupEmptied(
    address indexed group
  );

  event ValidatorGroupVoteCast(
    address indexed account,
    address indexed group,
    uint256 weight
  );

  event ValidatorGroupVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 weight
  );

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param _minElectableValidators The minimum number of validators that can be elected.
   * @param _maxElectableValidators The maximum number of validators that can be elected.
   * @param requirementValue The minimum bonded deposit value to register a group or validator.
   * @param requirementNoticePeriod The minimum bonded deposit notice period to register a group or
   *   validator.
   * @dev Should be called only once.
   */
  function initialize(
    address registryAddress,
    uint256 _minElectableValidators,
    uint256 _maxElectableValidators,
    uint256 requirementValue,
    uint256 requirementNoticePeriod
  )
    external
    initializer
  {
    require(_minElectableValidators > 0 && _maxElectableValidators >= _minElectableValidators);
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    minElectableValidators = _minElectableValidators;
    maxElectableValidators = _maxElectableValidators;
    registrationRequirement.value = requirementValue;
    registrationRequirement.noticePeriod = requirementNoticePeriod;
  }

  /**
   * @notice Updates the minimum number of validators that can be elected.
   * @param _minElectableValidators The minimum number of validators that can be elected.
   * @return True upon success.
   */
  function setMinElectableValidators(
    uint256 _minElectableValidators
  )
    external
    onlyOwner
    returns (bool)
  {
    require(
      _minElectableValidators > 0 &&
      _minElectableValidators != minElectableValidators &&
      _minElectableValidators <= maxElectableValidators
    );
    minElectableValidators = _minElectableValidators;
    emit MinElectableValidatorsSet(_minElectableValidators);
    return true;
  }

  /**
   * @notice Updates the maximum number of validators that can be elected.
   * @param _maxElectableValidators The maximum number of validators that can be elected.
   * @return True upon success.
   */
  function setMaxElectableValidators(
    uint256 _maxElectableValidators
  )
    external
    onlyOwner
    returns (bool)
  {
    require(
      _maxElectableValidators != maxElectableValidators &&
      _maxElectableValidators >= minElectableValidators
    );
    maxElectableValidators = _maxElectableValidators;
    emit MaxElectableValidatorsSet(_maxElectableValidators);
    return true;
  }

  /**
   * @notice Updates the minimum bonding requirements to register a validator group or validator.
   * @param value The minimum bonded deposit value to register a group or validator.
   * @param noticePeriod The minimum bonded deposit notice period to register a group or validator.
   * @return True upon success.
   * @dev The new requirement is only enforced for future validator or group registrations.
   */
  function setRegistrationRequirement(
    uint256 value,
    uint256 noticePeriod
  )
    external
    onlyOwner
    returns (bool)
  {
    require(
      value != registrationRequirement.value ||
      noticePeriod != registrationRequirement.noticePeriod
    );
    registrationRequirement.value = value;
    registrationRequirement.noticePeriod = noticePeriod;
    emit RegistrationRequirementSet(value, noticePeriod);
    return true;
  }

  /**
   * @notice Registers a validator unaffiliated with any validator group.
   * @param identifier An identifier for this validator.
   * @param name A name for the validator.
   * @param url A URL for the validator.
   * @param noticePeriod The notice period of the bonded deposit that meets the requirements for
   *   validator registration.
   * @param publicKey The public key that the validator is using for consensus, should match
   *   msg.sender.
   * @return True upon success.
   * @dev Fails if the account is already a validator or validator group.
   * @dev Fails if the account does not have sufficient weight.
   */
  function registerValidator(
    string calldata identifier,
    string calldata name,
    string calldata url,
    bytes calldata publicKey,
    uint256 noticePeriod
  )
    external
    nonReentrant
    returns (bool)
  {
    require(
      bytes(identifier).length > 0 &&
      bytes(name).length > 0 &&
      bytes(url).length > 0 &&
      publicKey.length == 64
    );
    address account = getAccountFromValidator(msg.sender);
    require(!isValidator(account) && !isValidatorGroup(account));
    require(meetsRegistrationRequirements(account, noticePeriod));
    Validator storage validator = validators[account];
    validator.identifier = identifier;
    validator.name = name;
    validator.url = url;
    validator.publicKey = publicKey;
    _validators.push(account);
    emit ValidatorRegistered(account, identifier, name, url, publicKey);
    return true;
  }

  /**
   * @notice De-registers a validator, removing it from the group for which it is a member.
   * @param index The index of this validator in the list of all validators.
   * @return True upon success.
   * @dev Fails if the account is not a validator.
   */
  function deregisterValidator(uint256 index) external nonReentrant returns (bool) {
    address account = getAccountFromValidator(msg.sender);
    require(isValidator(account));
    Validator storage validator = validators[account];
    if (validator.affiliation != address(0)) {
      _deaffiliate(validator, account);
    }
    delete validators[account];
    deleteElement(_validators, account, index);
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
    address account = getAccountFromValidator(msg.sender);
    require(isValidator(account) && isValidatorGroup(group));
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
    address account = getAccountFromValidator(msg.sender);
    require(isValidator(account));
    Validator storage validator = validators[account];
    require(validator.affiliation != address(0));
    _deaffiliate(validator, account);
    return true;
  }

  /**
   * @notice Registers a validator group with no member validators.
   * @param identifier A identifier for this validator group.
   * @param name A name for the validator group.
   * @param url A URL for the validator group.
   * @param noticePeriod The notice period of the bonded deposit that meets the requirements for
   *   validator registration.
   * @return True upon success.
   * @dev Fails if the account is already a validator or validator group.
   * @dev Fails if the account does not have sufficient weight.
   */
  function registerValidatorGroup(
    string calldata identifier,
    string calldata name,
    string calldata url,
    uint256 noticePeriod
  )
    external
    nonReentrant
    returns (bool)
  {
    require(bytes(identifier).length > 0 && bytes(name).length > 0 && bytes(url).length > 0);
    address account = getAccountFromValidator(msg.sender);
    require(!isValidator(account) && !isValidatorGroup(account));
    require(meetsRegistrationRequirements(account, noticePeriod));
    ValidatorGroup storage group = groups[account];
    group.identifier = identifier;
    group.name = name;
    group.url = url;
    _groups.push(account);
    emit ValidatorGroupRegistered(account, identifier, name, url);
    return true;
  }

  /**
   * @notice De-registers a validator group.
   * @param index The index of this validator group in the list of all validator groups.
   * @return True upon success.
   * @dev Fails if the account is not a validator group with no members.
   */
  function deregisterValidatorGroup(uint256 index) external nonReentrant returns (bool) {
    address account = getAccountFromValidator(msg.sender);
    // Only empty Validator Groups can be deregistered.
    require(isValidatorGroup(account) && groups[account].members.numElements == 0);
    delete groups[account];
    deleteElement(_groups, account, index);
    emit ValidatorGroupDeregistered(account);
    return true;
  }

  /**
   * @notice Adds a member to the end of a validator group's list of members.
   * @param validator The validator to add to the group
   * @return True upon success.
   * @dev Fails if `validator` has not set their affiliation to this account.
   */
  function addMember(address validator) external nonReentrant returns (bool) {
    address account = getAccountFromValidator(msg.sender);
    require(isValidatorGroup(account) && isValidator(validator));
    ValidatorGroup storage group = groups[account];
    require(validators[validator].affiliation == account && !group.members.contains(validator));
    group.members.push(validator);
    emit ValidatorGroupMemberAdded(account, validator);
    return true;
  }

  /**
   * @notice Removes a member from a validator group.
   * @param validator The validator to remove from the group
   * @return True upon success.
   * @dev Fails if `validator` is not a member of the account's group.
   */
  function removeMember(address validator) external nonReentrant returns (bool) {
    address account = getAccountFromValidator(msg.sender);
    require(isValidatorGroup(account) && isValidator(validator));
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
  function reorderMember(
    address validator,
    address lesserMember,
    address greaterMember
  )
    external
    nonReentrant
    returns (bool)
  {
    address account = getAccountFromValidator(msg.sender);
    require(isValidatorGroup(account) && isValidator(validator));
    ValidatorGroup storage group = groups[account];
    require(group.members.contains(validator));
    group.members.update(validator, lesserMember, greaterMember);
    emit ValidatorGroupMemberReordered(account, validator);
    return true;
  }

  /**
   * @notice Casts a vote for a validator group.
   * @param group The validator group to vote for.
   * @param lesser The group receiving fewer votes than `group`, or 0 if `group` has the
   *   fewest votes of any validator group.
   * @param greater The group receiving more votes than `group`, or 0 if `group` has the
   *   most votes of any validator group.
   * @return True upon success.
   * @dev Fails if `group` is empty or not a validator group.
   * @dev Fails if the account is frozen.
   */
  function vote(
    address group,
    address lesser,
    address greater
  )
    external
    nonReentrant
    returns (bool)
  {
    // Empty validator groups are not electable.
    require(isValidatorGroup(group) && groups[group].members.numElements > 0);
    address account = getAccountFromVoter(msg.sender);
    require(!isVotingFrozen(account));
    require(voters[account] == address(0));
    uint256 weight = getAccountWeight(account);
    require(weight > 0);
    if (votes.contains(group)) {
      votes.update(
        group,
        votes.getValue(group).add(uint256(weight)),
        lesser,
        greater
      );
    } else {
      votes.insert(
        group,
        weight,
        lesser,
        greater
      );
    }
    voters[account] = group;
    emit ValidatorGroupVoteCast(account, group, weight);
    return true;
  }

  /**
   * @notice Revokes an outstanding vote for a validator group.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *   or 0 if that group has the most votes of any validator group.
   * @return True upon success.
   * @dev Fails if the account has not voted on a validator group.
   */
  function revokeVote(
    address lesser,
    address greater
  )
    external
    nonReentrant
    returns (bool)
  {
    address account = getAccountFromVoter(msg.sender);
    address group = voters[account];
    require(group != address(0));
    uint256 weight = getAccountWeight(account);
    // If the group we had previously voted on removed all its members it is no longer eligible
    // to receive votes and we don't have to worry about removing our vote.
    if (votes.contains(group)) {
      require(weight > 0);
      uint256 newVoteTotal = votes.getValue(group).sub(uint256(weight));
      if (newVoteTotal > 0) {
        votes.update(
          group,
          newVoteTotal,
          lesser,
          greater
        );
      } else {
        // Groups receiving no votes are not electable.
        votes.remove(group);
      }
    }
    voters[account] = address(0);
    emit ValidatorGroupVoteRevoked(account, group, weight);
    return true;
  }

  /**
   * @notice Returns validator information.
   * @param account The account that registered the validator.
   * @return The unpacked validator struct.
   */
  function getValidator(
    address account
  )
    external
    view
    returns (string memory, string memory, string memory, bytes memory, address)
  {
    require(isValidator(account));
    Validator storage validator = validators[account];
    return (
      validator.identifier,
      validator.name,
      validator.url,
      validator.publicKey,
      validator.affiliation
    );
  }

  /**
   * @notice Returns validator group information.
   * @param account The account that registered the validator group.
   * @return The unpacked validator group struct.
   */
  function getValidatorGroup(
    address account
  )
    external
    view
    returns (string memory, string memory, string memory, address[] memory)
  {
    require(isValidatorGroup(account));
    ValidatorGroup storage group = groups[account];
    return (group.identifier, group.name, group.url, group.members.getKeys());
  }

  /**
   * @notice Returns electable validator group addresses and their vote totals.
   * @return Electable validator group addresses and their vote totals.
   */
  function getValidatorGroupVotes() external view returns (address[] memory, uint256[] memory) {
    return votes.getElements();
  }

  /**
   * @notice Returns the number of votes a particular validator group has received.
   * @param group The account that registered the validator group.
   * @return The number of votes a particular validator group has received.
   */
  function getVotesReceived(address group) external view returns (uint256) {
    return votes.getValue(group);
  }

  /**
   * @notice Returns the bonded deposit requirements to register a validator or group.
   * @return The minimum value and notice period for the bonded deposit.
   */
  function getRegistrationRequirement() external view returns (uint256, uint256) {
    return (registrationRequirement.value, registrationRequirement.noticePeriod);
  }

  /**
   * @notice Returns the list of registered validator accounts.
   * @return The list of registered validator accounts.
   */
  function getRegisteredValidators() external view returns (address[] memory) {
    return _validators;
  }

  /**
   * @notice Returns the list of registered validator group accounts.
   * @return The list of registered validator group addresses.
   */
  function getRegisteredValidatorGroups() external view returns (address[] memory) {
    return _groups;
  }

  /**
   * @notice Returns whether a particular account is a registered validator or validator group.
   * @param account The account.
   * @return Whether a particular account is a registered validator or validator group.
   */
  function isValidating(address account) external view returns (bool) {
    return isValidator(account) || isValidatorGroup(account);
  }

  /**
   * @notice Returns whether a particular account is voting for a validator group.
   * @param account The account.
   * @return Whether a particular account is voting for a validator group.
   */
  function isVoting(address account) external view returns (bool) {
    return (voters[account] != address(0));
  }

  /**
   * @notice Returns a list of elected validators with seats allocated to groups via the D'Hondt
   *   method.
   * @return The list of elected validators.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   */
  /* solhint-disable code-complexity */
  function getValidators() external view returns (address[] memory) {
    // Only members of these validator groups are eligible for election.
    uint256 numElectionGroups = maxElectableValidators;
    if (numElectionGroups > votes.list.numElements) {
      numElectionGroups = votes.list.numElements;
    }
    address[] memory electionGroups = votes.list.headN(numElectionGroups);
    // Holds the number of members elected for each of the eligible validator groups.
    uint256[] memory numMembersElected = new uint256[](electionGroups.length);
    uint256 totalNumMembersElected = 0;
    bool memberElectedInRound = true;
    // Assign a number of seats to each validator group.
    while (totalNumMembersElected < maxElectableValidators && memberElectedInRound) {
      memberElectedInRound = false;
      uint256 groupIndex = 0;
      FractionUtil.Fraction memory maxN = FractionUtil.Fraction(0, 1);
      for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
        bool isWinningestGroupInRound = false;
        (maxN, isWinningestGroupInRound) = dHondt(maxN, electionGroups[i], numMembersElected[i]);
        if (isWinningestGroupInRound) {
          memberElectedInRound = true;
          groupIndex = i;
        }
      }

      if (memberElectedInRound) {
        numMembersElected[groupIndex] = numMembersElected[groupIndex].add(1);
        totalNumMembersElected = totalNumMembersElected.add(1);
      }
    }
    require(totalNumMembersElected >= minElectableValidators);
    // Grab the top validators from each group that won seats.
    address[] memory electedValidators = new address[](totalNumMembersElected);
    totalNumMembersElected = 0;
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      address[] memory electedGroupMembers = groups[electionGroups[i]].members.headN(
        numMembersElected[i]
      );
      for (uint256 j = 0; j < electedGroupMembers.length; j = j.add(1)) {
        // We use the validating delegate if one is set.
        electedValidators[totalNumMembersElected] = getValidatorFromAccount(electedGroupMembers[j]);
        totalNumMembersElected = totalNumMembersElected.add(1);
      }
    }
    return electedValidators;
  }
  /* solhint-enable code-complexity */

  /**
   * @notice Returns whether a particular account has a registered validator group.
   * @param account The account.
   * @return Whether a particular address is a registered validator group.
   */
  function isValidatorGroup(address account) public view returns (bool) {
    return bytes(groups[account].identifier).length > 0;
  }

  /**
   * @notice Returns whether a particular account has a registered validator.
   * @param account The account.
   * @return Whether a particular address is a registered validator.
   */
  function isValidator(address account) public view returns (bool) {
    return bytes(validators[account].identifier).length > 0;
  }

  /**
   * @notice Returns whether an account meets the requirements to register a validator or group.
   * @param account The account.
   * @param noticePeriod The notice period of the bonded deposit that meets the requirements.
   * @return Whether an account meets the requirements to register a validator or group.
   */
  function meetsRegistrationRequirements(
    address account,
    uint256 noticePeriod
  )
    public
    view
    returns (bool)
  {
    uint256 value = getBondedDepositValue(account, noticePeriod);
    return (
      value >= registrationRequirement.value &&
      noticePeriod >= registrationRequirement.noticePeriod
    );
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
    list[lastIndex] = address(0);
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
    emit ValidatorGroupMemberRemoved(group, validator);

    // Empty validator groups are not electable.
    if (groups[group].members.numElements == 0) {
      if (votes.contains(group)) {
        votes.remove(group);
      }
      emit ValidatorGroupEmptied(group);
    }
    return true;
  }

  /**
   * @notice De-affiliates a validator, removing it from the group for which it is a member.
   * @param validator The validator to deaffiliate from their affiliated validator group.
   * @param validatorAccount The BondedDeposits account of the validator.
   * @return True upon success.
   */
  function _deaffiliate(
    Validator storage validator,
    address validatorAccount
  )
    private
    returns (bool)
  {
    address affiliation = validator.affiliation;
    ValidatorGroup storage group = groups[affiliation];
    if (group.members.contains(validatorAccount)) {
      _removeMember(affiliation, validatorAccount);
    }
    emit ValidatorDeaffiliated(validatorAccount, affiliation);
    validator.affiliation = address(0);
    return true;
  }

  /**
   * @notice Runs D'Hondt for a validator group.
   * @param maxN The maximum number of votes per elected seat for a group in this round.
   * @param groupAddress The address of the validator group.
   * @param numMembersElected The number of members elected so far for this group.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   * @return The new `maxN` and whether or not the group should win a seat in this round thus far.
   */
  function dHondt(
    FractionUtil.Fraction memory maxN,
    address groupAddress,
    uint256 numMembersElected
  )
    private
    view
    returns (FractionUtil.Fraction memory, bool)
  {
    ValidatorGroup storage group = groups[groupAddress];
    // Only consider groups with members left to be elected.
    if (group.members.numElements > numMembersElected) {
      FractionUtil.Fraction memory n = FractionUtil.Fraction(
        votes.getValue(groupAddress),
        numMembersElected.add(1)
      );
      if (n.isGreaterThan(maxN)) {
        return (n, true);
      }
    }
    return (maxN, false);
  }
}

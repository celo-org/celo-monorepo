pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "./interfaces/IValidators.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/AddressSortedLinkedList.sol";
import "../common/UsingRegistry.sol";


contract Election is Ownable, ReentrancyGuard, Initializable, UsingRegistry {

  using AddressSortedLinkedList for SortedLinkedList.List;
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  // Pending votes are those for which no following elections have been held.
  // These votes have yet to contribute to the election of validators and thus do not accrue
  // rewards.
  struct PendingVotes {
    // Maps groups to total pending voting balance.
    mapping(address => uint256) total;
    // Maps groups to accounts to pending voting balance.
    mapping(address => mapping(address => uint256)) balances;
    // Maps groups to accounts to timestamp of the account's most recent vote for the group.
    mapping(address => mapping(address => uint256)) timestamps;
  }

  // Active votes are those for which at least one following election has been held.
  // These votes have contributed to the election of validators and thus accrue rewards.
  struct ActiveVotes {
    // Maps groups to total active voting balance.
    mapping(address => uint256) total;
    // Maps groups to accounts to the numerator of the account's fraction of the group's
    // total active votes.
    mapping(address => mapping(address => uint256)) numerators;
    // Maps groups to the denominator of all accounts' fraction of the group's total active votes.
    mapping(address => uint256) denominators;
  }

  struct TotalVotes {
    // The total number of votes cast.
    uint256 total;
    // A list of eligible ValidatorGroups sorted by total votes.
    SortedLinkedList.List eligible;
  }

  struct Votes {
    PendingVotes pending;
    ActiveVotes active;
    TotalVotes total;
    // Maps an account to the list of groups it's voting for.
    mapping(address => address[]) groupsVotedFor;
  }

  Votes private votes;
  uint256 public minElectableValidators;
  uint256 public maxElectableValidators;
  uint256 public maxNumGroupsVotedFor;
  FixidityLib.Fraction public electabilityThreshold;

  event MinElectableValidatorsSet(
    uint256 minElectableValidators
  );

  event MaxElectableValidatorsSet(
    uint256 maxElectableValidators
  );

  event MaxNumGroupsVotedForSet(
    uint256 maxNumGroupsVotedFor
  );

  event ElectabilityThresholdSet(
    uint256 electabilityThreshold
  );

  event ValidatorGroupMarkedEligible(
    address group
  );

  event ValidatorGroupMarkedIneligible(
    address group
  );

  event ValidatorGroupVoteCast(
    address indexed account,
    address indexed group,
    uint256 value
  );

  event ValidatorGroupVoteActivated(
    address indexed account,
    address indexed group,
    uint256 value
  );

  event ValidatorGroupVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value
  );

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param _minElectableValidators The minimum number of validators that can be elected.
   * @param _maxNumGroupsVotedFor The maximum number of groups that an acconut can vote for at once.
   * @param _electabilityThreshold The minimum ratio of votes a group needs before its members can
   *   be elected.
   * @dev Should be called only once.
   */
  function initialize(
    address registryAddress,
    uint256 _minElectableValidators,
    uint256 _maxElectableValidators,
    uint256 _maxNumGroupsVotedFor,
    uint256 _electabilityThreshold
  )
    external
    initializer
  {
    require(_minElectableValidators > 0 && _maxElectableValidators >= _minElectableValidators);
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    minElectableValidators = _minElectableValidators;
    maxElectableValidators = _maxElectableValidators;
    maxNumGroupsVotedFor = _maxNumGroupsVotedFor;
    electabilityThreshold = FixidityLib.wrap(_electabilityThreshold);
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
   * @notice Updates the maximum number of groups an account can be voting for at once.
   * @param _maxNumGroupsVotedFor The maximum number of groups an account can vote for.
   * @return True upon success.
   */
  function setMaxNumGroupsVotedFor(
    uint256 _maxNumGroupsVotedFor
  )
    external
    onlyOwner
    returns (bool)
  {
    require(_maxNumGroupsVotedFor != maxNumGroupsVotedFor);
    maxNumGroupsVotedFor = _maxNumGroupsVotedFor;
    emit MaxNumGroupsVotedForSet(_maxNumGroupsVotedFor);
    return true;
  }

  /**
   * @notice Sets the electability threshold.
   * @param threshold Electability threshold as unwrapped Fraction.
   * @return True upon success.
   */
  function setElectabilityThreshold(
    uint256 threshold
  )
    public
    onlyOwner
    returns (bool)
  {
    electabilityThreshold = FixidityLib.wrap(threshold);
    require(
      electabilityThreshold.lt(FixidityLib.fixed1()),
      "Electability threshold must be lower than 100%"
    );
    emit ElectabilityThresholdSet(threshold);
    return true;
  }

  /**
   * @notice Gets the election threshold.
   * @return Threshold value as unwrapped fraction.
   */
  function getElectabilityThreshold() external view returns (uint256) {
    return electabilityThreshold.unwrap();
  }

  /**
   * @notice Increments the number of total and pending votes for `group`.
   * @param group The validator group to vote for.
   * @param value The amount of gold to use to vote.
   * @param lesser The group receiving fewer votes than `group`, or 0 if `group` has the
   *   fewest votes of any validator group.
   * @param greater The group receiving more votes than `group`, or 0 if `group` has the
   *   most votes of any validator group.
   * @return True upon success.
   * @dev Fails if `group` is empty or not a validator group.
   */
  function vote(
    address group,
    uint256 value,
    address lesser,
    address greater
  )
    external
    nonReentrant
    returns (bool)
  {
    require(votes.total.eligible.contains(group));
    require(0 < value && value <= getNumVotesReceivable(group));
    address account = getLockedGold().getAccountFromVoter(msg.sender);
    address[] storage groups = votes.groupsVotedFor[account];
    require(groups.length < maxNumGroupsVotedFor);
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      require(groups[i] != group);
    }
    groups.push(group);
    incrementPendingVotes(group, account, value);
    incrementTotalVotes(group, value, lesser, greater);
    getLockedGold().decrementNonvotingAccountBalance(account, value);
    emit ValidatorGroupVoteCast(account, group, value);
    return true;
  }

  /**
   * @notice Converts `account`'s pending votes for `group` to active votes.
   * @param group The validator group to vote for.
   * @return True upon success.
   */
  function activate(address group) external nonReentrant returns (bool) {
    address account = getLockedGold().getAccountFromVoter(msg.sender);
    PendingVotes storage pending = votes.pending;
    uint256 value = pending.balances[group][account];
    require(value > 0);
    decrementPendingVotes(group, account, value);
    incrementActiveVotes(group, account, value);
    emit ValidatorGroupVoteActivated(account, group, value);
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
   * @return True upon success.
   * @dev Fails if the account has not voted on a validator group.
   */
  function revokePending(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  )
    external
    nonReentrant
    returns (bool)
  {
    require(group != address(0));
    address account = getLockedGold().getAccountFromVoter(msg.sender);
    require(0 < value && value <= getAccountPendingVotesForGroup(group, account));
    decrementPendingVotes(group, account, value);
    decrementTotalVotes(group, value, lesser, greater);
    getLockedGold().incrementNonvotingAccountBalance(account, value);
    if (getAccountTotalVotesForGroup(group, account) == 0) {
      deleteElement(votes.groupsVotedFor[account], group, index);
    }
    emit ValidatorGroupVoteRevoked(account, group, value);
    return true;
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
   * @return True upon success.
   * @dev Fails if the account has not voted on a validator group.
   */
  function revokeActive(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  )
    external
    nonReentrant
    returns (bool)
  {
    require(group != address(0));
    address account = getLockedGold().getAccountFromVoter(msg.sender);
    require(0 < value && value <= getAccountActiveVotesForGroup(group, account));
    decrementActiveVotes(group, account, value);
    decrementTotalVotes(group, value, lesser, greater);
    getLockedGold().incrementNonvotingAccountBalance(account, value);
    if (getAccountTotalVotesForGroup(group, account) == 0) {
      deleteElement(votes.groupsVotedFor[account], group, index);
    }
    emit ValidatorGroupVoteRevoked(account, group, value);
    return true;
  }

  function getAccountTotalVotes(address account) external view returns (uint256) {
    uint256 total = 0;
    address[] memory groups = votes.groupsVotedFor[account];
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      total = total.add(getAccountTotalVotesForGroup(groups[i], account));
    }
    return total;
  }

  /**
   * @notice Returns the groups voted for by a particular account.
   * @param account The address of the account.
   * @return The groups voted for by a particular account.
   */
  function getAccountGroupsVotedFor(address account) external view returns (address[] memory) {
    return votes.groupsVotedFor[account];
  }

  /**
   * @notice Returns the pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The pending votes for `group` made by `account`.
   */
  function getAccountPendingVotesForGroup(
    address group,
    address account
  )
    public
    view
    returns (uint256)
  {
    return votes.pending.balances[group][account];
  }

  /**
   * @notice Returns the active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The active votes for `group` made by `account`.
   */
  function getAccountActiveVotesForGroup(
    address group,
    address account
  )
    public
    view
    returns (uint256)
  {
    uint256 numerator = votes.active.numerators[group][account].mul(votes.active.total[group]);
    if (numerator == 0) {
      return 0;
    }
    uint256 denominator = votes.active.denominators[group];
    return numerator.div(denominator);
  }

  /**
   * @notice Returns the total votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The total votes for `group` made by `account`.
   */
  function getAccountTotalVotesForGroup(
    address group,
    address account
  )
    public
    view
    returns (uint256)
  {
    uint256 pending = getAccountPendingVotesForGroup(group, account);
    uint256 active = getAccountActiveVotesForGroup(group, account);
    return pending.add(active);
  }

  /**
   * @notice Returns the total votes made for `group`.
   * @param group The address of the validator group.
   * @return The total votes made for `group`.
   */
  function getGroupTotalVotes(address group) external view returns (uint256) {
    return votes.pending.total[group].add(votes.active.total[group]);
  }

  function getGroupEligibility(address group) external view returns (bool) {
    return votes.total.eligible.contains(group);
  }

  /**
   * @notice Increments the number of total votes for `group` by `value`.
   * @param group The validator group whose vote total should be incremented.
   * @param value The number of votes to increment.
   * @param lesser The group receiving fewer votes than the group for which the vote was cast,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was cast,
   *   or 0 if that group has the most votes of any validator group.
   */
  function incrementTotalVotes(
    address group,
    uint256 value,
    address lesser,
    address greater
  )
    private
  {
    require(votes.total.eligible.contains(group));
    uint256 newVoteTotal = votes.total.eligible.getValue(group).add(value);
    votes.total.eligible.update(group, newVoteTotal, lesser, greater);
    votes.total.total = votes.total.total.add(value);
  }

  /**
   * @notice Decrements the number of total votes for `group` by `value`.
   * @param group The validator group whose vote total should be decremented.
   * @param value The number of votes to decrement.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *   or 0 if that group has the most votes of any validator group.
   */
  function decrementTotalVotes(
    address group,
    uint256 value,
    address lesser,
    address greater
  )
    private
  {
    if (votes.total.eligible.contains(group)) {
      uint256 newVoteTotal = votes.total.eligible.getValue(group).sub(value);
      votes.total.eligible.update(group, newVoteTotal, lesser, greater);
    }
    votes.total.total = votes.total.total.sub(value);
  }

  /**
   * @notice Marks a group ineligible for electing validators.
   * @param group The address of the validator group.
   * @dev Can only be called by the registered "Validators" contract.
   */
  function markGroupIneligible(
    address group
  )
    external
    onlyRegisteredContract(VALIDATORS_REGISTRY_ID)
  {
    votes.total.eligible.remove(group);
    emit ValidatorGroupMarkedIneligible(group);
  }

  /**
   * @notice Marks a group eligible for electing validators.
   * @param group The address of the validator group.
   * @param lesser The address of the group that has received fewer votes than this group.
   * @param greater The address of the group that has received more votes than this group.
   */
  function markGroupEligible(
    address group,
    address lesser,
    address greater
  )
    external
    returns (bool)
  {
    require(!votes.total.eligible.contains(group));
    require(getValidators().getGroupNumMembers(group) > 0);
    uint256 value = votes.pending.total[group].add(votes.active.total[group]);
    votes.total.eligible.insert(group, value, lesser, greater);
    emit ValidatorGroupMarkedEligible(group);
    return true;
  }

  /**
   * @notice Increments the number of pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function incrementPendingVotes(address group, address account, uint256 value) private {
    PendingVotes storage pending = votes.pending;
    pending.balances[group][account] = pending.balances[group][account].add(value);
    pending.timestamps[group][account] = now;
    pending.total[group] = pending.total[group].add(value);
  }

  /**
   * @notice Decrements the number of pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function decrementPendingVotes(address group, address account, uint256 value) private {
    PendingVotes storage pending = votes.pending;
    uint256 newValue = pending.balances[group][account].sub(value);
    pending.balances[group][account] = newValue;
    if (newValue == 0) {
      pending.timestamps[group][account] = 0;
    }
    pending.total[group] = pending.total[group].sub(value);
  }

  /**
   * @notice Increments the number of active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function incrementActiveVotes(address group, address account, uint256 value) private {
    uint256 delta = getActiveVotesDelta(group, value);
    ActiveVotes storage active = votes.active;
    active.numerators[group][account] = active.numerators[group][account].add(delta);
    active.denominators[group] = active.denominators[group].add(delta);
    active.total[group] = active.total[group].add(value);
  }

  /**
   * @notice Decrements the number of active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function decrementActiveVotes(address group, address account, uint256 value) private {
    uint256 delta = getActiveVotesDelta(group, value);
    ActiveVotes storage active = votes.active;
    active.numerators[group][account] = active.numerators[group][account].sub(delta);
    active.denominators[group] = active.denominators[group].sub(delta);
    active.total[group] = active.total[group].sub(value);
  }

  /**
   * @notice Returns the delta in active vote denominator for `group`.
   * @param group The address of the validator group.
   * @param value The numebr of active votes being added.
   * @return The delta in active vote denominator for `group`.
   */
  function getActiveVotesDelta(address group, uint256 value) private view returns (uint256) {
    // Preserve delta * total = value * denominator
    return value.mul(votes.active.denominators[group].add(1)).div(
      votes.active.total[group].add(1)
    );
  }

  function getGroupsVotedFor(address account) external view returns (address[] memory) {
    return votes.groupsVotedFor[account];
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
   * @notice Returns the number of votes that a group can receive.
   * @param group The address of the group.
   * @return The number of votes that a group can receive.
   */
  function getNumVotesReceivable(address group) public view returns (uint256) {
    uint256 totalLockedGold = getLockedGold().getTotalLockedGold();
    uint256 numerator = getValidators().getGroupNumMembers(group).add(1).mul(totalLockedGold);
    uint256 denominator = Math.min(
      maxElectableValidators,
      getValidators().getNumRegisteredValidators()
    );
    return numerator.div(denominator);
  }

  /**
   * @notice Returns the total votes received across all groups.
   * @return The total votes received across all groups.
   */
  function getTotalVotes() external view returns (uint256) {
    return votes.total.total;
  }

  /**
   * @notice Returns the list of validator groups eligible to elect validators.
   * @return The list of validator groups eligible to elect validators.
   */
  function getEligibleValidatorGroups() external view returns (address[] memory) {
    return votes.total.eligible.getKeys();
  }

  /**
   * @notice Returns lists of all validator groups and the number of votes they've received.
   * @return Lists of all validator groups and the number of votes they've received.
   */
  function getEligibleValidatorGroupsVoteTotals()
    external
    view
    returns (address[] memory, uint256[] memory)
  {
    return votes.total.eligible.getElements();
  }

  function validatorAddressFromCurrentSet(uint256 index) external view returns (address) {
    address validatorAddress;
    assembly {
      let newCallDataPosition := mload(0x40)
      mstore(newCallDataPosition, index)
      let success := staticcall(5000, 0xfa, newCallDataPosition, 32, 0, 0)
      returndatacopy(add(newCallDataPosition, 64), 0, 32)
      validatorAddress := mload(add(newCallDataPosition, 64))
    }

    return validatorAddress;
  }

  function numberValidatorsInCurrentSet() external view returns (uint256) {
    uint256 numberValidators;
    assembly {
      let success := staticcall(5000, 0xf9, 0, 0, 0, 0)
      let returnData := mload(0x40)
      returndatacopy(returnData, 0, 32)
      numberValidators := mload(returnData)
    }

    return numberValidators;
  }

  /**
   * @notice Returns a list of elected validators with seats allocated to groups via the D'Hondt
   *   method.
   * @return The list of elected validators.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   */
  function electValidators() external view returns (address[] memory) {
    // Only members of these validator groups are eligible for election.
    uint256 maxNumElectionGroups = Math.min(
      maxElectableValidators,
      votes.total.eligible.list.numElements
    );
    /*
    uint256 requiredVotes = electabilityThreshold.multiply(
      FixidityLib.newFixed(votes.total.total)
    ).fromFixed();
    */
    // TODO(asa): Filter by > requiredVotes
    address[] memory electionGroups = votes.total.eligible.headN(maxNumElectionGroups);
    uint256[] memory numMembers = getValidators().getGroupsNumMembers(electionGroups);
    // Holds the number of members elected for each of the eligible validator groups.
    uint256[] memory numMembersElected = new uint256[](electionGroups.length);
    uint256 totalNumMembersElected = 0;
    // Assign a number of seats to each validator group.
    while (totalNumMembersElected < maxElectableValidators) {
      uint256 groupIndex = 0;
      bool memberElected = false;
      (groupIndex, memberElected) = dHondt(electionGroups, numMembers, numMembersElected);

      if (memberElected) {
        numMembersElected[groupIndex] = numMembersElected[groupIndex].add(1);
        totalNumMembersElected = totalNumMembersElected.add(1);
      } else {
        break;
      }
    }
    require(totalNumMembersElected >= minElectableValidators);
    // Grab the top validators from each group that won seats.
    address[] memory electedValidators = new address[](totalNumMembersElected);
    totalNumMembersElected = 0;
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      // We use the validating delegate if one is set.
      address[] memory electedGroupValidators = getValidators().getTopValidatorsFromGroup(
        electionGroups[i],
        numMembersElected[i]
      );
      for (uint256 j = 0; j < electedGroupValidators.length; j = j.add(1)) {
        electedValidators[totalNumMembersElected] = electedGroupValidators[j];
        totalNumMembersElected = totalNumMembersElected.add(1);
      }
    }
    // Shuffle the validator set using validator-supplied entropy
    bytes32 r = getRandom().random();
    for (uint256 i = electedValidators.length - 1; i > 0; i = i.sub(1)) {
      uint256 j = uint256(r) % (i + 1);
      (electedValidators[i], electedValidators[j]) = (electedValidators[j], electedValidators[i]);
      r = keccak256(abi.encodePacked(r));
    }

    return electedValidators;
  }

  /**
   * @notice Runs a round of the D'Hondt algorithm.
   * @param electionGroups The addresses of the validator groups in the election.
   * @param numMembers The number of members in each group.
   * @param numMembersElected The number of members elected in each group up to this point.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   * @return Whether or not a group elected a member, and the index of the group if so.
   */
  function dHondt(
    address[] memory electionGroups,
    uint256[] memory numMembers,
    uint256[] memory numMembersElected
  )
    private
    view
    returns (uint256, bool)
  {
    bool memberElected = false;
    uint256 groupIndex = 0;
    FixidityLib.Fraction memory maxN = FixidityLib.wrap(0);
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      address group = electionGroups[i];
      // Only consider groups with members left to be elected.
      if (numMembers[i] > numMembersElected[i]) {
        FixidityLib.Fraction memory n = FixidityLib.newFixed(
          votes.total.eligible.getValue(group)
        ).divide(
          FixidityLib.newFixed(numMembersElected[i].add(1))
        );
        if (n.gt(maxN)) {
          maxN = n;
          groupIndex = i;
          memberElected = true;
        }
      }
    }
    return (groupIndex, memberElected);
  }
}

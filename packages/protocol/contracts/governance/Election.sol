pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "./interfaces/IElection.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/AddressSortedLinkedList.sol";
import "../common/UsingPrecompiles.sol";
import "../common/UsingRegistry.sol";

contract Election is
  IElection,
  Ownable,
  ReentrancyGuard,
  Initializable,
  UsingRegistry,
  UsingPrecompiles
{
  using AddressSortedLinkedList for SortedLinkedList.List;
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  struct PendingVote {
    // The value of the vote, in gold.
    uint256 value;
    // The epoch at which the vote was cast.
    uint256 epoch;
  }

  struct GroupPendingVotes {
    // The total number of pending votes that have been cast for this group.
    uint256 total;
    // Pending votes cast per voter.
    mapping(address => PendingVote) byAccount;
  }

  // Pending votes are those for which no following elections have been held.
  // These votes have yet to contribute to the election of validators and thus do not accrue
  // rewards.
  struct PendingVotes {
    // The total number of pending votes cast across all groups.
    uint256 total;
    mapping(address => GroupPendingVotes) forGroup;
  }

  struct GroupActiveVotes {
    // The total number of active votes that have been cast for this group.
    uint256 total;
    // The total number of active votes by a voter is equal to the number of active vote units for
    // that voter times the total number of active votes divided by the total number of active
    // vote units.
    uint256 totalUnits;
    mapping(address => uint256) unitsByAccount;
  }

  // Active votes are those for which at least one following election has been held.
  // These votes have contributed to the election of validators and thus accrue rewards.
  struct ActiveVotes {
    // The total number of active votes cast across all groups.
    uint256 total;
    mapping(address => GroupActiveVotes) forGroup;
  }

  struct TotalVotes {
    // A list of eligible ValidatorGroups sorted by total (pending+active) votes.
    // Note that this list will omit ineligible ValidatorGroups, including those that may have > 0
    // total votes.
    SortedLinkedList.List eligible;
  }

  struct Votes {
    PendingVotes pending;
    ActiveVotes active;
    TotalVotes total;
    // Maps an account to the list of groups it's voting for.
    mapping(address => address[]) groupsVotedFor;
  }

  struct ElectableValidators {
    uint256 min;
    uint256 max;
  }

  Votes private votes;
  // Governs the minimum and maximum number of validators that can be elected.
  ElectableValidators public electableValidators;
  // Governs how many validator groups a single account can vote for.
  uint256 public maxNumGroupsVotedFor;
  // Groups must receive at least this fraction of the total votes in order to be considered in
  // elections.
  FixidityLib.Fraction public electabilityThreshold;

  event ElectableValidatorsSet(uint256 min, uint256 max);

  event MaxNumGroupsVotedForSet(uint256 maxNumGroupsVotedFor);

  event ElectabilityThresholdSet(uint256 electabilityThreshold);

  event ValidatorGroupMarkedEligible(address group);

  event ValidatorGroupMarkedIneligible(address group);

  event ValidatorGroupVoteCast(address indexed account, address indexed group, uint256 value);

  event ValidatorGroupVoteActivated(address indexed account, address indexed group, uint256 value);

  event ValidatorGroupVoteRevoked(address indexed account, address indexed group, uint256 value);

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param minElectableValidators The minimum number of validators that can be elected.
   * @param _maxNumGroupsVotedFor The maximum number of groups that an acconut can vote for at once.
   * @param _electabilityThreshold The minimum ratio of votes a group needs before its members can
   *   be elected.
   * @dev Should be called only once.
   */
  function initialize(
    address registryAddress,
    uint256 minElectableValidators,
    uint256 maxElectableValidators,
    uint256 _maxNumGroupsVotedFor,
    uint256 _electabilityThreshold
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setElectableValidators(minElectableValidators, maxElectableValidators);
    setMaxNumGroupsVotedFor(_maxNumGroupsVotedFor);
    setElectabilityThreshold(_electabilityThreshold);
  }

  /**
   * @notice Updates the minimum and maximum number of validators that can be elected.
   * @param min The minimum number of validators that can be elected.
   * @param max The maximum number of validators that can be elected.
   * @return True upon success.
   */
  function setElectableValidators(uint256 min, uint256 max) public onlyOwner returns (bool) {
    require(0 < min && min <= max);
    require(min != electableValidators.min || max != electableValidators.max);
    electableValidators = ElectableValidators(min, max);
    emit ElectableValidatorsSet(min, max);
    return true;
  }

  /**
   * @notice Returns the minimum and maximum number of validators that can be elected.
   * @return The minimum and maximum number of validators that can be elected.
   */
  function getElectableValidators() external view returns (uint256, uint256) {
    return (electableValidators.min, electableValidators.max);
  }

  /**
   * @notice Updates the maximum number of groups an account can be voting for at once.
   * @param _maxNumGroupsVotedFor The maximum number of groups an account can vote for.
   * @return True upon success.
   */
  function setMaxNumGroupsVotedFor(uint256 _maxNumGroupsVotedFor) public onlyOwner returns (bool) {
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
  function setElectabilityThreshold(uint256 threshold) public onlyOwner returns (bool) {
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
  function vote(address group, uint256 value, address lesser, address greater)
    external
    nonReentrant
    returns (bool)
  {
    require(votes.total.eligible.contains(group));
    require(0 < value);
    require(canReceiveVotes(group, value));
    address account = getAccounts().voteSignerToAccount(msg.sender);

    // Add group to the groups voted for by the account.
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
   * @dev Pending votes cannot be activated until an election has been held.
   */
  function activate(address group) external nonReentrant returns (bool) {
    address account = getAccounts().voteSignerToAccount(msg.sender);
    PendingVote storage pendingVote = votes.pending.forGroup[group].byAccount[account];
    require(pendingVote.epoch < getEpochNumber());
    uint256 value = pendingVote.value;
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
  ) external nonReentrant returns (bool) {
    require(group != address(0));
    address account = getAccounts().voteSignerToAccount(msg.sender);
    require(0 < value && value <= getPendingVotesForGroupByAccount(group, account));
    decrementPendingVotes(group, account, value);
    decrementTotalVotes(group, value, lesser, greater);
    getLockedGold().incrementNonvotingAccountBalance(account, value);
    if (getTotalVotesForGroupByAccount(group, account) == 0) {
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
  ) external nonReentrant returns (bool) {
    // TODO(asa): Dedup with revokePending.
    require(group != address(0));
    address account = getAccounts().voteSignerToAccount(msg.sender);
    require(0 < value && value <= getActiveVotesForGroupByAccount(group, account));
    decrementActiveVotes(group, account, value);
    decrementTotalVotes(group, value, lesser, greater);
    getLockedGold().incrementNonvotingAccountBalance(account, value);
    if (getTotalVotesForGroupByAccount(group, account) == 0) {
      deleteElement(votes.groupsVotedFor[account], group, index);
    }
    emit ValidatorGroupVoteRevoked(account, group, value);
    return true;
  }

  /**
   * @notice Returns the total number of votes cast by an account.
   * @param account The address of the account.
   * @return The total number of votes cast by an account.
   */
  function getTotalVotesByAccount(address account) external view returns (uint256) {
    uint256 total = 0;
    address[] memory groups = votes.groupsVotedFor[account];
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      total = total.add(getTotalVotesForGroupByAccount(groups[i], account));
    }
    return total;
  }

  /**
   * @notice Returns the pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The pending votes for `group` made by `account`.
   */
  function getPendingVotesForGroupByAccount(address group, address account)
    public
    view
    returns (uint256)
  {
    return votes.pending.forGroup[group].byAccount[account].value;
  }

  /**
   * @notice Returns the active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The active votes for `group` made by `account`.
   */
  function getActiveVotesForGroupByAccount(address group, address account)
    public
    view
    returns (uint256)
  {
    GroupActiveVotes storage groupActiveVotes = votes.active.forGroup[group];
    uint256 numerator = groupActiveVotes.unitsByAccount[account].mul(groupActiveVotes.total);
    if (numerator == 0) {
      return 0;
    }
    uint256 denominator = groupActiveVotes.totalUnits;
    return numerator.div(denominator);
  }

  /**
   * @notice Returns the total votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The total votes for `group` made by `account`.
   */
  function getTotalVotesForGroupByAccount(address group, address account)
    public
    view
    returns (uint256)
  {
    uint256 pending = getPendingVotesForGroupByAccount(group, account);
    uint256 active = getActiveVotesForGroupByAccount(group, account);
    return pending.add(active);
  }

  /**
   * @notice Returns the total votes made for `group`.
   * @param group The address of the validator group.
   * @return The total votes made for `group`.
   */
  function getTotalVotesForGroup(address group) public view returns (uint256) {
    return votes.pending.forGroup[group].total.add(votes.active.forGroup[group].total);
  }

  /**
   * @notice Returns whether or not a group is eligible to receive votes.
   * @return Whether or not a group is eligible to receive votes.
   * @dev Eligible groups that have received their maximum number of votes cannot receive more.
   */
  function getGroupEligibility(address group) external view returns (bool) {
    return votes.total.eligible.contains(group);
  }

  /**
   * @notice Returns the amount of rewards that voters for `group` are due at the end of an epoch.
   * @param group The group to calculate epoch rewards for.
   * @param totalEpochRewards The total amount of rewards going to all voters.
   * @return The amount of rewards that voters for `group` are due at the end of an epoch.
   * @dev Eligible groups that have received their maximum number of votes cannot receive more.
   */
  function getGroupEpochRewards(address group, uint256 totalEpochRewards)
    external
    view
    returns (uint256)
  {
    // The group must meet the balance requirements in order for their voters to receive epoch
    // rewards.
    if (getValidators().meetsAccountLockedGoldRequirements(group) && votes.active.total > 0) {
      return totalEpochRewards.mul(votes.active.forGroup[group].total).div(votes.active.total);
    } else {
      return 0;
    }
  }

  /**
   * @notice Distributes epoch rewards to voters for `group` in the form of active votes.
   * @param group The group whose voters will receive rewards.
   * @param value The amount of rewards to distribute to voters for the group.
   * @param lesser The group receiving fewer votes than `group` after the rewards are added.
   * @param greater The group receiving more votes than `group` after the rewards are added.
   * @dev Can only be called directly by the protocol.
   */
  function distributeEpochRewards(address group, uint256 value, address lesser, address greater)
    external
  {
    require(msg.sender == address(0));
    _distributeEpochRewards(group, value, lesser, greater);
  }

  /**
   * @notice Distributes epoch rewards to voters for `group` in the form of active votes.
   * @param group The group whose voters will receive rewards.
   * @param value The amount of rewards to distribute to voters for the group.
   * @param lesser The group receiving fewer votes than `group` after the rewards are added.
   * @param greater The group receiving more votes than `group` after the rewards are added.
   */
  function _distributeEpochRewards(address group, uint256 value, address lesser, address greater)
    internal
  {
    if (votes.total.eligible.contains(group)) {
      uint256 newVoteTotal = votes.total.eligible.getValue(group).add(value);
      votes.total.eligible.update(group, newVoteTotal, lesser, greater);
    }

    votes.active.forGroup[group].total = votes.active.forGroup[group].total.add(value);
    votes.active.total = votes.active.total.add(value);
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
  function incrementTotalVotes(address group, uint256 value, address lesser, address greater)
    private
  {
    uint256 newVoteTotal = votes.total.eligible.getValue(group).add(value);
    votes.total.eligible.update(group, newVoteTotal, lesser, greater);
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
  function decrementTotalVotes(address group, uint256 value, address lesser, address greater)
    private
  {
    if (votes.total.eligible.contains(group)) {
      uint256 newVoteTotal = votes.total.eligible.getValue(group).sub(value);
      votes.total.eligible.update(group, newVoteTotal, lesser, greater);
    }
  }

  /**
   * @notice Marks a group ineligible for electing validators.
   * @param group The address of the validator group.
   * @dev Can only be called by the registered "Validators" contract.
   */
  function markGroupIneligible(address group)
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
  function markGroupEligible(address group, address lesser, address greater)
    external
    onlyRegisteredContract(VALIDATORS_REGISTRY_ID)
  {
    uint256 value = getTotalVotesForGroup(group);
    votes.total.eligible.insert(group, value, lesser, greater);
    emit ValidatorGroupMarkedEligible(group);
  }

  /**
   * @notice Increments the number of pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function incrementPendingVotes(address group, address account, uint256 value) private {
    PendingVotes storage pending = votes.pending;
    pending.total = pending.total.add(value);

    GroupPendingVotes storage groupPending = pending.forGroup[group];
    groupPending.total = groupPending.total.add(value);

    PendingVote storage pendingVote = groupPending.byAccount[account];
    pendingVote.value = pendingVote.value.add(value);
    pendingVote.epoch = getEpochNumber();
  }

  /**
   * @notice Decrements the number of pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function decrementPendingVotes(address group, address account, uint256 value) private {
    PendingVotes storage pending = votes.pending;
    pending.total = pending.total.sub(value);

    GroupPendingVotes storage groupPending = pending.forGroup[group];
    groupPending.total = groupPending.total.sub(value);

    PendingVote storage pendingVote = groupPending.byAccount[account];
    pendingVote.value = pendingVote.value.sub(value);
    if (pendingVote.value == 0) {
      pendingVote.epoch = 0;
    }
  }

  /**
   * @notice Increments the number of active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function incrementActiveVotes(address group, address account, uint256 value) private {
    ActiveVotes storage active = votes.active;
    active.total = active.total.add(value);

    uint256 unitsDelta = getActiveVotesUnitsDelta(group, value);

    GroupActiveVotes storage groupActive = active.forGroup[group];
    groupActive.total = groupActive.total.add(value);

    groupActive.totalUnits = groupActive.totalUnits.add(unitsDelta);
    groupActive.unitsByAccount[account] = groupActive.unitsByAccount[account].add(unitsDelta);
  }

  /**
   * @notice Decrements the number of active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function decrementActiveVotes(address group, address account, uint256 value) private {
    ActiveVotes storage active = votes.active;
    active.total = active.total.sub(value);

    uint256 unitsDelta = getActiveVotesUnitsDelta(group, value);

    GroupActiveVotes storage groupActive = active.forGroup[group];
    groupActive.total = groupActive.total.sub(value);

    groupActive.totalUnits = groupActive.totalUnits.sub(unitsDelta);
    groupActive.unitsByAccount[account] = groupActive.unitsByAccount[account].sub(unitsDelta);
  }

  /**
   * @notice Returns the delta in active vote denominator for `group`.
   * @param group The address of the validator group.
   * @param value The number of active votes being added.
   * @return The delta in active vote denominator for `group`.
   * @dev Preserves unitsDelta / totalUnits = value / total
   */
  function getActiveVotesUnitsDelta(address group, uint256 value) private view returns (uint256) {
    if (votes.active.forGroup[group].total == 0) {
      return value;
    } else {
      return
        value.mul(votes.active.forGroup[group].totalUnits).div(votes.active.forGroup[group].total);
    }
  }

  /**
   * @notice Returns the groups that `account` has voted for.
   * @param account The address of the account casting votes.
   * @return The groups that `account` has voted for.
   */
  function getGroupsVotedForByAccount(address account) external view returns (address[] memory) {
    return votes.groupsVotedFor[account];
  }

  /**
   * @notice Deletes an element from a list of addresses.
   * @param list The list of addresses.
   * @param element The address to delete.
   * @param index The index of `element` in the list.
   */
  function deleteElement(address[] storage list, address element, uint256 index) private {
    // TODO(asa): Move this to a library to be shared.
    require(index < list.length && list[index] == element);
    uint256 lastIndex = list.length.sub(1);
    list[index] = list[lastIndex];
    list.length = lastIndex;
  }

  /**
   * @notice Returns whether or not a group can receive the specified number of votes.
   * @param group The address of the group.
   * @param value The number of votes.
   * @return Whether or not a group can receive the specified number of votes.
   * @dev Votes are not allowed to be cast that would increase a group's proportion of locked gold
   *   voting for it to greater than
   *   (numGroupMembers + 1) / min(maxElectableValidators, numRegisteredValidators)
   * @dev Note that groups may still receive additional votes via rewards even if this function
   *   returns false.
   */
  function canReceiveVotes(address group, uint256 value) public view returns (bool) {
    uint256 totalVotesForGroup = getTotalVotesForGroup(group).add(value);
    uint256 left = totalVotesForGroup.mul(
      Math.min(electableValidators.max, getValidators().getNumRegisteredValidators())
    );
    uint256 right = getValidators().getGroupNumMembers(group).add(1).mul(
      getLockedGold().getTotalLockedGold()
    );
    return left <= right;
  }

  /**
   * @notice Returns the number of votes that a group can receive.
   * @param group The address of the group.
   * @return The number of votes that a group can receive.
   * @dev Votes are not allowed to be cast that would increase a group's proportion of locked gold
   *   voting for it to greater than
   *   (numGroupMembers + 1) / min(maxElectableValidators, numRegisteredValidators)
   * @dev Note that a group's vote total may exceed this number through rewards or config changes.
   */
  function getNumVotesReceivable(address group) external view returns (uint256) {
    uint256 numerator = getValidators().getGroupNumMembers(group).add(1).mul(
      getLockedGold().getTotalLockedGold()
    );
    uint256 denominator = Math.min(
      electableValidators.max,
      getValidators().getNumRegisteredValidators()
    );
    return numerator.div(denominator);
  }

  /**
   * @notice Returns the total votes received across all groups.
   * @return The total votes received across all groups.
   */
  function getTotalVotes() public view returns (uint256) {
    return votes.active.total.add(votes.pending.total);
  }

  /**
   * @notice Returns the active votes received across all groups.
   * @return The active votes received across all groups.
   */
  function getActiveVotes() public view returns (uint256) {
    return votes.active.total;
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
  function getTotalVotesForEligibleValidatorGroups()
    external
    view
    returns (address[] memory groups, uint256[] memory values)
  {
    return votes.total.eligible.getElements();
  }

  /**
   * @notice Returns a list of elected validators with seats allocated to groups via the D'Hondt
   *   method.
   * @return The list of elected validators.
   * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
   */
  function electValidatorSigners() external view returns (address[] memory) {
    // Groups must have at least `electabilityThreshold` proportion of the total votes to be
    // considered for the election.
    uint256 requiredVotes = electabilityThreshold
      .multiply(FixidityLib.newFixed(getTotalVotes()))
      .fromFixed();
    // Only consider groups with at least `requiredVotes` but do not consider more groups than the
    // max number of electable validators.
    uint256 numElectionGroups = votes.total.eligible.numElementsGreaterThan(
      requiredVotes,
      electableValidators.max
    );
    address[] memory electionGroups = votes.total.eligible.headN(numElectionGroups);
    uint256[] memory numMembers = getValidators().getGroupsNumMembers(electionGroups);
    // Holds the number of members elected for each of the eligible validator groups.
    uint256[] memory numMembersElected = new uint256[](electionGroups.length);
    uint256 totalNumMembersElected = 0;
    // Assign a number of seats to each validator group.
    while (totalNumMembersElected < electableValidators.max) {
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
    require(totalNumMembersElected >= electableValidators.min);
    // Grab the top validators from each group that won seats.
    address[] memory electedValidators = new address[](totalNumMembersElected);
    totalNumMembersElected = 0;
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      // We use the validating delegate if one is set.
      address[] memory electedGroupValidators = getValidators().getTopGroupValidators(
        electionGroups[i],
        numMembersElected[i]
      );
      for (uint256 j = 0; j < electedGroupValidators.length; j = j.add(1)) {
        electedValidators[totalNumMembersElected] = electedGroupValidators[j];
        totalNumMembersElected = totalNumMembersElected.add(1);
      }
    }
    // Shuffle the validator set using validator-supplied entropy
    return shuffleArray(electedValidators);
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
  ) private view returns (uint256, bool) {
    bool memberElected = false;
    uint256 groupIndex = 0;
    FixidityLib.Fraction memory maxN = FixidityLib.wrap(0);
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      address group = electionGroups[i];
      // Only consider groups with members left to be elected.
      if (numMembers[i] > numMembersElected[i]) {
        FixidityLib.Fraction memory n = FixidityLib
          .newFixed(votes.total.eligible.getValue(group))
          .divide(FixidityLib.newFixed(numMembersElected[i].add(1)));
        if (n.gt(maxN)) {
          maxN = n;
          groupIndex = i;
          memberElected = true;
        }
      }
    }
    return (groupIndex, memberElected);
  }

  /**
   * @notice Randomly permutes an array of addresses.
   * @param array The array to permute.
   * @return The permuted array.
   */
  function shuffleArray(address[] memory array) private view returns (address[] memory) {
    bytes32 r = getRandom().getBlockRandomness(block.number);
    for (uint256 i = array.length - 1; i > 0; i = i.sub(1)) {
      uint256 j = uint256(r) % (i + 1);
      (array[i], array[j]) = (array[j], array[i]);
      r = keccak256(abi.encodePacked(r));
    }
    return array;
  }

  /**
   * @notice Returns get current validators using the precompile.
   * @return List of current validators.
   */
  function currentValidators() public view returns (address[] memory) {
    uint256 n = numberValidatorsInCurrentSet();
    address[] memory res = new address[](n);
    for (uint256 idx = 0; idx < n; idx++) {
      res[idx] = validatorAddressFromCurrentSet(idx);
    }
    return res;
  }
}

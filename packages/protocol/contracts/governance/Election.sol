pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IElection.sol";
import "../common/CalledByVm.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/AddressSortedLinkedList.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/Heap.sol";
import "../common/libraries/ReentrancyGuard.sol";

contract Election is
  IElection,
  ICeloVersionedContract,
  Ownable,
  ReentrancyGuard,
  Initializable,
  UsingRegistry,
  CalledByVm
{
  using AddressSortedLinkedList for SortedLinkedList.List;
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  // 1e20 ensures that units can be represented as precisely as possible to avoid rounding errors
  // when translating to votes, without risking integer overflow.
  // A maximum of 1,000,000,000 CELO (1e27) yields a maximum of 1e47 units, whose product is at
  // most 1e74, which is less than 2^256.
  uint256 private constant UNIT_PRECISION_FACTOR = 100000000000000000000;

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

  struct CachedVotes {
    // group => votes
    mapping(address => uint256) cachedVotesPerGroup;
    uint256 totalVotes;
  }

  Votes internal votes;
  // Governs the minimum and maximum number of validators that can be elected.
  ElectableValidators public electableValidators;
  // Governs how many validator groups a single account can vote for.
  uint256 public maxNumGroupsVotedFor;
  // Groups must receive at least this fraction of the total votes in order to be considered in
  // elections.
  FixidityLib.Fraction public electabilityThreshold;

  // If set to true for account, the account is able to vote for more
  // than max number of groups voted for.
  mapping(address => bool) public allowedToVoteOverMaxNumberOfGroups;

  mapping(address => CachedVotes) public cachedVotesByAccount;

  event ElectableValidatorsSet(uint256 min, uint256 max);
  event MaxNumGroupsVotedForSet(uint256 maxNumGroupsVotedFor);
  event ElectabilityThresholdSet(uint256 electabilityThreshold);
  event AllowedToVoteOverMaxNumberOfGroups(address indexed account, bool flag);
  event ValidatorGroupMarkedEligible(address indexed group);
  event ValidatorGroupMarkedIneligible(address indexed group);
  event ValidatorGroupVoteCast(address indexed account, address indexed group, uint256 value);
  event ValidatorGroupVoteActivated(
    address indexed account,
    address indexed group,
    uint256 value,
    uint256 units
  );
  event ValidatorGroupPendingVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value
  );
  event ValidatorGroupActiveVoteRevoked(
    address indexed account,
    address indexed group,
    uint256 value,
    uint256 units
  );
  event EpochRewardsDistributedToVoters(address indexed group, uint256 value);

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 3, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param minElectableValidators The minimum number of validators that can be elected.
   * @param _maxNumGroupsVotedFor The maximum number of groups that an account can vote for at once.
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
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Updates the minimum and maximum number of validators that can be elected.
   * @param min The minimum number of validators that can be elected.
   * @param max The maximum number of validators that can be elected.
   * @return True upon success.
   */
  function setElectableValidators(uint256 min, uint256 max) public onlyOwner returns (bool) {
    require(0 < min, "Minimum electable validators cannot be zero");
    require(min <= max, "Maximum electable validators cannot be smaller than minimum");
    require(
      min != electableValidators.min || max != electableValidators.max,
      "Electable validators not changed"
    );
    electableValidators = ElectableValidators(min, max);
    emit ElectableValidatorsSet(min, max);
    return true;
  }

  /**
   * @notice Returns the minimum and maximum number of validators that can be elected.
   * @return The minimum number of validators that can be elected.
   * @return The maximum number of validators that can be elected.
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
    require(_maxNumGroupsVotedFor != maxNumGroupsVotedFor, "Max groups voted for not changed");
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
    require(group != address(0), "Group address zero");
    address account = getAccounts().voteSignerToAccount(msg.sender);
    require(0 < value, "Vote value cannot be zero");
    require(
      value <= getPendingVotesForGroupByAccount(group, account),
      "Vote value larger than pending votes"
    );
    decrementPendingVotes(group, account, value);
    decrementTotalVotes(account, group, value, lesser, greater);
    getLockedGold().incrementNonvotingAccountBalance(account, value);
    if (getTotalVotesForGroupByAccount(group, account) == 0) {
      deleteElement(votes.groupsVotedFor[account], group, index);
    }
    emit ValidatorGroupPendingVoteRevoked(account, group, value);
    return true;
  }

  /**
   * @notice Revokes all active votes for `group`
   * @param group The validator group to revoke votes from.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *   or 0 if that group has the most votes of any validator group.
   * @param index The index of the group in the account's voting list.
   * @return True upon success.
   * @dev Fails if the account has not voted on a validator group.
   */
  function revokeAllActive(address group, address lesser, address greater, uint256 index)
    external
    nonReentrant
    returns (bool)
  {
    address account = getAccounts().voteSignerToAccount(msg.sender);
    uint256 value = getActiveVotesForGroupByAccount(group, account);
    return _revokeActive(group, value, lesser, greater, index);
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
    return _revokeActive(group, value, lesser, greater, index);
  }

  function _revokeActive(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) internal returns (bool) {
    // TODO(asa): Dedup with revokePending.
    require(group != address(0), "Group address zero");
    address account = getAccounts().voteSignerToAccount(msg.sender);
    require(0 < value, "Vote value cannot be zero");
    require(
      value <= getActiveVotesForGroupByAccount(group, account),
      "Vote value larger than active votes"
    );
    uint256 units = decrementActiveVotes(group, account, value);
    decrementTotalVotes(account, group, value, lesser, greater);
    getLockedGold().incrementNonvotingAccountBalance(account, value);
    if (getTotalVotesForGroupByAccount(group, account) == 0) {
      deleteElement(votes.groupsVotedFor[account], group, index);
    }
    emit ValidatorGroupActiveVoteRevoked(account, group, value, units);
    return true;
  }

  /**
   * @notice Decrements `value` pending or active votes for `group` from `account`.
   *         First revokes all pending votes and then, if `value` votes haven't
   *         been revoked yet, revokes additional active votes.
   *         Fundamentally calls `revokePending` and `revokeActive` but only resorts groups once.
   * @param account The account whose votes to `group` should be decremented.
   * @param group The validator group to decrement votes from.
   * @param maxValue The maxinum number of votes to decrement and revoke.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *               or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *                or 0 if that group has the most votes of any validator group.
   * @param index The index of the group in the account's voting list.
   * @return uint256 Number of votes successfully decremented and revoked, with a max of `value`.
   */
  function _decrementVotes(
    address account,
    address group,
    uint256 maxValue,
    address lesser,
    address greater,
    uint256 index
  ) internal returns (uint256) {
    uint256 remainingValue = maxValue;
    uint256 pendingVotes = getPendingVotesForGroupByAccount(group, account);
    if (pendingVotes > 0) {
      uint256 decrementValue = Math.min(remainingValue, pendingVotes);
      decrementPendingVotes(group, account, decrementValue);
      emit ValidatorGroupPendingVoteRevoked(account, group, decrementValue);
      remainingValue = remainingValue.sub(decrementValue);
    }
    uint256 activeVotes = getActiveVotesForGroupByAccount(group, account);
    if (activeVotes > 0 && remainingValue > 0) {
      uint256 decrementValue = Math.min(remainingValue, activeVotes);
      uint256 units = decrementActiveVotes(group, account, decrementValue);
      emit ValidatorGroupActiveVoteRevoked(account, group, decrementValue, units);
      remainingValue = remainingValue.sub(decrementValue);
    }
    uint256 decrementedValue = maxValue.sub(remainingValue);
    if (decrementedValue > 0) {
      decrementTotalVotes(account, group, decrementedValue, lesser, greater);
      if (getTotalVotesForGroupByAccount(group, account) == 0) {
        deleteElement(votes.groupsVotedFor[account], group, index);
      }
    }
    return decrementedValue;
  }

  /**
   * @notice Returns the total number of votes cast by an account.
   * @param account The address of the account.
   * @return The total number of votes cast by an account.
   */
  function getTotalVotesByAccount(address account) external view returns (uint256) {
    address[] memory groups = votes.groupsVotedFor[account];

    if (groups.length > maxNumGroupsVotedFor) {
      return cachedVotesByAccount[account].totalVotes;
    }

    uint256 total = 0;
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      total = total.add(getTotalVotesForGroupByAccount(groups[i], account));
    }
    return total;
  }

  /**
   * @notice Counts and caches account's votes for group.
   * @param account The address of the voting account.
   * @param group The address of the validator group.
   */
  function updateTotalVotesByAccountForGroup(address account, address group) public {
    cachedVotesByAccount[account].totalVotes -= cachedVotesByAccount[account]
      .cachedVotesPerGroup[group];
    uint256 newTotalVotesForGroupByAccount = getTotalVotesForGroupByAccount(group, account);
    cachedVotesByAccount[account].cachedVotesPerGroup[group] = newTotalVotesForGroupByAccount;
    cachedVotesByAccount[account].totalVotes += newTotalVotesForGroupByAccount;
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
    return unitsToVotes(group, votes.active.forGroup[group].unitsByAccount[account]);
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
   * @notice Returns the active vote units for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @return The active vote units for `group` made by `account`.
   */
  function getActiveVoteUnitsForGroupByAccount(address group, address account)
    external
    view
    returns (uint256)
  {
    return votes.active.forGroup[group].unitsByAccount[account];
  }

  /**
   * @notice Returns the total active vote units made for `group`.
   * @param group The address of the validator group.
   * @return The total active vote units made for `group`.
   */
  function getActiveVoteUnitsForGroup(address group) external view returns (uint256) {
    return votes.active.forGroup[group].totalUnits;
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
   * @notice Returns the active votes made for `group`.
   * @param group The address of the validator group.
   * @return The active votes made for `group`.
   */
  function getActiveVotesForGroup(address group) public view returns (uint256) {
    return votes.active.forGroup[group].total;
  }

  /**
   * @notice Returns the pending votes made for `group`.
   * @param group The address of the validator group.
   * @return The pending votes made for `group`.
   */
  function getPendingVotesForGroup(address group) public view returns (uint256) {
    return votes.pending.forGroup[group].total;
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
   * @notice Increments the number of total votes for `group` by `value`.
   * @param group The validator group whose vote total should be incremented.
   * @param value The number of votes to increment.
   * @param lesser The group receiving fewer votes than the group for which the vote was cast,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was cast,
   *   or 0 if that group has the most votes of any validator group.
   */
  function incrementTotalVotes(
    address account,
    address group,
    uint256 value,
    address lesser,
    address greater
  ) internal {
    uint256 newVoteTotal = votes.total.eligible.getValue(group).add(value);
    votes.total.eligible.update(group, newVoteTotal, lesser, greater);

    if (allowedToVoteOverMaxNumberOfGroups[account]) {
      updateTotalVotesByAccountForGroup(account, group);
    }
  }

  /**
   * @notice Decrements the number of total votes for `group` by `value`.
   * @param account The address of the voting account.
   * @param group The validator group whose vote total should be decremented.
   * @param value The number of votes to decrement.
   * @param lesser The group receiving fewer votes than the group for which the vote was revoked,
   *   or 0 if that group has the fewest votes of any validator group.
   * @param greater The group receiving more votes than the group for which the vote was revoked,
   *   or 0 if that group has the most votes of any validator group.
   */
  function decrementTotalVotes(
    address account,
    address group,
    uint256 value,
    address lesser,
    address greater
  ) internal {
    if (votes.total.eligible.contains(group)) {
      uint256 newVoteTotal = votes.total.eligible.getValue(group).sub(value);
      votes.total.eligible.update(group, newVoteTotal, lesser, greater);
    }

    if (allowedToVoteOverMaxNumberOfGroups[account]) {
      updateTotalVotesByAccountForGroup(account, group);
    }
  }

  /**
   * @notice Increments the number of pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function incrementPendingVotes(address group, address account, uint256 value) internal {
    PendingVotes storage pending = votes.pending;
    pending.total = pending.total.add(value);

    GroupPendingVotes storage groupPending = pending.forGroup[group];
    groupPending.total = groupPending.total.add(value);

    PendingVote storage pendingVote = groupPending.byAccount[account];
    pendingVote.value = pendingVote.value.add(value);
  }

  /**
   * @notice Decrements the number of pending votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function decrementPendingVotes(address group, address account, uint256 value) internal {
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
  function incrementActiveVotes(address group, address account, uint256 value)
    internal
    returns (uint256)
  {
    ActiveVotes storage active = votes.active;
    active.total = active.total.add(value);

    uint256 units = votesToUnits(group, value);

    GroupActiveVotes storage groupActive = active.forGroup[group];
    groupActive.total = groupActive.total.add(value);

    groupActive.totalUnits = groupActive.totalUnits.add(units);
    groupActive.unitsByAccount[account] = groupActive.unitsByAccount[account].add(units);
    return units;
  }

  /**
   * @notice Decrements the number of active votes for `group` made by `account`.
   * @param group The address of the validator group.
   * @param account The address of the voting account.
   * @param value The number of votes.
   */
  function decrementActiveVotes(address group, address account, uint256 value)
    private
    returns (uint256)
  {
    ActiveVotes storage active = votes.active;
    active.total = active.total.sub(value);

    // Rounding may cause votesToUnits to return 0 for value != 0, preventing users
    // from revoking the last of their votes. The case where value == votes is special cased
    // to prevent this.
    uint256 units = 0;
    uint256 activeVotes = getActiveVotesForGroupByAccount(group, account);
    GroupActiveVotes storage groupActive = active.forGroup[group];
    if (activeVotes == value) {
      units = groupActive.unitsByAccount[account];
    } else {
      units = votesToUnits(group, value);
    }

    groupActive.total = groupActive.total.sub(value);
    groupActive.totalUnits = groupActive.totalUnits.sub(units);
    groupActive.unitsByAccount[account] = groupActive.unitsByAccount[account].sub(units);
    return units;
  }

  /**
   * @notice Returns the number of units corresponding to `value` active votes.
   * @param group The address of the validator group.
   * @param value The number of active votes.
   * @return The corresponding number of units.
   */
  function votesToUnits(address group, uint256 value) private view returns (uint256) {
    if (votes.active.forGroup[group].totalUnits == 0) {
      return value.mul(UNIT_PRECISION_FACTOR);
    } else {
      return
        value.mul(votes.active.forGroup[group].totalUnits).div(votes.active.forGroup[group].total);
    }
  }

  /**
   * @notice Returns the number of active votes corresponding to `value` units.
   * @param group The address of the validator group.
   * @param value The number of units.
   * @return The corresponding number of active votes.
   */
  function unitsToVotes(address group, uint256 value) private view returns (uint256) {
    if (votes.active.forGroup[group].totalUnits == 0) {
      return 0;
    } else {
      return
        value.mul(votes.active.forGroup[group].total).div(votes.active.forGroup[group].totalUnits);
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
    require(index < list.length && list[index] == element, "Bad index");
    uint256 lastIndex = list.length.sub(1);
    list[index] = list[lastIndex];
    list.length = lastIndex;
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
   * @notice Returns list of all validator groups and the number of votes they've received.
   * @return List of all validator groups
   * @return Number of votes each validator group received.
   */
  function getTotalVotesForEligibleValidatorGroups()
    external
    view
    returns (address[] memory groups, uint256[] memory values)
  {
    return votes.total.eligible.getElements();
  }

  // Struct to hold local variables for `forceDecrementVotes`.
  // Needed to prevent solc error of "stack too deep" from too many local vars.
  struct DecrementVotesInfo {
    address[] groups;
    uint256 remainingValue;
  }

  /**
   * @notice Reduces the total amount of `account`'s voting gold by `value` by
   *         iterating over all groups voted for by account.
   * @param account Address to revoke votes from.
   * @param value Maximum amount of votes to revoke.
   * @param lessers The groups receiving fewer votes than the i'th `group`, or 0 if
   *                the i'th `group` has the fewest votes of any validator group.
   * @param greaters The groups receivier more votes than the i'th `group`, or 0 if
   *                the i'th `group` has the most votes of any validator group.
   * @param indices The indices of the i'th group in the account's voting list.
   * @return Number of votes successfully decremented.
   */
  function forceDecrementVotes(
    address account,
    uint256 value,
    address[] calldata lessers,
    address[] calldata greaters,
    uint256[] calldata indices
  ) external nonReentrant onlyRegisteredContract(LOCKED_GOLD_REGISTRY_ID) returns (uint256) {
    require(value > 0, "Decrement value must be greater than 0.");
    DecrementVotesInfo memory info = DecrementVotesInfo(votes.groupsVotedFor[account], value);
    require(
      lessers.length <= info.groups.length &&
        lessers.length == greaters.length &&
        greaters.length == indices.length,
      "Input lengths must be correspond."
    );
    // Iterate in reverse order to hopefully optimize removing pending votes before active votes
    // And to attempt to preserve `account`'s earliest votes (assuming earliest = prefered)
    for (uint256 i = info.groups.length; i > 0; i = i.sub(1)) {
      info.remainingValue = info.remainingValue.sub(
        _decrementVotes(
          account,
          info.groups[i.sub(1)],
          info.remainingValue,
          lessers[i.sub(1)],
          greaters[i.sub(1)],
          indices[i.sub(1)]
        )
      );
      if (info.remainingValue == 0) {
        break;
      }
    }
    require(info.remainingValue == 0, "Failure to decrement all votes.");
    return value;
  }
}

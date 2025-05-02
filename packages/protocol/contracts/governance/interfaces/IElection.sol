// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IElection {
  function vote(address group, uint256 value, address lesser, address greater) external returns (bool);
  function activate(address group) external returns (bool);
  function revokeActive(address, uint256, address, address, uint256) external returns (bool);
  function revokeAllActive(address, address, address, uint256) external returns (bool);
  function revokePending(address, uint256, address, address, uint256) external returns (bool);
  function markGroupIneligible(address) external;
  function markGroupEligible(address, address, address) external;
  function allowedToVoteOverMaxNumberOfGroups(address) external returns (bool);
  function forceDecrementVotes(
    address,
    uint256,
    address[] calldata,
    address[] calldata,
    uint256[] calldata
  ) external returns (uint256);
  function setAllowedToVoteOverMaxNumberOfGroups(bool flag) external;

  // only owner
  function setElectableValidators(uint256, uint256) external returns (bool);
  function setMaxNumGroupsVotedFor(uint256) external returns (bool);
  function setElectabilityThreshold(uint256) external returns (bool);

  // only VM
  function distributeEpochRewards(address, uint256, address, address) external;

  // view functions
  function electValidatorSigners() external view returns (address[] memory);
  function electValidatorAccounts() external view returns (address[] memory);
  function electNValidatorSigners(uint256 minElectableValidators, uint256 maxElectableValidators) external view returns (address[] memory);
  function electNValidatorAccounts(uint256 minElectableValidators, uint256 maxElectableValidators) external view returns (address[] memory);
  function getElectableValidators() external view returns (uint256, uint256);
  function getElectabilityThreshold() external view returns (uint256);
  function getNumVotesReceivable(address group) external view returns (uint256);
  function getTotalVotes() external view returns (uint256);
  function getActiveVotes() external view returns (uint256);
  function getTotalVotesByAccount(address account) external view returns (uint256);
  function getPendingVotesForGroupByAccount(address group, address account) external view returns (uint256);
  function getActiveVotesForGroupByAccount(address group, address account) external view returns (uint256);
  function getTotalVotesForGroupByAccount(address group, address account) external view returns (uint256);
  function getActiveVoteUnitsForGroupByAccount(address group, address account) external view returns (uint256);
  function getTotalVotesForGroup(address group) external view returns (uint256);
  function getActiveVotesForGroup(address group) external view returns (uint256);
  function getPendingVotesForGroup(address group) external view returns (uint256);
  function getGroupEligibility(address group) external view returns (bool);
  function getGroupEpochRewards(
    address,
    uint256,
    uint256[] calldata
  ) external view returns (uint256);
  function getGroupEpochRewardsBasedOnScore(
    address group,
    uint256 totalEpochRewards,
    uint256 groupScore
  ) external view returns (uint256);
  function getGroupsVotedForByAccount(address) external view returns (address[] memory);
  function getEligibleValidatorGroups() external view returns (address[] memory);
  function getTotalVotesForEligibleValidatorGroups()
    external
    view
    returns (address[] memory, uint256[] memory);
  function getCurrentValidatorSigners() external view returns (address[] memory);
  function canReceiveVotes(address, uint256) external view returns (bool);
  function hasActivatablePendingVotes(address, address) external view returns (bool);
  function validatorSignerAddressFromCurrentSet(uint256 index) external view returns (address);
  function numberValidatorsInCurrentSet() external view returns (uint256);
  function owner() external view returns (address);
}

pragma solidity ^0.5.3;


interface ILockedGold {
  enum DelegateRole {Validating, Voting, Rewards}
  enum CommitmentType {Locked, Notified}
  function initialize(address, uint256) external;
  function isVotingFrozen(address) external view returns (bool);
  function setCumulativeRewardWeight(uint256) external;
  function setMaxNoticePeriod(uint256) external;
  function redeemRewards() external returns (uint256);
  function freezeVoting() external;
  function unfreezeVoting() external;
  function newCommitment(uint256) external payable returns (uint256);
  function notifyCommitment(uint256, uint256) external returns (uint256);
  function extendCommitment(uint256, uint256) external returns (uint256);
  function withdrawCommitment(uint256) external returns (uint256);
  function increaseNoticePeriod(uint256, uint256, uint256) external returns (uint256);
  function getRewardsLastRedeemed(address) external view returns (uint96);
  function getNoticePeriods(address) external view returns (uint256[] memory);
  function getAvailabilityTimes(address) external view returns (uint256[] memory);
  function getLockedCommitment(address, uint256) external view returns (uint256, uint256);
  function getAccountWeight(address) external view returns (uint256);
  function delegateRole(DelegateRole, address, uint8, bytes32, bytes32) external;
  function getAccountFromDelegateAndRole(address, DelegateRole) external view returns (address);
  function getDelegateFromAccountAndRole(address, DelegateRole) external view returns (address);
  function totalWeight() external view returns (uint256);
}

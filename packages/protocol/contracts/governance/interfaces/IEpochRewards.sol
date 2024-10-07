// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9;

interface IEpochRewards {
  function updateTargetVotingYield() external;
  function isReserveLow() external view returns (bool);
  function calculateTargetEpochRewards() external view returns (uint256, uint256, uint256, uint256);
  function getTargetVotingYieldParameters() external view returns (uint256, uint256, uint256);
  function getRewardsMultiplierParameters() external view returns (uint256, uint256, uint256);
  function getCommunityRewardFraction() external view returns (uint256);
  function getCarbonOffsettingFraction() external view returns (uint256);
  function getTargetVotingGoldFraction() external view returns (uint256);
  function getRewardsMultiplier() external view returns (uint256);
  function carbonOffsettingPartner() external view returns (address);
}

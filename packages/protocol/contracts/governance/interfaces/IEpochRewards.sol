pragma solidity >=0.5.13 <0.9.0;

interface IEpochRewards {
  function updateTargetVotingYield() external;
  function isReserveLow() external view;
  function calculateTargetEpochRewards() external view returns (uint256, uint256, uint256, uint256);
  function getTargetVotingYieldParameters() external view returns (uint256, uint256, uint256);
  function updateTargetVotingYieldCel2() external;
  function getRewardsMultiplierParameters() external view returns (uint256, uint256, uint256);
  function getCommunityRewardFraction() external view returns (uint256);
  function getCarbonOffsettingFraction() external view returns (uint256);
  function getTargetVotingGoldFraction() external view returns (uint256);
  function getRewardsMultiplier() external view returns (uint256);
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
}

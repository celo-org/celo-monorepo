pragma solidity >=0.5.13 <0.9.0;

interface IEpochRewards {
  function getCommunityRewardFraction() external view returns (uint256);
  function getCarbonOffsettingFraction() external view returns (uint256);
}
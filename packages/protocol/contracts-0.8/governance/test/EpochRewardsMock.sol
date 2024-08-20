// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../../../contracts/governance/interfaces/IEpochRewards.sol";
// import "forge-std-8/console2.sol";
/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsMock08 is IEpochRewards {
  uint256 private numValidatorsInCurrentSet;

  function setNumberValidatorsInCurrentSet(uint256 value) external {
    numValidatorsInCurrentSet = value;
  }

  // TODO: (soloseng) implement mock
  function updateTargetVotingYield() external {
    // console2.log("### Updating Target Voting Yield");
  }

  function getRewardsMultiplier(
    uint256 targetGoldTotalSupplyIncrease
  ) external view returns (uint256) {
    // return _getRewardsMultiplier(targetGoldTotalSupplyIncrease).unwrap();
    return 0;
  }

  function isReserveLow() external view returns (bool) {
    return false;
  }
  function calculateTargetEpochRewards()
    external
    view
    returns (uint256, uint256, uint256, uint256)
  {
    // console2.log("### calculating Target Epoch Rewards");
    return (1, 1, 1, 1);
  }
  function getTargetVotingYieldParameters() external view returns (uint256, uint256, uint256) {
    return (0, 0, 0);
  }
  function getRewardsMultiplierParameters() external view returns (uint256, uint256, uint256) {
    return (0, 0, 0);
  }
  function getCommunityRewardFraction() external view returns (uint256) {
    return 0;
  }
  function getCarbonOffsettingFraction() external view returns (uint256) {
    return 0;
  }
  function getTargetVotingGoldFraction() external view returns (uint256) {
    return 0;
  }
  function getRewardsMultiplier() external view returns (uint256) {
    return 0;
  }

  // mocks the precompile
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return numValidatorsInCurrentSet;
  }
}

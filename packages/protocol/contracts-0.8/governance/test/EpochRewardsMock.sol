// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../../../contracts/governance/interfaces/IEpochRewards.sol";

/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsMock08 is IEpochRewards {
  uint256 private numValidatorsInCurrentSet;
  address public carbonOffsettingPartner;

  uint256 public perValidatorReward = 5;
  uint256 public totalRewardsVoter = 6;
  uint256 public totalRewardsCommunity = 7;
  uint256 public totalRewardsCarbonFund = 8;

  function setNumberValidatorsInCurrentSet(uint256 value) external {
    numValidatorsInCurrentSet = value;
  }

  function updateTargetVotingYield() external {}

  function getRewardsMultiplier(
    uint256 targetGoldTotalSupplyIncrease
  ) external view returns (uint256) {
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
    return (perValidatorReward, totalRewardsVoter, totalRewardsCommunity, totalRewardsCarbonFund);
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

  function setCarbonOffsettingPartner(address partner) external {
    carbonOffsettingPartner = partner;
  }
}

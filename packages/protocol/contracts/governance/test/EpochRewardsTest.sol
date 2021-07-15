pragma solidity ^0.5.13;

import "../EpochRewards.sol";

/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsTest is EpochRewards(true) {
  uint256 private numValidatorsInCurrentSet;
  function getRewardsMultiplier(uint256 targetGoldTotalSupplyIncrease)
    external
    view
    returns (uint256)
  {
    return _getRewardsMultiplier(targetGoldTotalSupplyIncrease).unwrap();
  }

  function updateTargetVotingYield() external {
    _updateTargetVotingYield();
  }

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return numValidatorsInCurrentSet;
  }

  function setNumberValidatorsInCurrentSet(uint256 value) external {
    numValidatorsInCurrentSet = value;
  }
}

pragma solidity ^0.5.8;

import "../EpochRewards.sol";

/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsTest is EpochRewards {
  uint256 public numValidatorsInCurrentSet;
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

  function setNumberValidatorsInCurrentSet(uint256 value) external {
    numValidatorsInCurrentSet = value;
  }
}

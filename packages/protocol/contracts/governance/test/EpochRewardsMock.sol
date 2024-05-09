pragma solidity ^0.5.13;

import "../EpochRewards.sol";

/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsMock is EpochRewards(true) {
  uint256 private numValidatorsInCurrentSet;

  function setNumberValidatorsInCurrentSet(uint256 value) external {
    numValidatorsInCurrentSet = value;
  }

  function getRewardsMultiplier(
    uint256 targetGoldTotalSupplyIncrease
  ) external view returns (uint256) {
    return _getRewardsMultiplier(targetGoldTotalSupplyIncrease).unwrap();
  }

  // mocks the precompile
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return numValidatorsInCurrentSet;
  }
}

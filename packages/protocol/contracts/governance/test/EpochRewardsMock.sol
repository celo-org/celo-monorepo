// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;
import "../EpochRewards.sol";

/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsMock is EpochRewards(true) {
  using FixidityLib for FixidityLib.Fraction;

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
  function numberValidatorsInCurrentSet() public view override returns (uint256) {
    return numValidatorsInCurrentSet;
  }
}

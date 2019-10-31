pragma solidity ^0.5.8;

import "../EpochRewards.sol";
import "../../common/FixidityLib.sol";

/**
 * @title A wrapper around EpochRewards that exposes internal functions for testing.
 */
contract EpochRewardsTest is EpochRewards {

  function getTargetGoldTotalSupply() external view returns (uint256) {
    return _getTargetGoldTotalSupply();
  }

  function getTargetTotalEpochPaymentsInGold() external view returns (uint256) {
    return _getTargetTotalEpochPaymentsInGold();
  }

  function getTargetEpochRewards() external view returns (uint256) {
    return _getTargetEpochRewards();
  }

  function getRewardsMultiplier(uint256 targetGoldTotalSupplyIncrease) external view returns (uint256) {
    return _getRewardsMultiplier(targetGoldTotalSupplyIncrease).unwrap();
  }

  function updateTargetVotingYield() external {
    _updateTargetVotingYield();
  }

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return 100;
  }
}

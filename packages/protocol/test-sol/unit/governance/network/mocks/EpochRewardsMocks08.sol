// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/EpochRewards.sol";
import "@celo-contracts/common/FixidityLib.sol";

/**
 * @title A wrapper around EpochRewards (0.8) that exposes internal functions for testing.
 * Deployed by 0.5 unit tests via deployCodeTo("EpochRewardsImplMock08", addr).
 */
contract EpochRewardsImplMock08 is EpochRewards(true) {
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

  // mocks the precompile — intentionally drops onlyL1 so tests run in both L1 and L2 envs
  function numberValidatorsInCurrentSet() public view override returns (uint256) {
    return numValidatorsInCurrentSet;
  }
}

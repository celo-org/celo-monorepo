// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Combined interface for EpochRewards + mock-specific methods used in unit tests.
 * This is a standalone interface (0.5 interfaces cannot inherit) that combines
 * IEpochRewards, IEpochRewardsInitializer, and IOwnable, plus the setter methods
 * and mock helpers used by the EpochRewards unit test suite.
 */
interface IEpochRewardsMock {
  // IEpochRewards methods
  function updateTargetVotingYield() external;
  function calculateTargetEpochRewards() external view returns (uint256, uint256, uint256, uint256);
  function getTargetVotingYieldParameters() external view returns (uint256, uint256, uint256);
  function getRewardsMultiplierParameters() external view returns (uint256, uint256, uint256);
  function getCommunityRewardFraction() external view returns (uint256);
  function getCarbonOffsettingFraction() external view returns (uint256);
  function getTargetVotingGoldFraction() external view returns (uint256);
  function getRewardsMultiplier() external view returns (uint256);
  function carbonOffsettingPartner() external view returns (address);

  // IEpochRewardsInitializer
  function initialize(
    address registryAddress,
    uint256 targetVotingYieldInitial,
    uint256 targetVotingYieldMax,
    uint256 targetVotingYieldAdjustmentFactor,
    uint256 rewardsMultiplierMax,
    uint256 rewardsMultiplierUnderspendAdjustmentFactor,
    uint256 rewardsMultiplierOverspendAdjustmentFactor,
    uint256 _targetVotingGoldFraction,
    uint256 _targetValidatorEpochPayment,
    uint256 _communityRewardFraction,
    address _carbonOffsettingPartner,
    uint256 _carbonOffsettingFraction
  ) external;

  // IOwnable
  function owner() external view returns (address);

  // Public getters for state variables
  function targetValidatorEpochPayment() external view returns (uint256);
  function startTime() external view returns (uint256);

  // Setter methods called by tests
  function setCommunityRewardFraction(uint256 value) external returns (bool);
  function setCarbonOffsettingFund(address partner, uint256 value) external returns (bool);
  function setTargetVotingGoldFraction(uint256 value) external returns (bool);
  function setTargetValidatorEpochPayment(uint256 value) external returns (bool);
  function setRewardsMultiplierParameters(
    uint256 max,
    uint256 underspendAdjustmentFactor,
    uint256 overspendAdjustmentFactor
  ) external returns (bool);
  function setTargetVotingYieldParameters(
    uint256 max,
    uint256 adjustmentFactor
  ) external returns (bool);
  function setTargetVotingYield(uint256 targetVotingYield) external returns (bool);

  // View methods (public in EpochRewards)
  function getTargetGoldTotalSupply() external view returns (uint256);
  function getTargetVoterRewards() external view returns (uint256);
  function getTargetTotalEpochPaymentsInGold() external view returns (uint256);
  function getVotingGoldFraction() external view returns (uint256);

  // Mock-specific method (overloaded getRewardsMultiplier from EpochRewardsMock)
  function getRewardsMultiplier(
    uint256 targetGoldTotalSupplyIncrease
  ) external view returns (uint256);
}

pragma solidity >=0.5.13 <0.9.0;

interface IEpochRewardsInitializer {
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
}

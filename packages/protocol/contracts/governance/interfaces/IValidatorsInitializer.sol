pragma solidity >=0.5.13 <0.9.0;

interface IValidatorsInitializer {
  function initialize(
    address registryAddress,
    uint256 groupRequirementValue,
    uint256 groupRequirementDuration,
    uint256 validatorRequirementValue,
    uint256 validatorRequirementDuration,
    uint256 validatorScoreExponent,
    uint256 validatorScoreAdjustmentSpeed,
    uint256 _membershipHistoryLength,
    uint256 _slashingMultiplierResetPeriod,
    uint256 _maxGroupSize,
    uint256 _commissionUpdateDelay,
    uint256 _downtimeGracePeriod
  ) external;
}

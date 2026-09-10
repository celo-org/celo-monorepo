pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

interface IValidatorsInitializer {
  function initialize(
    address registryAddress,
    uint256 groupRequirementValue,
    uint256 groupRequirementDuration,
    uint256 validatorRequirementValue,
    uint256 validatorRequirementDuration,
    uint256 _membershipHistoryLength,
    uint256 _slashingMultiplierResetPeriod,
    uint256 _maxGroupSize,
    InitParamsLib.InitParams calldata initParams
  ) external;
}

library InitParamsLib {
  struct InitParams {
    // The number of blocks to delay a ValidatorGroup's commission
    uint256 commissionUpdateDelay;
  }
}

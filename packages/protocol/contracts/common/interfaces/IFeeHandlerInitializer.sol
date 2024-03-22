pragma solidity >=0.5.13 <0.9.0;

interface IFeeHandlerInitializer {
  function initialize(
    address _registryAddress,
    address newFeeBeneficiary,
    uint256 newBurnFraction,
    address[] calldata tokens,
    address[] calldata handlers,
    uint256[] calldata newLimits,
    uint256[] calldata newMaxSlippages
  ) external;
}

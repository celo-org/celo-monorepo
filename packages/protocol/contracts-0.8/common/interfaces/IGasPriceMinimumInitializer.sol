pragma solidity >=0.5.13 <0.9.0;

interface IGasPriceMinimumInitializer {
  function initialize(
    address _registryAddress,
    uint256 _gasPriceMinimumFloor,
    uint256 _targetDensity,
    uint256 _adjustmentSpeed,
    uint256 _baseFeeOpCodeActivationBlock
  ) external;
}

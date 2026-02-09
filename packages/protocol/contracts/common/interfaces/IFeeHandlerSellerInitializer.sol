pragma solidity >=0.5.13 <0.9.0;

interface IFeeHandlerSellerInitializer {
  function initialize(
    address _registryAddress,
    address[] calldata tokenAddresses,
    uint256[] calldata newMininumReports
  ) external;
}

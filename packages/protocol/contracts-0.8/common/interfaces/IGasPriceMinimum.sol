pragma solidity >=0.5.13 <0.9.0;

// TODO add to GasPrice
interface IGasPriceMinimum {
  function updateGasPriceMinimum(
    uint256 blockGasTotal,
    uint256 blockGasLimit
  ) external returns (uint256);
  function getGasPriceMinimum(address tokenAddress) external view returns (uint256);
}

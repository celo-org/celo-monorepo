// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IBlockchainParameters {
  function setBlockGasLimit(uint256 gasLimit) external;
  function setIntrinsicGasForAlternativeFeeCurrency(uint256 gas) external;
  function setUptimeLookbackWindow(uint256 window) external;
  function getUptimeLookbackWindow() external view returns (uint256 lookbackWindow);
  function blockGasLimit() external view returns (uint256);
  function intrinsicGasForAlternativeFeeCurrency() external view returns (uint256);
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
}

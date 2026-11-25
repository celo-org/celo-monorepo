// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

// Test-only superset interface for the migrated 0.8 FeeHandlerSeller family.
// Kept standalone (no inheritance) so it stays compilable from 0.5 test files.
// NOTE: owner() is intentionally absent — use IOwnable for that (OZ Ownable collision under 0.8).
interface IFeeHandlerSellerTest {
  function initialize(
    address _registryAddress,
    address[] calldata tokenAddresses,
    uint256[] calldata newMinimumReports
  ) external;

  function transfer(address token, uint256 amount, address to) external returns (bool);
  function setMinimumReports(address tokenAddress, uint256 newMinimumReports) external;
  function setOracleAddress(address _tokenAddress, address _oracleAddress) external;
  function setRouter(address token, address router) external;
  function removeRouter(address token, address router) external;
  function sell(
    address sellTokenAddress,
    address buyTokenAddress,
    uint256 amount,
    uint256 maxSlippage
  ) external returns (uint256);

  function minimumReports(address tokenAddress) external view returns (uint256);
  function getOracleAddress(address _tokenAddress) external view returns (address);
  function getRoutersForToken(address token) external view returns (address[] memory);
  function calculateMinAmount(
    uint256 midPriceNumerator,
    uint256 midPriceDenominator,
    uint256 amount,
    uint256 maxSlippage
  ) external pure returns (uint256);
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
}

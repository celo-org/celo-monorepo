// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

// Test-only superset interface for the migrated 0.8 FeeHandler. Kept standalone
// (no inheritance) so it stays compilable from 0.5 test files, which cannot use
// `interface X is Y`. Intentionally NOT the production IFeeHandler so production
// stays minimal.
// NOTE: owner() is intentionally absent — use IOwnable for that (OZ Ownable collision under 0.8).
interface IFeeHandlerTest {
  function initialize(
    address _registryAddress,
    address newFeeBeneficiary,
    uint256 newCarbonFraction,
    address[] calldata tokens,
    address[] calldata handlers,
    uint256[] calldata newLimits,
    uint256[] calldata newMaxSlippages
  ) external;

  function setCarbonFraction(uint256 newFraction) external;
  function setDistributionAndBurnAmounts(address tokenAddress) external;
  function changeOtherBeneficiaryAllocation(address beneficiary, uint256 _newFraction) external;
  function addOtherBeneficiary(
    address beneficiary,
    uint256 _newFraction,
    string calldata name
  ) external;
  function removeOtherBeneficiary(address beneficiary) external;
  function setBeneficiaryFraction(address beneficiaryAddress, uint256 _newFraction) external;
  function setBeneficiaryName(address beneficiary, string calldata name) external;
  function setCarbonFeeBeneficiary(address beneficiary) external;
  function sell(address tokenAddress) external;
  function addToken(address tokenAddress, address handlerAddress) external;
  function activateToken(address tokenAddress) external;
  function deactivateToken(address tokenAddress) external;
  function setHandler(address tokenAddress, address handlerAddress) external;
  function removeToken(address tokenAddress) external;
  function distribute(address tokenAddress) external;
  function setMaxSplippage(address token, uint256 newMax) external;
  function setDailySellLimit(address token, uint256 newLimit) external;
  function burnCelo() external;
  function distributeAll() external;
  function handleAll() external;
  function handle(address tokenAddress) external;
  function transfer(address token, address recipient, uint256 value) external returns (bool);

  function getCeloToBeBurned() external view returns (uint256);
  function getPastBurnForToken(address token) external view returns (uint256);
  function carbonFeeBeneficiary() external view returns (address);
  function getTokenHandler(address tokenAddress) external view returns (address);
  function getTokenActive(address tokenAddress) external view returns (bool);
  function getTokenMaxSlippage(address tokenAddress) external view returns (uint256);
  function getTokenDailySellLimit(address tokenAddress) external view returns (uint256);
  function getTokenCurrentDaySellLimit(address tokenAddress) external view returns (uint256);
  function getTokenToDistribute(address tokenAddress) external view returns (uint256);
  function getTokenToBurn(address tokenAddress) external view returns (uint256);
  function getCarbonFraction() external view returns (uint256);
  function getBurnFraction() external view returns (uint256);
  function getOtherBeneficiariesInfo(
    address beneficiary
  ) external view returns (uint256, string memory, bool);
  function getTotalFractionOfOtherBeneficiariesAndCarbon() external view returns (uint256);
  function getOtherBeneficiariesAddresses() external view returns (address[] memory);
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
  function dailySellLimitHit(address token, uint256 amountToBurn) external returns (bool);
  function getActiveTokens() external view returns (address[] memory);
  function shouldBurn() external view returns (bool);
  function registry() external view returns (address);
  function MIN_BURN() external view returns (uint256);
}

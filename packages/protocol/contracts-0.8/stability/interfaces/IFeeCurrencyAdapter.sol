// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

interface IFeeCurrencyAdapter {
  function getAdaptedToken() external view returns (address);

  function digitDifference() external view returns (uint96);

  function debited() external view returns (uint256);

  function name() external view returns (string memory);

  function symbol() external view returns (string memory);

  function expectedDecimals() external view returns (uint8);

  function decimals() external view returns (uint8);

  function debitGasFees(address from, uint256 value) external;

  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address _gatewayFeeRecipient,
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 _gatewayFeeAmount,
    uint256 baseFeeAmount
  ) external;
}

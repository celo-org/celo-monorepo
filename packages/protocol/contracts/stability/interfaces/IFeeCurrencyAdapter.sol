// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

interface IFeeCurrencyAdapter {
  /**
   * @notice Same as debitGasFees in IFeeCurrency, always using the number of decimals the evm expects.
   */
  function debitGasFees(address from, uint256 value) external;

  /**
   * @notice Same as creditGasFees in IFeeCurrency, always using the number of decimals the evm expects.
   */
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

  /**
   * @return The address of the adapted token.
   */
  function getAdaptedToken() external view returns (address);

  /**
   * @return The multiplier that should be used when upscaling and downscaling. This is the result of 10**(expectedDecimals - getAdaptedToken().decimals()).
   */
  function digitDifference() external view returns (uint96);

  /**
   * @return The amount that is debited after calling debitGasFees() and before creditGasFees().
   */
  function debited() external view returns (uint256);

  /**
   * @return The name of the adapted token.
   */
  function name() external view returns (string memory);

  /**
   * @return The symbol of adapted token.
   */
  function symbol() external view returns (string memory);

  /**
   * @return The decimals expected by the vm.
   */
  function decimals() external view returns (uint8);

  /**
   * @return Same as decimals.
   */
  function expectedDecimals() external view returns (uint8);
}

// SPDX-License-Identifier: LGPL-3.0-only

interface IFeeCurrencyAdapter {
  /**
   * @return The address of the adapted token.
   */
  function getAdaptedToken() external view returns (address);

  /**
   * @return The multiplier that should be used when upscaling and downscaling.
   */
  function digitDifference() external view returns (uint96);

  /**
   * @return returns the amount that it's debited after calling debitGasFees().
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
   * @return Returns the decimals expected by the vm.
   */
  function decimals() external view returns (uint8);

  /**
   * @return same as decimals.
   */
  function expectedDecimals() external view returns (uint8);


  /**
   * @notice See IFeeCurrency.
   */
  function debitGasFees(address from, uint256 value) external;


  /**
   * @notice See IFeeCurrency.
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
}

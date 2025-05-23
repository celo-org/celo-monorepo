// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFeeCurrencyDirectory {
  struct CurrencyConfig {
    address oracle;
    uint256 intrinsicGas;
  }

  /**
   * @notice Sets the currency configuration for a token.
   * @dev This action can only be performed by the contract owner.
   * @param token The token address.
   * @param oracle The oracle address for price fetching.
   * @param intrinsicGas The intrinsic gas value for transactions.
   */
  function setCurrencyConfig(address token, address oracle, uint256 intrinsicGas) external;

  /**
   * @notice Returns the list of all currency addresses.
   * @return An array of addresses.
   */
  function getCurrencies() external view returns (address[] memory);
  /**
   * @notice Returns the configuration for a currency.
   * @param token The address of the token.
   * @return Currency configuration of the token.
   */
  function getCurrencyConfig(address token) external view returns (CurrencyConfig memory);

  /**
   * @notice Retrieves exchange rate between token and CELO.
   * @param token The token address whose price is to be fetched.
   * @return numerator The exchange rate numerator.
   * @return denominator The exchange rate denominator.
   */
  function getExchangeRate(
    address token
  ) external view returns (uint256 numerator, uint256 denominator);
}

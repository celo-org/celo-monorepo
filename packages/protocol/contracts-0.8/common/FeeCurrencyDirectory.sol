// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../contracts/common/Initializable.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

interface IOracle {
  function getExchangeRateFor(address identifier)
    external
    view
    returns (uint256 numerator, uint256 denominator, uint256 lastUpdateTimestamp);
}

contract FeeCurrencyDirectory is Initializable, Ownable {
  mapping(address => CurrencyConfig) public whitelistedCurrencies;
  address[] private whitelistedCurrencyList;

  struct CurrencyConfig {
    address currencyIdentifier;
    address oracle;
    uint256 intrinsicGas;
  }

  constructor(bool test) public Initializable(test) {}

  /**
     * @notice Initializes the contract with the owner set.
     */
  function initialize() public initializer {
    _transferOwnership(msg.sender);
  }

  /**
     * @notice Returns the list of all whitelisted currency addresses.
     * @return An array of addresses that are whitelisted.
     */
  function getWhitelistedCurrencies() public view returns (address[] memory) {
    return whitelistedCurrencyList;
  }

  /**
     * @notice Returns the configuration for a whitelisted currency.
     * @param token The address of the token.
     * @return Currency configuration of the token.
     */
  function getWhitelistedCurrencyConfig(address token) public view returns (CurrencyConfig memory) {
    return whitelistedCurrencies[token];
  }

  /**
     * @notice Retrieves the price of the token in terms of CELO.
     * @param token The token address whose price is to be fetched.
     * @return The price of the token in CELO.
     */
  function getPrice(address token) public view returns (uint256) {
    CurrencyConfig memory currencyConfig = getWhitelistedCurrencyConfig(token);
    require(currencyConfig.currencyIdentifier != address(0), "Currency not whitelisted");
    (uint256 numerator, uint256 denominator, ) = IOracle(whitelistedCurrencies[token].oracle)
      .getExchangeRateFor(currencyConfig.currencyIdentifier);
    return numerator / denominator;
  }

  /**
     * @notice Sets the currency configuration for a token.
     * @dev This action can only be performed by the contract owner.
     * @param token The token address.
     * @param currencyIdentifier The currency identifier.
     * @param oracle The oracle address for price fetching.
     * @param intrinsicGas The intrinsic gas value for transactions.
     */
  function setCurrencyConfig(
    address token,
    address currencyIdentifier,
    address oracle,
    uint256 intrinsicGas
  ) public onlyOwner {
    require(currencyIdentifier != address(0), "Currency identifier cannot be zero");
    require(oracle != address(0), "Oracle address cannot be zero");
    require(intrinsicGas > 0, "Intrinsic gas cannot be zero");

    whitelistedCurrencies[token] = CurrencyConfig({
      currencyIdentifier: currencyIdentifier,
      oracle: oracle,
      intrinsicGas: intrinsicGas
    });
    whitelistedCurrencyList.push(token);
  }

  /**
     * @notice Removes a token from the whitelist.
     * @dev This action can only be performed by the contract owner.
     * @param token The token address to remove.
     * @param index The index in the list of whitelisted currencies.
     */
  function removeWhitelistedCurrencies(address token, uint256 index) public onlyOwner {
    require(index < whitelistedCurrencyList.length, "Index out of bounds");
    require(whitelistedCurrencyList[index] == token, "Index does not match token");

    delete whitelistedCurrencies[token];
    whitelistedCurrencyList[index] = whitelistedCurrencyList[whitelistedCurrencyList.length - 1];
    whitelistedCurrencyList.pop();
  }

  /**
     * @notice Converts the gas price from CELO to another token.
     * @param token The token address for which to translate the gas price.
     * @param priceInCelo The price in CELO.
     * @return gasInToken The converted gas price in the token.
     */
  function translateGasPrice(address token, uint256 priceInCelo)
    public
    view
    returns (uint256 gasInToken)
  {
    uint256 pricePerUnit = getPrice(token);
    return priceInCelo * pricePerUnit;
  }
}

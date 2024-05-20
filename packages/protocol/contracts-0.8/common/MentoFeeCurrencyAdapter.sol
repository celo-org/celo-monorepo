// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../contracts/common/Initializable.sol";
import "./interfaces/IOracle.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

contract MentoFeeCurrencyAdapter is IOracle, Initializable, Ownable {
  struct MentoCurrencyConfig {
    address oracle;
    address currencyIdentifier;
  }

  mapping(address => MentoCurrencyConfig) public currencies;
  address[] private currencyList;

  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Initializes the contract with the owner set.
   */
  function initialize() public initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Sets the currency configuration for a token.
   * @dev This action can only be performed by the contract owner.
   * @param token The token address.
   * @param currencyIdentifier The currency identifier.
   * @param oracle The oracle address for price fetching.
   */
  function setCurrencyConfig(
    address token,
    address currencyIdentifier,
    address oracle
  ) external onlyOwner {
    require(currencyIdentifier != address(0), "Currency identifier cannot be zero");
    require(oracle != address(0), "Oracle address cannot be zero");
    require(currencies[token].currencyIdentifier == address(0), "Currency already in the adapter");

    currencies[token] = MentoCurrencyConfig({
      currencyIdentifier: currencyIdentifier,
      oracle: oracle
    });
    currencyList.push(token);
  }

  /**
   * @notice Removes a token from the adapter.
   * @dev This action can only be performed by the contract owner.
   * @param token The token address to remove.
   * @param index The index in the list of adapter currencies.
   */
  function removeCurrencies(address token, uint256 index) external onlyOwner {
    require(index < currencyList.length, "Index out of bounds");
    require(currencyList[index] == token, "Index does not match token");

    delete currencies[token];
    currencyList[index] = currencyList[currencyList.length - 1];
    currencyList.pop();
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Returns the list of all currency addresses.
   * @return An array of addresses.
   */
  function getCurrencies() public view returns (address[] memory) {
    return currencyList;
  }

  /**
   * @notice Returns the configuration for a currency.
   * @param token The address of the token.
   * @return Currency configuration of the token.
   */
  function getCurrencyConfig(address token) public view returns (MentoCurrencyConfig memory) {
    return currencies[token];
  }

  /**
   * @notice Retrieves exchange rate between token and CELO.
   * @param token The token address whose price is to be fetched.
   * @return numerator The exchange rate numerator.
   * @return denominator The exchange rate denominator.
   */
  function getExchangeRate(
    address token
  ) public view returns (uint256 numerator, uint256 denominator) {
    MentoCurrencyConfig memory currencyConfig = getCurrencyConfig(token);
    require(currencyConfig.currencyIdentifier != address(0), "Currency not in the mentoAdapter");
    (numerator, denominator) = IOracle(currencies[token].oracle).getExchangeRate(
      currencyConfig.currencyIdentifier
    );
  }
}

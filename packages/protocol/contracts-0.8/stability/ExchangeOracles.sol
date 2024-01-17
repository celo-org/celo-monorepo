// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";

import "../../contracts/common/interfaces/IRegistry.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "../common/UsingRegistry.sol";

contract ExchangeOracles is Ownable, Initializable, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  uint256 private constant FIXED1_UINT = 1000000000000000000000000;

  mapping(address => address) public defaultTokenExchangePair;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(address _registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
  }

  /**
   * Returns exchange rate between two tokens.
   * If any of the tokens is not in SortedOracles, 0 will be returned.
   * @param token1 token1 address.
   * @param token2 token2 address.
   */
  function getExchangeRate(address token1, address token2) public view returns (uint256) {
    require(token1 != address(0), "token1 is 0");
    require(token2 != address(0), "token2 is 0");
    require(token1 != token2, "token1 is token2");

    ISortedOracles sortedOracles = getSortedOracles();

    address goldTokenAddress = address(getGoldToken());

    uint256 rate1;
    uint256 rate2;

    if (token1 == goldTokenAddress) {
      (rate2, ) = sortedOracles.medianRate(token2);
      return rate2;
    }

    if (token2 == goldTokenAddress) {
      (rate1, ) = sortedOracles.medianRate(token1);
      return rate1;
    }

    (rate1, ) = sortedOracles.medianRate(token1);
    (rate2, ) = sortedOracles.medianRate(token2);

    if (rate1 == 0 || rate2 == 0) {
      return 0;
    }

    return FixidityLib.newFixed(rate2).divide(FixidityLib.newFixed(rate1)).fromFixed();
  }

  /**
   * Returns exchange rate between two tokens, if default token pair is set.
   * @param token token address.
   */
  function medianRate(address token) external view returns (uint256, uint256) {
    address token2 = defaultTokenExchangePair[token];
    require(token2 != address(0), "no default token pair");

    return (getExchangeRate(token, token2), FIXED1_UINT);
  }

  /**
   * Sets default token pair.
   * @param token1 token1 address.
   * @param token2 token2 address.
   */
  function setTokenPair(address token1, address token2) external onlyOwner {
    require(token1 != address(0), "token1 is 0");
    require(token2 != address(0), "token2 is 0");

    defaultTokenExchangePair[token1] = token2;
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
}

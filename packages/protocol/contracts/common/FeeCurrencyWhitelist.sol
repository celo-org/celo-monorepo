pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IFeeCurrencyWhitelist.sol";

import "../common/Initializable.sol";

import "../common/UsingRegistry.sol";
import "../stability/interfaces/ISortedOracles.sol";
/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 */
contract FeeCurrencyWhitelist is IFeeCurrencyWhitelist, Ownable, Initializable, UsingRegistry {
  address[] public whitelist;

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(address registryAddress) external initializer {
    setRegistry(registryAddress);
    _transferOwnership(msg.sender);
  }

  /**
   * @dev Add a token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addToken(address tokenAddress) external onlyOwner {
    uint256 rateNumerator;
    uint256 rateDenominator;
    (rateNumerator, rateDenominator) = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    )
      .medianRate(tokenAddress);
    require(rateDenominator > 0, "FeeCurrencyWhitelist: Invalid Oracle Price (Denominator)");
    require(rateNumerator > 0, "FeeCurrencyWhitelist: Invalid Oracle Price (Numerator)");
    whitelist.push(tokenAddress);
  }

  function getWhitelist() external view returns (address[] memory) {
    return whitelist;
  }
}

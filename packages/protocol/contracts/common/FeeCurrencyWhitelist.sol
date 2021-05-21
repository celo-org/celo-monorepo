pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IFeeCurrencyWhitelist.sol";

import "./InitializableV2.sol";

import "./UsingRegistryV2.sol";
import "../stability/interfaces/ISortedOracles.sol";
/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 */
contract FeeCurrencyWhitelist is IFeeCurrencyWhitelist, Ownable, InitializableV2, UsingRegistryV2 {
  address[] public whitelist;

  constructor(bool test) public InitializableV2(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @dev Add a token to the whitelist
   * @param tokenAddress The address of the token to add.
   */
  function addToken(address tokenAddress) external onlyOwner {
    require(getSortedOracles().numRates(tokenAddress) > 0, "Token has no oracle exchange rates");
    whitelist.push(tokenAddress);
  }

  function getWhitelist() external view returns (address[] memory) {
    return whitelist;
  }
}

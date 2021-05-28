pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IFeeCurrencyWhitelist.sol";

import "../common/Initializable.sol";

/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 */
contract FeeCurrencyWhitelist is IFeeCurrencyWhitelist, Ownable, Initializable {
  address[] public whitelist;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

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
    whitelist.push(tokenAddress);
  }

  function getWhitelist() external view returns (address[] memory) {
    return whitelist;
  }
}

pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IGasCurrencyWhitelist.sol";

import "../common/Initializable.sol";


/**
 * @title Holds a whitelist of the ERC20+ tokens that can be used to pay for gas
 */
contract GasCurrencyWhitelist is IGasCurrencyWhitelist, Ownable, Initializable {

  address[] public whitelist;

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

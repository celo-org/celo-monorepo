pragma solidity ^0.5.8;
// solhint-disable no-unused-vars


/**
 * @title A mock GoldToken for testing.
 */
contract MockGoldToken {

  uint8 public decimals = 18;

  function transfer(address, uint256) external pure returns (bool) {
    return true;
  }

  function transferFrom(address, address, uint256) external pure returns (bool) {
    return true;
  }
}

pragma solidity ^0.5.3;
// solhint-disable no-unused-vars

/**
 * @title A mock GoldToken for testing.
 */
contract MockGoldToken {
  uint8 public constant decimals = 18;
  uint256 public totalSupply;

  function setTotalSupply(uint256 value) external {
    totalSupply = value;
  }

  function transfer(address, uint256) external pure returns (bool) {
    return true;
  }

  function transferFrom(address, address, uint256) external pure returns (bool) {
    return true;
  }
}

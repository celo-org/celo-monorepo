pragma solidity ^0.5.13;
// solhint-disable no-unused-vars

/**
 * @title A mock GoldToken for testing.
 */
contract MockGoldToken {
  uint8 public constant decimals = 18;
  uint256 public totalSupply;
  mapping(address => uint256) balances;

  function setTotalSupply(uint256 value) external {
    totalSupply = value;
  }

  function transfer(address, uint256) external pure returns (bool) {
    return true;
  }

  function transferFrom(address, address, uint256) external pure returns (bool) {
    return true;
  }

  function setBalanceOf(address a, uint256 value) external {
    balances[a] = value;
  }

  function balanceOf(address a) external view returns (uint256) {
    return balances[a];
  }

}

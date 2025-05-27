// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

/**
 * @title A mock StableToken for testing. This contract can be deprecated once GoldToken gets migrated to 0.8
 */
contract MockCeloToken08 {
  uint256 public totalSupply_;
  uint8 public constant decimals = 18;
  mapping(address => uint256) balances;

  function setTotalSupply(uint256 value) external {
    totalSupply_ = value;
  }

  function transfer(address to, uint256 amount) external returns (bool) {
    return _transfer(msg.sender, to, amount);
  }

  function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    return _transfer(from, to, amount);
  }

  function setBalanceOf(address a, uint256 value) external {
    balances[a] = value;
  }

  function balanceOf(address a) public view returns (uint256) {
    return balances[a];
  }

  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }

  function _transfer(address from, address to, uint256 amount) internal returns (bool) {
    if (balances[from] < amount) {
      return false;
    }
    balances[from] -= amount;
    balances[to] += amount;
    return true;
  }
}

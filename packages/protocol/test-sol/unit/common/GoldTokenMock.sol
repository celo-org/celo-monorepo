// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

// solhint-disable no-unused-vars

import "@celo-contracts-8/common/GoldToken.sol";

/**
 * @title A mock GoldToken for testing.
 */
contract GoldTokenMock is GoldToken(true) {
  uint8 public constant override decimals = 18;
  mapping(address => uint256) balances;

  function setTotalSupply(uint256 value) external {
    totalSupply_ = value;
  }

  function transfer(address to, uint256 amount) external override returns (bool) {
    return _transfer(msg.sender, to, amount);
  }

  function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
    return _transfer(from, to, amount);
  }

  function _transfer(address from, address to, uint256 amount) internal returns (bool) {
    if (balances[from] < amount) {
      return false;
    }
    balances[from] -= amount;
    balances[to] += amount;
    return true;
  }

  function setBalanceOf(address a, uint256 value) external {
    balances[a] = value;
  }

  function balanceOf(address a) public view override returns (uint256) {
    return balances[a];
  }
}

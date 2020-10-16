pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract MockERC20Token {
  using SafeMath for uint256;

  mapping(address => uint256) private balances;

  function transfer(address to, uint256 value) external returns (bool) {
    return transferFrom(msg.sender, to, value);
  }

  function mint(address to, uint256 amount) external returns (bool) {
    balances[to] = balances[to].add(amount);
    return true;
  }

  function balanceOf(address owner) external view returns (uint256) {
    return balances[owner];
  }

  function transferFrom(address from, address to, uint256 value) public returns (bool) {
    balances[from] = balances[from].sub(value);
    balances[to] = balances[to].add(value);
    return true;
  }
}

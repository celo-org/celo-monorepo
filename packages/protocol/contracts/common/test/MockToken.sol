pragma solidity ^0.5.13;
// solhint-disable no-unused-vars

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title A mock ERC20 token for testing.
 */
contract MockToken {
  using SafeMath for uint256;

  uint8 public constant decimals = 18;
  uint256 public _totalSupply;
  mapping(address => uint256) public balanceOf;

  function setTotalSupply(uint256 value) external {
    _totalSupply = value;
  }

  function mint(address to, uint256 value) external returns (bool) {
    balanceOf[to] = balanceOf[to].add(value);
    return true;
  }

  function burn(uint256) external pure returns (bool) {
    return true;
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function transfer(address to, uint256 value) external returns (bool) {
    if (balanceOf[msg.sender] < value) {
      return false;
    }
    balanceOf[msg.sender] = balanceOf[msg.sender].sub(value);
    balanceOf[to] = balanceOf[to].add(value);
    return true;
  }

  function transferFrom(address, address, uint256) external pure returns (bool) {
    return true;
  }
}

pragma solidity ^0.5.3;
// solhint-disable no-unused-vars

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title A mock StableToken for testing.
 */
contract MockStableToken {
  using SafeMath for uint256;

  uint8 public constant decimals = 18;
  bool public _needsRebase;
  uint256 public _totalSupply;
  uint256 public _targetTotalSupply;
  mapping(address => uint256) public balanceOf;

  function setNeedsRebase() external {
    _needsRebase = true;
  }

  function setTotalSupply(uint256 value) external {
    _totalSupply = value;
  }

  function setTargetTotalSupply(uint256 value) external {
    _targetTotalSupply = value;
  }

  function mint(address to, uint256 value) external returns (bool) {
    balanceOf[to] = balanceOf[to].add(value);
    return true;
  }

  function burn(uint256) external pure returns (bool) {
    return true;
  }

  function needsRebase() external view returns (bool) {
    return _needsRebase;
  }

  // solhint-disable-next-line no-empty-blocks
  function resetLastRebase() external pure {}

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function targetTotalSupply() external view returns (uint256) {
    return _targetTotalSupply;
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

pragma solidity ^0.5.13;

contract GetSetV0 {
  uint256 public x;

  function get() external view returns (uint256) {
    return x;
  }

  function set(uint256 _x) external {
    x = _x;
  }
}

pragma solidity ^0.5.3;


contract GetSetV0 {
  uint256 public x;

  function get() external view returns (uint256) {
    return x;
  }

  function set(uint256 _x) external {
    x = _x;
  }
}

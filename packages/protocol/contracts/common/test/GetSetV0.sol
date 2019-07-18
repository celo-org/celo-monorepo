pragma solidity ^0.5.8;


contract GetSetV0 {
  uint256 public x;

  function get() public view returns (uint256) {
    return x;
  }

  function set(uint256 _x) public {
    x = _x;
  }
}

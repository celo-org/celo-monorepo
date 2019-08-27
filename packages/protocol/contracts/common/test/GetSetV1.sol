pragma solidity ^0.5.3;


contract GetSetV1 {
  uint256 public x;
  string public y;

  function get() external view returns (uint256, string memory) {
    return (x, y);
  }

  function set(uint256 _x, string memory _y) public {
    x = _x;
    y = _y;
  }
}

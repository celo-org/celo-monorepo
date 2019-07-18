pragma solidity ^0.5.8;


contract GetSetV1 {
  uint256 public x;
  string public y;

  function get() public view returns (uint256, string memory) {
    return (x, y);
  }

  function set(uint256 _x, string memory _y) public {
    x = _x;
    y = _y;
  }
}

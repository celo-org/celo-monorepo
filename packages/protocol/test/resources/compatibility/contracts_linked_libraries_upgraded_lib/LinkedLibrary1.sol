pragma solidity ^0.5.3;

library LinkedLibrary1 {
  struct Struct {
    uint256 field;
  }

  function get(Struct storage s) public view returns (uint256) {
    return s.field;
  }

  function increase(Struct storage s) public {
    s.field += 1;
  }
}

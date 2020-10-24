pragma solidity ^0.5.13;

import "./TestLibraryStruct.sol";

library TestLibrary1 {
  function increase(uint256 x) public view returns (uint256) {
    return x + 1;
  }

  function combine(uint256 x, uint256 y) public view returns (uint256) {
    return x + y;
  }

  function set(TestLibraryStruct.S storage s, uint256 x) public {
    s.x = x;
  }
}

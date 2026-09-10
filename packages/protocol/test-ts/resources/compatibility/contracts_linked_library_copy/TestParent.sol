pragma solidity ^0.5.13;

import "./TestLibrary.sol";

contract TestParent {
  using TestLibrary for TestLibrary.Thing;

  uint256 private p;
  address private q;

  TestLibrary.Thing libraryThing;

  function doubled(uint256 x) external pure returns (uint256) {
    return TestLibrary.twice(x);
  }
}

pragma solidity ^0.8.19;

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

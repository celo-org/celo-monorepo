pragma solidity ^0.5.13;

import "./TestParent.sol";

contract TestContract is TestParent {
  struct Thing {
    uint128 a;
    uint128 b;
    uint128 c;
  }

  uint256 public x;
  address public z;

  Thing public thing;

  function newMethod1(uint256 u) external {}

  function newMethod2(uint256 s) external pure returns (uint256) {
    return s + 1;
  }
}

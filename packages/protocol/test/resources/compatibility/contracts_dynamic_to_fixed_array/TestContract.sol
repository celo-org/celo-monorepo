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

  uint128[5] fixedArray;
  uint256[2] array;
  mapping(uint256 => mapping(uint128 => address[])) map;

  Thing public thing;
}

pragma solidity ^0.5.3;

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
  uint256[] array;
  mapping(uint256 => mapping(uint256 => address[])) map;

  Thing public thing;
}

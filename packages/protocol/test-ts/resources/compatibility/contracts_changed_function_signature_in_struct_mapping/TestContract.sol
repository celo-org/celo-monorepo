pragma solidity ^0.5.13;

import "./TestParent.sol";

contract TestContract is TestParent {
  enum Kind {
    A,
    B
  }

  struct Inner {
    uint128 p;
  }

  struct Thing {
    function(uint256) internal pure returns (uint256) hook;
    uint128 a;
    Kind kind;
    Inner inner;
    uint128 b;
  }

  struct Item {
    uint128 q;
  }

  uint256 public x;
  address public z;

  mapping(uint256 => Thing) thingMapping;
  Item[] items;
}

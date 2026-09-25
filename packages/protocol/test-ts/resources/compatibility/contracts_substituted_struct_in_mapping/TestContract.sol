pragma solidity ^0.5.13;

contract TestContract {
  struct Swapped {
    uint256 k;
    uint256 m;
  }

  enum Kind {
    A,
    B
  }

  struct Inner {
    uint128 p;
  }

  struct Thing {
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

  mapping(uint256 => Swapped) thingMapping;
  Item[] items;
}

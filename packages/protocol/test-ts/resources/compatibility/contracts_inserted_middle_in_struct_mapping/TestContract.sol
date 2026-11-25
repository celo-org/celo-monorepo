pragma solidity ^0.5.13;

contract TestContract {
  struct Thing {
    uint128 a;
    uint128 inserted;
    uint128 b;
    uint128 c;
  }

  uint256 public x;
  address public z;

  struct Other {
    uint256 d;
  }

  mapping(uint256 => Thing) thingMapping;
  mapping(uint256 => Other) otherMapping;
}

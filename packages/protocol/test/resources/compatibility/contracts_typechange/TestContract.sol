pragma solidity ^0.5.13;

import "./TestParent.sol";

contract TestContract is TestParent {
  struct Thing {
    uint128 a;
    uint128 b;
    uint128 c;
  }

  bytes32 public x;
  address public z;

  Thing public thing;
}

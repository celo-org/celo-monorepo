pragma solidity ^0.5.13;

import "./TestParent.sol";

contract TestContract is TestParent {
  struct Thing {
    uint128 a;
    uint128 b;
    uint128 deprecated_c;
  }

  uint256 public x;
  address public z;

  Thing public thing;
}

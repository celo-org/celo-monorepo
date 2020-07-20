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
  uint256 public insertedVariable;

  Thing public thing;
}

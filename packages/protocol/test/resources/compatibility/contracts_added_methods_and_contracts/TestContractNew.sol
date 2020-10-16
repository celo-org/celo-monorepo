pragma solidity ^0.5.13;

import "./TestParent.sol";

contract TestContractNew is TestParent {
  struct Thing {
    uint128 a;
    uint128 b;
    uint128 c;
  }

  uint256 public x;
  address public z;

  Thing public thing;
}

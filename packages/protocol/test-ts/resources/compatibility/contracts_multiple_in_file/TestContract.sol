pragma solidity ^0.5.13;

interface IFirstInFile {
  function first() external;
}

library SecondInFile {
  function second() public pure returns (uint256) {
    return 2;
  }
}

contract TestContract {
  constructor() public {}

  function isConstructor() public pure returns (bool) {
    return false;
  }

  struct Thing {
    uint128 a;
    uint128 b;
    uint128 c;
  }

  uint256 public x;
  address public z;

  Thing public thing;
}

pragma solidity ^0.5.3;

contract UnmodifiedContract {
  uint256 i = 3;

  function someMethod1(uint256 u) external {
    i = u;
  }

  function someMethod2(uint256 s) external pure returns (uint256) {
    return s + 1;
  }
}

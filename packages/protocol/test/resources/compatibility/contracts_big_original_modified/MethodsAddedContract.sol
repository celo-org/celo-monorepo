pragma solidity ^0.5.3;

contract MethodsAddedContract {
  uint256 i = 3;

  function someMethod1(uint256 u) external {
    i = u;
  }

  function someMethod2(uint256 s) external pure returns (uint256) {
    return s + 1;
  }

  function newMethod1() external view returns (uint256) {
    return i;
  }

  function newMethod2(uint256 p) public payable returns (uint256) {
    return i + 2 + p;
  }

}

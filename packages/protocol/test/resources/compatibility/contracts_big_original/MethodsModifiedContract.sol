pragma solidity ^0.5.13;

contract MethodsModifiedContract {
  string a = "value";
  uint256 i = 3;

  function someMethod1(uint256 u) external {
    i = u;
  }

  function someMethod2(uint256 s) external pure returns (uint256) {
    return s + 1;
  }

  function someMethod3(uint256 s, string memory arg) public returns (uint256, string memory) {
    string memory res = string(abi.encodePacked(arg, a));
    a = arg;
    return (s + 1, res);
  }

  function someMethod4(uint256 s) public payable returns (uint256) {
    return s + 1;
  }

}

pragma solidity ^0.5.3;

contract MethodsModifiedContract {
  string a = "value";
  uint256 i = 3;

  function someMethod1(uint256 u) public {
    i = u;
  }

  function someMethod2(uint256 s) external view returns (uint256) {
    return i + s + 1;
  }

  function someMethod3(uint256 s, string memory arg)
    public
    returns (uint256, string memory, uint256)
  {
    string memory res = string(abi.encodePacked(arg, a));
    a = arg;
    return (s + 1, res, i);
  }

  function someMethod4(uint256 s) public returns (uint256) {
    i = s;
    return s + 1;
  }

}

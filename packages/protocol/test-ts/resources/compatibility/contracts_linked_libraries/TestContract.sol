pragma solidity ^0.5.3;

import "./LinkedLibrary1.sol";
import "./LinkedLibrary2.sol";

contract TestContract {
  using LinkedLibrary1 for LinkedLibrary1.Struct;
  using LinkedLibrary2 for LinkedLibrary2.Struct;

  LinkedLibrary1.Struct s1;
  LinkedLibrary2.Struct s2;

  function get1() external view returns (uint256) {
    return s1.get();
  }

  function get2() external view returns (uint256) {
    return s2.get();
  }

  function doIncreases() external {
    s1.increase();
    s2.increase();
  }
}

pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

import "@test-sol/TestWithUtils08.sol";

contract WhenL2 is TestWithUtils08 {
  function setUp() public virtual override {
    super.setUp();
    whenL2WithEpochManagerInitialization();
  }
}

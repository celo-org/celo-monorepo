pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "@test-sol/TestWithUtils.sol";

contract WhenL2 is TestWithUtils {
  function setUp() public {
    super.setUp();
    whenL2WithEpochManagerInitialization();
  }
}

pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "@test-sol/utils.sol";

contract WhenL2 is Utils {
  function setUp() public {
    super.setUp();
    whenL2WithEpochManagerInitialization();
  }
}

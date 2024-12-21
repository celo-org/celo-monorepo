pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

import "@test-sol/utils08.sol";

contract WhenL2 is Utils08 {
  function setUp() public virtual override {
    super.setUp();
    whenL2WithEpochManagerInitialization();
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "forge-std/console.sol";

// here only to forge compile of  ValidatorsMock
import "./ValidatorsMock.sol";

contract DowntimeSlasherMock is Test {
  function test_nop() public {
    console.log("nop");
  }
}

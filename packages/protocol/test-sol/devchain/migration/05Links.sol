// This file exists only to force migration tests also compile below imported contracts.
// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

contract BlockchainParametersTest is TestWithUtils08 {
  function test_dummy_test() public {}
}

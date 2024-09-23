// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";

contract IntegrationsValidators is Test, Devchain {
  function test_deaffiliateWorskWithEpochManager() public {
    // address of an allowed validator
    vm.prank(address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65));
    validators.deaffiliate();
  }
}

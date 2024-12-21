// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// import "celo-foundry-8/Test.sol";
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";

contract IntegrationsValidators is Devchain {
  function test_deaffiliateWorskWithEpochManager() public {
    vm.prank(election.electValidatorAccounts()[0]);
    validators.deaffiliate();
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Helper contracts
import { Test } from "celo-foundry/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";
import { GoldTokenMock } from "@test-sol/unit/common/GoldTokenMock.sol";

// Contract to test
import "@celo-contracts/common/FeeHandler.sol";

// Dependencies
import { IRegistry } from "@celo-contracts/common/interfaces/IRegistry.sol";
import { GoldToken } from "@celo-contracts/common/GoldToken.sol";
import { FeeHandlerSeller } from "@celo-contracts/common/FeeHandlerSeller.sol";
import { MentoFeeHandlerSeller } from "@celo-contracts/common/MentoFeeHandlerSeller.sol";
import { UniswapFeeHandlerSeller } from "@celo-contracts/common/UniswapFeeHandlerSeller.sol";

contract FeeHandlerSellerTest is Test, TestConstants {
  // Constants
  uint256 constant ONE_CELOTOKEN = 1000000000000000000;

  // Actors
  address receiver = actor("receiver");

  // Contract instances
  IRegistry registry;
  GoldTokenMock celoToken; // Using mock token to work around missing transfer precompile
  FeeHandlerSeller mentoFeeHandlerSeller;
  FeeHandlerSeller uniswapFeeHandlerSeller;

  // Helper data structures
  FeeHandlerSeller[] contractsToTest;

  function setUp() public {
    // Boilerplate
    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    registry = IRegistry(REGISTRY_ADDRESS);
    celoToken = new GoldTokenMock();

    // Contracts to be tested
    mentoFeeHandlerSeller = new MentoFeeHandlerSeller(true);
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);

    contractsToTest.push(mentoFeeHandlerSeller);
    contractsToTest.push(uniswapFeeHandlerSeller);
  }
}

contract FeeHandlerSellerTest_Transfer is FeeHandlerSellerTest {
  function test_ShouldTransfer() public {
    for (uint256 i = 0; i < contractsToTest.length; i++) {
      // Given...
      celoToken.setBalanceOf(receiver, 0); // Reset balance of receiver
      assertEq(celoToken.balanceOf(receiver), 0, "Balance of receiver should be 0 at start");
      celoToken.setBalanceOf(address(contractsToTest[i]), ONE_CELOTOKEN); // Faucet contract
      assertEq(celoToken.balanceOf(address(contractsToTest[i])), ONE_CELOTOKEN, "Balance of contract should be 1 at start");

      // When...
      vm.prank(contractsToTest[i].owner());
      contractsToTest[i].transfer(address(celoToken), ONE_CELOTOKEN, receiver);

      // Then...
      assertEq(celoToken.balanceOf(receiver), ONE_CELOTOKEN, "Balance of receiver should be 1 after transfer");
      assertEq(celoToken.balanceOf(address(contractsToTest[i])), 0, "Balance of contract should be 0 after transfer");
    }
  }
}

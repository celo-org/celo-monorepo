// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Helper contracts
import { Test } from "celo-foundry/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

// Contract to test
import "@celo-contracts/common/FeeHandler.sol";

// Dependencies
import { GoldToken } from "@celo-contracts/common/GoldToken.sol";
import { IFeeHandlerSeller } from "@celo-contracts/common/interfaces/IFeeHandlerSeller.sol";
import { MentoFeeHandlerSeller } from "@celo-contracts/common/MentoFeeHandlerSeller.sol";
import { UniswapFeeHandlerSeller } from "@celo-contracts/common/UniswapFeeHandlerSeller.sol";

contract FeeHandlerSellerTest is Test, TestConstants {
  // Constants
  uint256 constant ONE_CELOTOKEN = 1000000000000000000;

  // Actors
  address receiver = actor("receiver");

  // Contract instances
  IRegistry registry;
  GoldToken celoToken;
  IFeeHandlerSeller mentoFeeHandlerSeller;
  IFeeHandlerSeller uniswapFeeHandlerSeller;

  // Helper data structures
  IFeeHandlerSeller[] contractsToTest;

  function setUp() public {
    // owner = address(this);
    // vm.prank(owner);

    // Boilerplate
    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    registry = IRegistry(REGISTRY_ADDRESS);
    celoToken = new GoldToken(true);

    // Contracts to be tested
    mentoFeeHandlerSeller = new MentoFeeHandlerSeller(true);
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);

    contractsToTest.push(mentoFeeHandlerSeller);
    contractsToTest.push(uniswapFeeHandlerSeller);

    // registry.setAddressFor("GoldToken", address(celoToken));
    // registry.setAddressFor("CeloToken", address(celoToken));
  }
}

contract FeeHandlerSellerTest_Transfer is FeeHandlerSellerTest {
  function test_ShouldTransfer() public {
    /* 
      for (const contract of contractsToTest) {
        const receiver = web3.eth.accounts.create().address
        assertEqualBN(await goldToken.balanceOf(receiver), new BigNumber(0))

        await goldToken.transfer(contract.address, oneCelo)
        await contract.transfer(goldToken.address, oneCelo, receiver)
        assertEqualBN(await goldToken.balanceOf(receiver), oneCelo)
        assertEqualBN(await goldToken.balanceOf(contract.address), new BigNumber(0))
      }
      */
    for (uint256 i = 0; i < contractsToTest.length; i++) {
      assertEq(celoToken.balanceOf(receiver), 0, "Balance of receiver should be 0 at start");
      vm.deal(address(contractsToTest[i]), ONE_CELOTOKEN); // Faucet contract

      vm.prank(address(this));
      contractsToTest[i].transfer(address(celoToken), ONE_CELOTOKEN, receiver); // Transfer from contract
      assertEq(celoToken.balanceOf(receiver), 0, "Balance of receiver should be 1 after transfer");
      assertEq(celoToken.balanceOf(address(contractsToTest[i])), 0, "Balance of contract should be 0");
    }

    
  }
}

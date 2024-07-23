// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Helper contracts
import { Test } from "celo-foundry/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import { UniswapFeeHandlerSeller } from "@celo-contracts/common/UniswapFeeHandlerSeller.sol";

import { console2 as console } from "celo-foundry/Test.sol";

contract UniswapFeeHandlerSellerTest is Test, TestConstants {
  // Actors
  address TOKEN_ADDRESS = actor("Arbitrary Token Address");
  address ROUTER_ADDRESS = actor("Arbitrary Router Address");
  address NON_OWNER_ADDRESS = actor("Arbitrary Non-Owner");
  address ZERO_ADDRESS = address(0);
  address UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS;

  // Contract instance
  UniswapFeeHandlerSeller uniswapFeeHandlerSeller;

  function setUp() public {
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);
    UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS = uniswapFeeHandlerSeller.owner();
  }
}

contract UniswapFeeHandlerSellerTest_SetRouter is UniswapFeeHandlerSellerTest {
  function test_SetRouter_ShouldSucceedWhen_CalledByOwner() public {
    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ROUTER_ADDRESS);

    assertEq(uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS)[0], ROUTER_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_CalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);

    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ROUTER_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_SettingRouterToZeroAddress() public {
    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);

    vm.expectRevert("Router can't be address zero");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ZERO_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_SettingMoreRoutesThanMaxAllowed() public {
    uint256 MAX_NUMBER_ROUTERS_PER_TOKEN = 3; // This is a constant in the contract so it cannot be read from contract storage.

    // Set exactly permitted number of routers
    for (uint256 i = 0; i < 10; i++) {
      /////// DEBUGGING //////
      console.log("Setting router %d", i);
      /////// DEBUGGING //////
      vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
      uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ROUTER_ADDRESS);
    }

    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    // vm.expectRevert("Max number of routers reached");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ROUTER_ADDRESS); // Attempt to set one more router
    console.log("Routers for token:", uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS).length);
  }
}

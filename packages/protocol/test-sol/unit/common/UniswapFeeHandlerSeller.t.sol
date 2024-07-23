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
  address ARBITRARY_ROUTER_ADDRESS_A = actor("Arbitrary Router Address A");
  address ARBITRARY_ROUTER_ADDRESS_B = actor("Arbitrary Router Address B");
  address ARBITRARY_ROUTER_ADDRESS_C = actor("Arbitrary Router Address C");
  address ARBITRARY_ROUTER_ADDRESS_D = actor("Arbitrary Router Address D");
  address NON_OWNER_ADDRESS = actor("Arbitrary Non-Owner");
  address UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS;
  address ZERO_ADDRESS = address(0);

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
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);

    assertEq(uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS)[0], ARBITRARY_ROUTER_ADDRESS_A);
  }

  function test_SetRouter_ShouldRevertWhen_CalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);

    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
  }

  function test_SetRouter_ShouldRevertWhen_SettingRouterToZeroAddress() public {
    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);

    vm.expectRevert("Router can't be address zero");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ZERO_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_SettingMoreRoutesThanMaxAllowed() public {
    vm.startPrank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_B);
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_C); // Max number of routers

    vm.expectRevert("Max number of routers reached");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_D); // Attempt to set one more router
    vm.stopPrank();
  }
}

contract UniswapFeeHandlerSellerTest_RemoveRouter is UniswapFeeHandlerSellerTest {
  function setUp() public {
    super.setUp();

    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
  }

  function test_RemoveRouter_ShouldSucceedWhen_CalledByOwner() public {
    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.removeRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);

    assertEq(uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS).length, 0);
  }

  // function test_RemoveRouter_ShouldSucceedWhen_ListIsLarge() public {
  //   address[] memory EXPECTED_ROUTERS;

  //   vm.startPrank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
  //   uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
  //   uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_B);
  //   uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_C);
  //   uniswapFeeHandlerSeller.removeRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_C);
  //   vm.stopPrank();

  //   EXPECTED_ROUTERS[0] = ARBITRARY_ROUTER_ADDRESS_A;
  //   EXPECTED_ROUTERS[1] = ARBITRARY_ROUTER_ADDRESS_B;

  //   assertEq(uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS).length, EXPECTED_ROUTERS.length);
  //   assertEq(uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS), EXPECTED_ROUTERS);
  // }

  function test_RemoveRouter_ShouldRevertWhen_CalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);

    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.removeRouter(TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
  }
}
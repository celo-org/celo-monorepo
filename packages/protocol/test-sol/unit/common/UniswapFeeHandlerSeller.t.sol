// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Helper contracts
import { Test } from "celo-foundry/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import { UniswapFeeHandlerSeller } from "@celo-contracts-8/common/UniswapFeeHandlerSeller.sol";

contract UniswapFeeHandlerSellerTest is Test, TestConstants {
  // Actors
  address ZERO_ADDRESS = address(0);
  address UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS;
  address NON_OWNER_ADDRESS = actor("Arbitrary Non-Owner");
  address ARBITRARY_TOKEN_ADDRESS = actor("Arbitrary Token Address");
  address ARBITRARY_ROUTER_ADDRESS_A = actor("Arbitrary Router Address A");
  address ARBITRARY_ROUTER_ADDRESS_B = actor("Arbitrary Router Address B");
  address ARBITRARY_ROUTER_ADDRESS_C = actor("Arbitrary Router Address C");
  address ARBITRARY_ROUTER_ADDRESS_D = actor("Arbitrary Router Address D");

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
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);

    assertEq(
      uniswapFeeHandlerSeller.getRoutersForToken(ARBITRARY_TOKEN_ADDRESS)[0],
      ARBITRARY_ROUTER_ADDRESS_A
    );
  }

  function test_SetRouter_ShouldRevertWhen_CalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);

    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
  }

  function test_SetRouter_ShouldRevertWhen_SettingRouterToZeroAddress() public {
    vm.prank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);

    vm.expectRevert("Router can't be address zero");
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ZERO_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_SettingMoreRoutesThanMaxAllowed() public {
    vm.startPrank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_B);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_C); // Max number of routers defined in contract

    vm.expectRevert("Max number of routers reached");
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_D); // Attempt to set one more router
    vm.stopPrank();
  }
}

contract UniswapFeeHandlerSellerTest_RemoveRouter is UniswapFeeHandlerSellerTest {
  function test_RemoveRouter_ShouldSucceedWhen_CalledByOwner() public {
    vm.startPrank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
    uniswapFeeHandlerSeller.removeRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
    vm.stopPrank();

    assertEq(uniswapFeeHandlerSeller.getRoutersForToken(ARBITRARY_TOKEN_ADDRESS).length, 0);
  }

  function test_RemoveRouter_ShouldSucceedWhen_ListIsLarge() public {
    address[2] memory EXPECTED_ROUTERS;

    vm.startPrank(UNISWAP_FEE_HANDLER_SELLER_OWNER_ADDRESS);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_B);
    uniswapFeeHandlerSeller.setRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_C);
    uniswapFeeHandlerSeller.removeRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_C);
    vm.stopPrank();

    EXPECTED_ROUTERS[0] = ARBITRARY_ROUTER_ADDRESS_A;
    EXPECTED_ROUTERS[1] = ARBITRARY_ROUTER_ADDRESS_B;

    assertEq(
      uniswapFeeHandlerSeller.getRoutersForToken(ARBITRARY_TOKEN_ADDRESS).length,
      EXPECTED_ROUTERS.length
    );
    assertEq(
      uniswapFeeHandlerSeller.getRoutersForToken(ARBITRARY_TOKEN_ADDRESS)[0],
      EXPECTED_ROUTERS[0]
    ); // Can't use assertEq for arrays
    assertEq(
      uniswapFeeHandlerSeller.getRoutersForToken(ARBITRARY_TOKEN_ADDRESS)[1],
      EXPECTED_ROUTERS[1]
    );
  }

  function test_RemoveRouter_ShouldRevertWhen_CalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);

    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.removeRouter(ARBITRARY_TOKEN_ADDRESS, ARBITRARY_ROUTER_ADDRESS_A);
  }
}

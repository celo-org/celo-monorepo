// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Helper contracts
import { Test } from "celo-foundry/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import { UniswapFeeHandlerSeller } from "@celo-contracts/common/UniswapFeeHandlerSeller.sol";

contract UniswapFeeHandlerSellerTest is Test, TestConstants {
  // Actors
  address TOKEN_ADDRESS = actor("Arbitrary Token Address");
  address ROUTER_ADDRESS = actor("Arbitrary Router Address");
  address NON_OWNER_ADDRESS = actor("Arbitrary Non-Owner");
  address ZERO_ADDRESS = address(0);

  // Contract instance
  UniswapFeeHandlerSeller uniswapFeeHandlerSeller;

  function setUp() public {
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);
  }
}

contract UniswapFeeHandlerSellerTest_SetRouter is UniswapFeeHandlerSellerTest {
  function test_SetRouter_ShouldSucceedWhen_CalledByOwner() public {
    vm.prank(uniswapFeeHandlerSeller.owner());
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ROUTER_ADDRESS);

    assertEq(uniswapFeeHandlerSeller.getRoutersForToken(TOKEN_ADDRESS)[0], ROUTER_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_CalledByNonOwner() public {
    vm.prank(NON_OWNER_ADDRESS);

    vm.expectRevert("Ownable: caller is not the owner");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ROUTER_ADDRESS);
  }

  function test_SetRouter_ShouldRevertWhen_SettingRouterToZeroAddress() public {
    vm.prank(uniswapFeeHandlerSeller.owner());

    vm.expectRevert("Router can't be address zero");
    uniswapFeeHandlerSeller.setRouter(TOKEN_ADDRESS, ZERO_ADDRESS);
  }
}

// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { Test } from "celo-foundry-8/Test.sol";

import { SuperBridgeETHWrapper } from "@celo-contracts-8/common/SuperBridgeETHWrapper.sol";

import { MockWETH } from "./mocks/MockWETH.sol";
import { MockStandardBridge } from "./mocks/MockStandardBridge.sol";
import { IWETH } from "@celo-contracts-8/common/interfaces/IWETH.sol";

contract SuperBridgeETHWrapperTestBase is Test {
  SuperBridgeETHWrapper public wrapper;
  MockWETH public mockWethLocal;
  MockStandardBridge public mockBridge;

  address public wethLocalAddr;
  address public wethRemoteAddr = address(0x0000000000000000000000000000000000000042);
  address public bridgeAddr;

  address public user = actor("user");

  event WrappedAndBridged(address indexed sender, uint256 amount);

  function setUp() public {
    mockWethLocal = new MockWETH();
    mockBridge = new MockStandardBridge();

    wethLocalAddr = address(mockWethLocal);
    bridgeAddr = address(mockBridge);

    wrapper = new SuperBridgeETHWrapper(wethLocalAddr, wethRemoteAddr, bridgeAddr);

    vm.deal(user, 10 ether);
  }
}

contract SuperBridgeETHWrapper_WrapAndBridge is SuperBridgeETHWrapperTestBase {
  function test_SuperBridge_ShouldWrapAndSend() public {
    uint256 amountToSend = 1 ether;

    assertEq(mockWethLocal.balanceOf(address(wrapper)), 0);
    assertEq(mockWethLocal.allowance(address(wrapper), bridgeAddr), 0);

    uint256 userBalanceBefore = address(user).balance;

    vm.expectEmit(true, true, false, true);
    emit WrappedAndBridged(user, amountToSend);
    vm.prank(user);
    wrapper.wrapAndBridge{ value: amountToSend }(user, 200_000);

    assertEq(address(user).balance, userBalanceBefore - amountToSend);
    assertEq(mockWethLocal.balanceOf(address(wrapper)), 0);
    assertEq(mockWethLocal.balanceOf(bridgeAddr), amountToSend);

    assertEq(mockBridge.lastAmount(), amountToSend, "amount to send");
    assertEq(mockBridge.lastLocalToken(), wethLocalAddr, "local token");
    assertEq(mockBridge.lastRemoteToken(), wethRemoteAddr, "remote token");
    assertEq(mockBridge.lastTo(), user, "to");
    assertEq(mockBridge.lastMinGasLimit(), 200_000, "gas limit");
    assertEq(mockBridge.lastExtraData(), bytes(""), "bytes");

    assertEq(mockWethLocal.allowance(address(wrapper), bridgeAddr), 0);
  }

  function test_Revert_WhenNoValueSent() public {
    vm.prank(user);
    vm.expectRevert("No ETH sent");
    wrapper.wrapAndBridge{ value: 0 }(user, 200_000);
  }
}

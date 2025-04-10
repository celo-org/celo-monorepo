// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.15;

import { Test } from "celo-foundry-8/Test.sol";

import { SuperBridgeETHWrapper } from "@celo-contracts-8/common/SuperBridgeETHWrapper.sol";

import { MockWETH } from "./mocks/MockWETH.sol";
import { MockStandardBridge } from "./mocks/MockStandardBridge.sol";
import { IWETH } from "@celo-contracts-8/common/interfaces/IWETH.sol";
import { IStandardBridge } from "@celo-contracts-8/common/interfaces/IStandardBridge.sol";

contract SuperBridgeETHWrapperTestBase is Test {
  SuperBridgeETHWrapper public wrapper;
  MockWETH public mockWethLocal;
  MockStandardBridge public mockBridge;

  address public wethLocalAddr;
  address public wethRemoteAddr = address(0x0000000000000000000000000000000000000042);
  address public bridgeAddr;

  address public owner = actor("owner");
  address public user = actor("user");
  address public otherUser = actor("otherUser");

  event WrappedAndBridged(address indexed sender, uint256 amount);

  function setUp() public {
    mockWethLocal = new MockWETH();
    mockBridge = new MockStandardBridge();

    wethLocalAddr = address(mockWethLocal);
    bridgeAddr = address(mockBridge);

    wrapper = new SuperBridgeETHWrapper(true);

    vm.prank(owner);
    wrapper.initialize(wethLocalAddr, wethRemoteAddr, bridgeAddr);

    vm.deal(user, 10 ether);
  }
}

contract SuperBridgeETHWrapper_Initialize is SuperBridgeETHWrapperTestBase {
  function test_SetsCorrectValues() public {
    assertEq(address(wrapper.wethAddressLocal()), wethLocalAddr);
    assertEq(wrapper.wethAddressRemote(), wethRemoteAddr);
    assertEq(address(wrapper.standardBridge()), bridgeAddr);
    assertEq(wrapper.owner(), owner);
  }

  function test_Revert_AlreadyInitialized() public {
    vm.prank(owner);
    vm.expectRevert("contract already initialized");
    wrapper.initialize(wethLocalAddr, wethRemoteAddr, bridgeAddr);
  }

  function test_Revert_ZeroAddress_WethLocal() public {
    SuperBridgeETHWrapper newWrapper = new SuperBridgeETHWrapper(true);
    vm.prank(owner);
    vm.expectRevert("Invalid address");
    newWrapper.initialize(address(0), wethRemoteAddr, bridgeAddr);
  }

  function test_Revert_ZeroAddress_WethRemote() public {
    SuperBridgeETHWrapper newWrapper = new SuperBridgeETHWrapper(true);
    vm.prank(owner);
    vm.expectRevert("Invalid address");
    newWrapper.initialize(wethLocalAddr, address(0), bridgeAddr);
  }

  function test_Revert_ZeroAddress_Bridge() public {
    SuperBridgeETHWrapper newWrapper = new SuperBridgeETHWrapper(true);
    vm.prank(owner);
    vm.expectRevert("Invalid address");
    newWrapper.initialize(wethLocalAddr, wethRemoteAddr, address(0));
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
    wrapper.wrapAndBridge{ value: amountToSend }();

    assertEq(address(user).balance, userBalanceBefore - amountToSend);
    assertEq(mockWethLocal.balanceOf(address(wrapper)), 0);
    assertEq(mockWethLocal.balanceOf(bridgeAddr), amountToSend);

    assertEq(mockBridge.lastAmount(), amountToSend);
    assertEq(mockBridge.lastLocalToken(), wethLocalAddr);
    assertEq(mockBridge.lastRemoteToken(), wethRemoteAddr);
    assertEq(mockBridge.lastTo(), user);
    assertEq(mockBridge.lastMinGasLimit(), 200_000);
    assertEq(mockBridge.lastExtraData(), bytes(""));

    assertEq(mockWethLocal.allowance(address(wrapper), bridgeAddr), 0);
  }

  function test_Revert_WhenNoValueSent() public {
    vm.prank(user);
    vm.expectRevert("No ETH sent");
    wrapper.wrapAndBridge{ value: 0 }();
  }
}

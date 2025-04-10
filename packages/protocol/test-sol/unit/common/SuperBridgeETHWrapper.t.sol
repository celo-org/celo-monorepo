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
    assertEq(address(wrapper.wethLocal()), wethLocalAddr);
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

contract SuperBridgeETHWrapper_SetAddresses is SuperBridgeETHWrapperTestBase {
  address newWethLocal = address(0x1111111111111111111111111111111111111111);
  address newWethRemote = address(0x2222222222222222222222222222222222222222);
  address newBridge = address(0x3333333333333333333333333333333333333333);

  function test_ShouldUpdateAddresses() public {
    vm.prank(owner);
    wrapper.setAddresses(newWethLocal, newWethRemote, newBridge);

    assertEq(address(wrapper.wethLocal()), newWethLocal);
    assertEq(wrapper.wethAddressRemote(), newWethRemote);
    assertEq(address(wrapper.standardBridge()), newBridge);
  }

  function test_Revert_IfNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    wrapper.setAddresses(newWethLocal, newWethRemote, newBridge);
  }

  function test_Revert_ZeroAddress_WethLocal() public {
    vm.prank(owner);
    vm.expectRevert("Invalid address");
    wrapper.setAddresses(address(0), newWethRemote, newBridge);
  }

  function test_Revert_ZeroAddress_WethRemote() public {
    vm.prank(owner);
    vm.expectRevert("Invalid address");
    wrapper.setAddresses(newWethLocal, address(0), newBridge);
  }

  function test_Revert_ZeroAddress_Bridge() public {
    vm.prank(owner);
    vm.expectRevert("Invalid address");
    wrapper.setAddresses(newWethLocal, newWethRemote, address(0));
  }
}

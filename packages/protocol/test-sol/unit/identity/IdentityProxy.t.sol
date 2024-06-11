// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/IdentityProxy.sol";
import "@celo-contracts/identity/test/IdentityProxyTest.sol";

contract IdentityProxyTestFoundry is Test {
  IdentityProxy identityProxy;
  IdentityProxyTest identityProxyTest;

  address randomActor = actor("randomActor");

  function setUp() public {
    identityProxy = new IdentityProxy();
    identityProxyTest = new IdentityProxyTest();
  }
}

contract IdentityProxyTestMakeCall is IdentityProxyTestFoundry {
  function setUp() public {
    super.setUp();
  }

  function test_CanBeUsedToForwardCall() public {
    uint256 value = 42;
    identityProxy.makeCall(
      address(identityProxyTest),
      abi.encodeWithSignature("setX(uint256)", value)
    );
    assertEq(identityProxyTest.x(), value);
  }

  function test_MakesCallsFromAddressOfTheProxy() public {
    identityProxy.makeCall(address(identityProxyTest), abi.encodeWithSignature("callMe()"));
    assertEq(identityProxyTest.lastAddress(), address(identityProxy));
  }

  function test_CannotBeCalledByAnyoneOtherThanTheOriginalDeployer() public {
    bytes memory txData = abi.encodeWithSignature("callMe()");
    vm.expectRevert("Only callable by original deployer");
    vm.prank(randomActor);
    identityProxy.makeCall(address(identityProxyTest), txData);
  }
}

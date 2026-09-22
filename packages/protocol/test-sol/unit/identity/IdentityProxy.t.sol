// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.9.0;

import "celo-foundry-8/Test.sol";
import { IdentityProxyTest } from "@test-sol/unit/identity/mocks/IdentityProxyMocks08.sol";

// IdentityProxy is a Solidity 0.5 contract from contracts-0.5, built by the solc05 profile into out-solc-0.5, so
// run `FOUNDRY_PROFILE=solc05 forge build` first (`yarn test` does). It is deployed via deployCodeTo (its
// constructor runs through deployCodeTo's self-call, so the deployer is this test contract).
interface IIdentityProxy {
  function makeCall(address destination, bytes calldata encodedFunctionCall) external payable;
}

contract IdentityProxyTestFoundry is Test {
  IIdentityProxy identityProxy;
  address identityProxyAddress;
  IdentityProxyTest identityProxyTest;

  address randomActor = actor("randomActor");

  function setUp() public virtual {
    identityProxyAddress = actor("identityProxy");
    deployCodeTo("out-solc-0.5/IdentityProxy.sol/IdentityProxy.json", identityProxyAddress);
    identityProxy = IIdentityProxy(identityProxyAddress);
    identityProxyTest = new IdentityProxyTest();
  }
}

contract IdentityProxyTestMakeCall is IdentityProxyTestFoundry {
  function setUp() public override {
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
    assertEq(identityProxyTest.lastAddress(), identityProxyAddress);
  }

  function test_CannotBeCalledByAnyoneOtherThanTheOriginalDeployer() public {
    bytes memory txData = abi.encodeWithSignature("callMe()");
    vm.expectRevert("Only callable by original deployer");
    vm.prank(randomActor);
    identityProxy.makeCall(address(identityProxyTest), txData);
  }
}

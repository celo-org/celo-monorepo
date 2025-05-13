pragma solidity ^0.5.13;

import "@celo-contracts/common/Proxy.sol";

import "celo-foundry/Test.sol";

import { Constants } from "@test-sol/constants.sol";
import { Utils } from "@test-sol/utils.sol";

import "@celo-contracts/common/test/GetSetV0.sol";
import "@celo-contracts/common/test/GetSetV1.sol";
import "@celo-contracts/common/test/HasInitializer.sol";
import "@celo-contracts/common/test/MsgSenderCheck.sol";

contract ProxyTest is Test, Constants, Utils {
  Proxy proxy;
  GetSetV0 getSet;
  GetSetV0 proxiedGetSet;

  address nonOwner;
  event ImplementationSet(address indexed implementation);
  event OwnerSet(address indexed owner);

  function setUp() public {
    nonOwner = actor("nonOwner");
    proxy = new Proxy();
    getSet = new GetSetV0();
    proxiedGetSet = new GetSetV0();
  }
}

contract ProxyTest_getOwner is ProxyTest {
  function test_ShouldGetTheAddressOfTheOwner() public {
    assertEq(proxy._getOwner(), address(this));
  }
}

contract ProxyTest_setImplementation is ProxyTest {
  function test_ShouldAllowTheOwnerToSetAnImplementation() public {
    proxy._setImplementation(address(getSet));
    assertEq(proxy._getImplementation(), address(getSet));
  }

  function test_Reverts_NonOwnerSsetAnImplementation() public {
    vm.expectRevert("sender was not owner");
    vm.prank(nonOwner);
    proxy._setImplementation(address(getSet));
  }

  function test_shouldAllowTheImplementationToBeUpdated() public {
    proxy._setImplementation(address(getSet));
    GetSetV1 getSet1 = new GetSetV1();
    proxy._setImplementation(address(getSet1));
    assertEq(proxy._getImplementation(), address(getSet1));
  }

  function test_ShouldNotAffectLogicRelatedStorage() public {
    uint256 numberTotest = 42;
    proxy._setImplementation(address(getSet));
    proxiedGetSet.set(numberTotest);
    GetSetV1 getSet1 = new GetSetV1();
    proxy._setImplementation(address(getSet1));

    assertEq(proxiedGetSet.get(), numberTotest);
  }

  function test_Emits_ImplementationSet() public {
    vm.expectEmit(true, true, true, true);
    emit ImplementationSet(address(getSet));
    proxy._setImplementation(address(getSet));
  }
}

contract ProxyTest_setAndInitializeImplementation is ProxyTest {
  HasInitializer hasInitializer;
  HasInitializer proxiedHasInitializer;

  function setUp() public {
    super.setUp();
    hasInitializer = new HasInitializer();
    proxiedHasInitializer = HasInitializer(address(proxy));
  }

  function test_ShouldAllowTheOwnerToSetAnImplementation() public {
    proxy._setAndInitializeImplementation(
      address(hasInitializer),
      abi.encodeWithSignature("initialize(uint256)", 42)
    );
    assertEq(proxy._getImplementation(), address(hasInitializer));
  }

  function test_Emits_ImplementationSet() public {
    vm.expectEmit(true, true, true, true);
    emit ImplementationSet(address(hasInitializer));
    proxy._setAndInitializeImplementation(
      address(hasInitializer),
      abi.encodeWithSignature("initialize(uint256)", 42)
    );
  }

  function test_Reverts_WhenCalledANonContractAddress() public {
    vm.expectRevert("sender was not owner");
    vm.prank(nonOwner);
    proxy._setAndInitializeImplementation(
      address(nonOwner),
      abi.encodeWithSignature("initialize(uint256)", 42)
    );
  }

  function test_Reverts_WehCalleBbyANonOwner() public {
    vm.expectRevert("sender was not owner");
    vm.prank(nonOwner);
    proxy._setAndInitializeImplementation(
      address(hasInitializer),
      abi.encodeWithSignature("initialize(uint256)", 42)
    );
  }

  function test_Reverts_WhenInitializeAlreadyCalled() public {
    proxy._setAndInitializeImplementation(
      address(hasInitializer),
      abi.encodeWithSignature("initialize(uint256)", 42)
    );
    vm.expectRevert("contract already initialized");
    proxiedHasInitializer.initialize(43);
  }
}

contract ProxyTest_transferOwnership is ProxyTest {
  address newOwner = actor("newOwner");

  function test_ShouldAllowTheOwnerToTransferOwnership() public {
    proxy._transferOwnership(newOwner);
    assertEq(proxy._getOwner(), newOwner);
  }

  function test_Reverts_ShouldNotAllowANonOwnerToTransferOwnership() public {
    vm.prank(nonOwner);
    vm.expectRevert("sender was not owner");
    proxy._transferOwnership(nonOwner);
  }

  function test_Emits_OwnerSet() public {
    vm.expectEmit(true, true, true, true);
    emit OwnerSet(newOwner);
    proxy._transferOwnership(newOwner);
  }

  function test_ShouldAllowTheNewOwnerToPerformOwneronlyActions_AfterTransferingOwnership() public {
    GetSetV1 getSet1 = new GetSetV1();
    proxy._transferOwnership(newOwner);
    vm.prank(newOwner);
    proxy._setImplementation(address(getSet1));
  }

  function test_Reverts_OldOwnerPerformsOwnerOnlyActions_AfterTransferingOwnership() public {
    GetSetV1 getSet1 = new GetSetV1();
    proxy._transferOwnership(newOwner);
    vm.expectRevert("sender was not owner");
    proxy._setImplementation(address(getSet1));
  }
}

contract ProxyTest_fallback is ProxyTest {
  uint256 numberTotest = 42;

  function setUp() public {
    super.setUp();
    proxy._setImplementation(address(getSet));
  }

  function test_ShouldCallFunctionsFromTheTargetContract() public {
    proxiedGetSet.set(numberTotest);
    assertEq(proxiedGetSet.get(), proxiedGetSet.get());
  }

  function test_ShouldAccessPublicVariablesFromTheTargetContract() public {
    proxiedGetSet.set(numberTotest);
    assertEq(proxiedGetSet.x(), numberTotest);
  }

  function test_ShouldNotAffectTheStorageOfTheTargetContract() public {
    proxiedGetSet.set(numberTotest);
    assertEq(getSet.get(), 0);
  }

  function test_ShouldPreserveMsgSender() public {
    MsgSenderCheck msgSenderCheck = new MsgSenderCheck();
    MsgSenderCheck proxiedMsgSenderCheck = MsgSenderCheck(address(msgSenderCheck));
    proxy._setImplementation(address(msgSenderCheck));
    proxiedMsgSenderCheck.checkMsgSender(address(this));
  }

  function test_ShouldBeAbleToProxyToTheNewContract_AfterChangingTheImplementation() public {
    GetSetV1 getSet1 = new GetSetV1();
    GetSetV1 proxiedGetSet1 = GetSetV1(address(proxy));
    proxy._setImplementation(address(getSet1));

    proxiedGetSet1.set(numberTotest, "DON'T PANIC");

    (uint256 numberReturn, string memory stringReturn) = proxiedGetSet1.get();
    assertEq(numberReturn, numberTotest);
    assertEq(stringReturn, "DON'T PANIC");
  }
}

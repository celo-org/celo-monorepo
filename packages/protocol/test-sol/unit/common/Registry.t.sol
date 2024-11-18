// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "@test-sol/utils/WhenL2.sol";

import "@celo-contracts/common/Registry.sol";

contract RegistryTest is Test {
  event RegistryUpdated(string identifier, bytes32 indexed identifierHash, address indexed addr);

  address constant SOME_ADDRESS = address(0x06012c8cf97BEaD5deAe237070F9587f8E7A266d);
  string constant SOME_ID = "cryptokitties";
  // hash of SOME_ID
  // hash is harcoded to avoid test and implementation changing at the same time
  bytes32 constant ID_HASH = 0x05445421d7b4d4c2e571c5a4ccf9317ec68601449f752c75ddbcc61a16061004;

  Registry _registry;
  address owner;

  function setUp() public {
    owner = address(this);
    vm.prank(owner);
    _registry = new Registry(true);
    _registry.initialize();
  }
}

contract RegistryTest_L2 is WhenL2, RegistryTest {
  function setUp() public {
    super.setUp();
    registry = IRegistry(address(_registry));
    setupEpochManager();
  }
}

contract RegistryTest_initialize is RegistryTest {
  function test_SetsTheOwner() public {
    assertEq(_registry.owner(), owner);
  }

  function test_Reverts_WhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    _registry.initialize();
  }
}

contract RegistryTest_setAddressFor is RegistryTest {
  function test_SetsAddress() public {
    vm.prank(owner);
    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(_registry.registry(ID_HASH), SOME_ADDRESS);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(msg.sender);
    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
  }

  function test_Emits_RegistryUpdated() public {
    vm.expectEmit(true, true, false, true);
    emit RegistryUpdated(SOME_ID, ID_HASH, SOME_ADDRESS);

    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
  }
}

contract RegistryTest_setAddressFor_L2 is RegistryTest_L2, RegistryTest_setAddressFor {}

contract RegistryTest_getAddressFor is RegistryTest {
  function test_GetsRightAddress() public {
    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(_registry.getAddressFor(ID_HASH), SOME_ADDRESS);
  }

  function test_ReturnsZero_WhenNotFound() public {
    assertEq(_registry.getAddressFor(ID_HASH), address(0));
  }
}

contract RegistryTest_getAddressFor_L2 is RegistryTest_L2, RegistryTest_getAddressFor {}

contract RegistryTest_getAddressForString is RegistryTest {
  function test_GetsRightAddress() public {
    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(_registry.getAddressForString(SOME_ID), SOME_ADDRESS);
  }

  function test_DoesNotRevers_WhenGettingAddress() public view {
    _registry.getAddressForString(SOME_ID);
  }
}

contract RegistryTest_getAddressForString_L2 is RegistryTest_L2, RegistryTest_getAddressForString {}

contract RegistryTest_getAddressForOrDie is RegistryTest {
  function test_GetsRightAddress() public {
    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(_registry.getAddressForOrDie(ID_HASH), SOME_ADDRESS);
  }

  function test_Reverts_WhenAddressNotFound() public {
    vm.expectRevert("identifier has no registry entry");
    _registry.getAddressForOrDie(ID_HASH);
  }
}

contract RegistryTest_getAddressForOrDie_L2 is RegistryTest_L2, RegistryTest_getAddressForOrDie {}

contract RegistryTest_getAddressForStringOrDie is RegistryTest {
  function test_GetAddressForStringOrDie_gets_address() public {
    _registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(_registry.getAddressForStringOrDie(SOME_ID), SOME_ADDRESS);
  }

  function test_Reverts_WhenAddressNotFound() public {
    vm.expectRevert("identifier has no registry entry");
    _registry.getAddressForStringOrDie(SOME_ID);
  }
}

contract RegistryTest_getAddressForStringOrDie_L2 is
  RegistryTest_L2,
  RegistryTest_getAddressForStringOrDie
{}

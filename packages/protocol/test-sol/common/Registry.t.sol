// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/Registry.sol";

contract RegistryTest is Test {
  event RegistryUpdated(string identifier, bytes32 indexed identifierHash, address indexed addr);

  address constant SOME_ADDRESS = address(0x06012c8cf97BEaD5deAe237070F9587f8E7A266d);
  string constant SOME_ID = "cryptokitties";
  // hash of SOME_ID
  // hash is harcoded to avoid test and implementation changing at the same time
  bytes32 constant ID_HASH = 0x05445421d7b4d4c2e571c5a4ccf9317ec68601449f752c75ddbcc61a16061004;

  Registry registry;
  address owner;

  function setUp() public {
    owner = address(this);
    vm.prank(owner);
    registry = new Registry(true);
    registry.initialize();
  }

  function test_SetsTheOwner() public {
    assertEq(registry.owner(), owner);
  }

  function test_Reverts_WhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    registry.initialize();
  }
}

contract RegistryTest_setAddressFor is RegistryTest {
  function test_SetsAddress() public {
    vm.prank(owner);
    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(registry.registry(ID_HASH), SOME_ADDRESS);
  }

  function test_Reverts_WhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(msg.sender);
    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
  }

  function test_Emits_RegistryUpdated() public {
    vm.expectEmit(true, true, false, true);
    emit RegistryUpdated(SOME_ID, ID_HASH, SOME_ADDRESS);

    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
  }
}

contract RegistryTest_getAddressFor is RegistryTest {
  function test_GetsRightAddress() public {
    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(registry.getAddressFor(ID_HASH), SOME_ADDRESS);
  }

  function test_ReturnsZero_WhenNotFound() public {
    assertEq(registry.getAddressFor(ID_HASH), address(0));
  }
}

contract RegistryTest_getAddressForString is RegistryTest {
  function test_GetsRightAddress() public {
    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(registry.getAddressForString(SOME_ID), SOME_ADDRESS);
  }

  function test_DoesNotRevers_WhenGettingAddress() public view {
    registry.getAddressForString(SOME_ID);
  }
}

contract RegistryTest_getAddressForOrDie is RegistryTest {
  function test_GetsRightAddress() public {
    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(registry.getAddressForOrDie(ID_HASH), SOME_ADDRESS);
  }

  function test_Reverts_WhenAddressNotFound() public {
    vm.expectRevert("identifier has no registry entry");
    registry.getAddressForOrDie(ID_HASH);
  }
}

contract RegistryTest_getAddressForStringOrDie is RegistryTest {
  function test_GetAddressForStringOrDie_gets_address() public {
    registry.setAddressFor(SOME_ID, SOME_ADDRESS);
    assertEq(registry.getAddressForStringOrDie(SOME_ID), SOME_ADDRESS);
  }

  function test_Reverts_WhenAddressNotFound() public {
    vm.expectRevert("identifier has no registry entry");
    registry.getAddressForStringOrDie(SOME_ID);
  }
}

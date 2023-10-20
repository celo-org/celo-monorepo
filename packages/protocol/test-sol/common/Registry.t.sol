// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "forge-std/console.sol";

// Contract to test
import "../../contracts/common/Registry.sol";

contract RegistryTest is Test {
  event RegistryUpdated(string identifier, bytes32 indexed identifierHash, address indexed addr);
  Registry registry;

  address public owner;
  address public constant anAddress = address(0x06012c8cf97BEaD5deAe237070F9587f8E7A266d);
  string anIdentifier = "cryptokitties";

  // hash of anIdentifier
  // hash is harcoded to avoid test and implementation chaing in at the same time
  bytes32 testHash = 0x05445421d7b4d4c2e571c5a4ccf9317ec68601449f752c75ddbcc61a16061004;

  function setUp() public {
    owner = address(this);
    vm.prank(owner);
    registry = new Registry(true);
    registry.initialize();

  }

  function test_initialize_has_right_owner() public {
    assertEq(registry.owner(), owner);
  }

  function test_initialize_cant_called_again() public {
    vm.expectRevert("contract already initialized");
    registry.initialize();
  }

  function test_setAddressFor_set_address() public {
    vm.prank(owner);
    registry.setAddressFor(anIdentifier, anAddress);
    assertEq(registry.registry(testHash), anAddress);
  }

  function test_setAddressFor_reverts_other_user() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(msg.sender);
    registry.setAddressFor(anIdentifier, anAddress);
  }

  function test_setAddressFor_emits() public {
    vm.expectEmit(true, true, false, true);
    emit RegistryUpdated(anIdentifier, testHash, anAddress);

    registry.setAddressFor(anIdentifier, anAddress);
  }

  function test_getAddressForOrDie_gets_address() public {
    registry.setAddressFor(anIdentifier, anAddress);
    assertEq(registry.getAddressForOrDie(testHash), anAddress);
  }

  function test_getAddressForOrDie_reverts_address_not_set() public {
    vm.expectRevert("identifier has no registry entry");
    registry.getAddressForOrDie(testHash);
  }

  function test_getAddressFor_gets_address() public {
    registry.setAddressFor(anIdentifier, anAddress);
    assertEq(registry.getAddressFor(testHash), anAddress);
  }

  function test_getAddressFor_doesnt_revert() public {
    assertEq(registry.getAddressFor(testHash), address(0));
  }

  function test_getAddressForStringOrDie_gets_address() public {
    registry.setAddressFor(anIdentifier, anAddress);
    assertEq(registry.getAddressForStringOrDie(anIdentifier), anAddress);
  }

  function test_getAddressForStringOrDie_reverts() public {
    vm.expectRevert("identifier has no registry entry");
    registry.getAddressForStringOrDie(anIdentifier);
  }

  function test_getAddressForString_gets_addres() public {
    registry.setAddressFor(anIdentifier, anAddress);
    assertEq(registry.getAddressForString(anIdentifier), anAddress);
  }

  function test_getAddressForString_shoudlnt_revert() public view {
    registry.getAddressForString(anIdentifier);
  }

}

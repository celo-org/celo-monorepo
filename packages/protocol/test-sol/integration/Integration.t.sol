// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts/common/test/MockGoldToken.sol";
import "forge-std/console.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";

contract IntegrationTest is Test {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  address account1 = actor("account1");
  address account2 = actor("account2");
  IRegistry registry = IRegistry(registryAddress);

  function setUp() public {}

  function test_hello() public {
    console.log("Works!");
    // registry.setAddressFor("registry", address(1));
    console.log("print:");
    console.logAddress(registry.getAddressForStringOrDie("GoldToken"));
  }

  function test_transfer() public {
    GoldToken goldToken = GoldToken(registry.getAddressForStringOrDie("GoldToken"));
    vm.deal(account1, 1 wei);
    vm.prank(account1);
    goldToken.transfer(account1, 1);
    assertEq(goldToken.balanceOf(account1), 1);
  }

  function test_precompile() public {}
}

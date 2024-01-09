// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "../../contracts/common/FeeCurrencyWhitelist.sol";
import "forge-std/console.sol";

contract FeeCurrencyWhitelistTest is Test {
  FeeCurrencyWhitelist feeCurrencyWhitelist;
  address nonOwner;
  address owner;

  function setUp() public {
    owner = address(this);
    nonOwner = actor("nonOwner");

    feeCurrencyWhitelist = new FeeCurrencyWhitelist(true);
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelistInitialize is FeeCurrencyWhitelistTest {
  function testInitializeOwner() public {
    assertTrue(feeCurrencyWhitelist.isOwner());
    assertEq(feeCurrencyWhitelist.owner(), address(this));
  }

  function testShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelistAddToken is FeeCurrencyWhitelistTest {
  function testShouldAllowTheOwnerToAddAToken() public {
    feeCurrencyWhitelist.addToken(address(1));
    address[] memory whitelist = feeCurrencyWhitelist.getWhitelist();
    assertEq(whitelist.length, 1);
    assertEq(whitelist[0], address(1));
  }

  function testShouldNotAllowNonOwnerToAddAToken() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.addToken(address(1));
  }
}

contract FeeCurrencyWhitelistRemoveToken is FeeCurrencyWhitelistTest {
  function setUp() public {
    super.setUp();
    feeCurrencyWhitelist.addToken(address(1));
    feeCurrencyWhitelist.addToken(address(2));
    feeCurrencyWhitelist.addToken(address(3));
  }

  function testShouldRemove() public {
    feeCurrencyWhitelist.removeToken(address(2), 1);
    address[] memory whitelist = feeCurrencyWhitelist.getWhitelist();
    assertEq(whitelist.length, 2);
    assertEq(whitelist[0], address(1));
    assertEq(whitelist[1], address(3));
  }

  function test_ShouldNotRemoveWhenIndexIsWrong() public {
    vm.expectRevert("Index does not match");
    feeCurrencyWhitelist.removeToken(address(2), 2);
  }

  function test_ShouldNotAllowNonOwnerToRemove() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.removeToken(address(2), 1);
  }
}

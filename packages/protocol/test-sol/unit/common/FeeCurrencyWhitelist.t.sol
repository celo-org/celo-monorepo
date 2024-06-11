// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/FeeCurrencyWhitelist.sol";

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
  function test_InitializeOwner() public {
    assertTrue(feeCurrencyWhitelist.isOwner());
    assertEq(feeCurrencyWhitelist.owner(), address(this));
  }

  function test_ShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelistAddToken is FeeCurrencyWhitelistTest {
  function test_ShouldAllowTheOwnerToAddAToken() public {
    feeCurrencyWhitelist.addToken(address(1));
    address[] memory whitelist = feeCurrencyWhitelist.getWhitelist();
    assertEq(whitelist.length, 1);
    assertEq(whitelist[0], address(1));
  }

  function test_ShouldRevert_WhenNonOwnerAddsAToken() public {
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

  function test_ShouldRemoveToken() public {
    feeCurrencyWhitelist.removeToken(address(2), 1);
    address[] memory whitelist = feeCurrencyWhitelist.getWhitelist();
    assertEq(whitelist.length, 2);
    assertEq(whitelist[0], address(1));
    assertEq(whitelist[1], address(3));
  }

  function test_ShouldRevert_WhenIndexIsWrong() public {
    vm.expectRevert("Index does not match");
    feeCurrencyWhitelist.removeToken(address(2), 2);
  }

  function test_ShouldRevert_WhenNonOwnerRemovesToken() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.removeToken(address(2), 1);
  }
}

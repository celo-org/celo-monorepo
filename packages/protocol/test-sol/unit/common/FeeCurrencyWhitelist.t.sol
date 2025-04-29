// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";
import "@celo-contracts/common/FeeCurrencyWhitelist.sol";

contract FeeCurrencyWhitelistTest is TestWithUtils {
  FeeCurrencyWhitelist feeCurrencyWhitelist;
  address nonOwner;
  address owner;

  function setUp() public {
    super.setUp();
    whenL2WithEpochManagerInitialization();
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
  function test_Reverts_WhenCalledOnL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.addToken(address(1));
  }
}

contract FeeCurrencyWhitelistRemoveToken is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalledOnL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.removeToken(address(2), 1);
  }
}

contract FeeCurrencyWhitelist_whitelist is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalledOnL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.whitelist(0);
  }
}

contract FeeCurrencyWhitelist_getWhitelist is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalledOnL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.getWhitelist();
  }
}

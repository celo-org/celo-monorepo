// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { FeeCurrencyWhitelist } from "@celo-contracts-8/common/FeeCurrencyWhitelist.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";

contract FeeCurrencyWhitelistTest is TestWithUtils08 {
  FeeCurrencyWhitelist feeCurrencyWhitelist;
  address nonOwner;
  address owner;

  function setUp() public override {
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
    assertEq(IOwnable(address(feeCurrencyWhitelist)).owner(), address(this));
  }

  function test_ShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelistAddToken is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalled() public {
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.addToken(address(1));
  }
}

contract FeeCurrencyWhitelistRemoveToken is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalled() public {
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.removeToken(address(2), 1);
  }
}

contract FeeCurrencyWhitelist_whitelist is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalled() public {
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.whitelist(0);
  }
}

contract FeeCurrencyWhitelist_getWhitelist is FeeCurrencyWhitelistTest {
  function test_Reverts_WhenCalled() public {
    vm.expectRevert("This method is no longer supported in L2.");
    feeCurrencyWhitelist.getWhitelist();
  }
}

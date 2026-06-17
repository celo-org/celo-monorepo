// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";
import "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";

// The contract under test now lives in contracts-0.8; this 0.5 test deploys the
// compiled 0.8 bytecode (via deployCodeTo) and interacts through the interface.
contract FeeCurrencyWhitelistTest is TestWithUtils {
  IFeeCurrencyWhitelist feeCurrencyWhitelist;
  address feeCurrencyWhitelistAddress;
  address nonOwner;
  address owner;

  function setUp() public {
    super.setUp();
    whenL2WithEpochManagerInitialization();
    owner = address(this);
    nonOwner = actor("nonOwner");

    feeCurrencyWhitelistAddress = actor("feeCurrencyWhitelist");
    deployCodeTo("FeeCurrencyWhitelistCompile", feeCurrencyWhitelistAddress);
    feeCurrencyWhitelist = IFeeCurrencyWhitelist(feeCurrencyWhitelistAddress);
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelistInitialize is FeeCurrencyWhitelistTest {
  function test_InitializeOwner() public {
    assertEq(IOwnable(feeCurrencyWhitelistAddress).owner(), address(this));
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

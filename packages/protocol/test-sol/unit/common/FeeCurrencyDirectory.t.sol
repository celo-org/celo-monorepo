// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import "@test-sol/utils/WhenL2-08.sol";

import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@celo-contracts-8/common/mocks/MockOracle.sol";

contract FeeCurrencyDirectoryTest is TestWithUtils08 {
  FeeCurrencyDirectory directory;
  MockOracle oracle;
  address nonOwner;
  address owner;
  event CurrencyConfigSet(address indexed token, address indexed oracle, uint256 intrinsicGas);
  event CurrencyRemoved(address indexed token);

  function setUp() public virtual override {
    super.setUp();
    owner = address(this);
    nonOwner = actor("nonOwner");
    oracle = new MockOracle();

    directory = new FeeCurrencyDirectory(true);
    directory.initialize();
  }
}

contract FeeCurrencyDirectoryTest_L2 is FeeCurrencyDirectoryTest, WhenL2 {
  function setUp() public virtual override(FeeCurrencyDirectoryTest, WhenL2) {
    super.setUp();
  }
}

contract TestSetCurrencyConfig is FeeCurrencyDirectoryTest {
  function test_ShouldAllowOwnerSetCurrencyConfig() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    directory.setCurrencyConfig(token, address(oracle), intrinsicGas);
    IFeeCurrencyDirectory.CurrencyConfig memory config = directory.getCurrencyConfig(token);

    assertEq(directory.getCurrencies().length, 1);
    assertEq(config.oracle, address(oracle));
    assertEq(config.intrinsicGas, intrinsicGas);
  }

  function test_Emits_CurrencyConfigSetEvent() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;

    vm.expectEmit(true, true, true, true);
    emit CurrencyConfigSet(token, address(oracle), intrinsicGas);

    directory.setCurrencyConfig(token, address(oracle), intrinsicGas);
  }

  function test_Reverts_WhenNonOwnerSetsCurrencyConfig() public {
    address token = address(2);
    uint256 intrinsicGas = 21000;
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    directory.setCurrencyConfig(token, address(oracle), intrinsicGas);
  }

  function test_Reverts_WhenZeroOracle() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    vm.expectRevert(bytes("Oracle address cannot be zero"));
    directory.setCurrencyConfig(token, address(0), intrinsicGas);
  }

  function test_Reverts_WhenZeroIntrinsicGas() public {
    address token = address(1);
    vm.expectRevert(bytes("Intrinsic gas cannot be zero"));
    directory.setCurrencyConfig(token, address(oracle), 0);
  }

  function test_Reverts_CurrencyAlreadyWhitelisted() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    directory.setCurrencyConfig(token, address(oracle), intrinsicGas);
    vm.expectRevert(bytes("Currency already in the directory"));
    directory.setCurrencyConfig(token, address(oracle), intrinsicGas);
  }
}

contract TestSetCurrencyConfig_L2 is FeeCurrencyDirectoryTest_L2, TestSetCurrencyConfig {
  function setUp() public override(FeeCurrencyDirectoryTest, FeeCurrencyDirectoryTest_L2) {
    super.setUp();
  }
}

contract TestRemoveCurrencies is FeeCurrencyDirectoryTest {
  function setUp() public virtual override {
    super.setUp();
    address token = address(4);
    directory.setCurrencyConfig(token, address(oracle), 21000);
  }

  function test_ShouldRemoveCurrencies() public {
    address token = address(4);
    directory.removeCurrencies(token, 0);
    IFeeCurrencyDirectory.CurrencyConfig memory config = directory.getCurrencyConfig(token);
    assertEq(directory.getCurrencies().length, 0);
    assertEq(config.oracle, address(0));
  }

  function test_Emits_CurrencyRemovedEvent() public {
    address token = address(4);
    vm.expectEmit(true, true, true, true);
    emit CurrencyRemoved(token);
    directory.removeCurrencies(token, 0);
  }

  function test_Reverts_WhenNonOwnerRemovesCurrencies() public {
    address token = address(4);
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    directory.removeCurrencies(token, 0);
  }

  function test_Reverts_WhenInvalidIndex() public {
    vm.expectRevert(bytes("Index out of bounds"));
    directory.removeCurrencies(address(4), 1); // Index 1 is out of bounds for only one item
  }

  function test_Reverts_WhenMismatchedTokenAndIndex() public {
    address token = address(5);
    directory.setCurrencyConfig(token, address(oracle), 21000);

    vm.expectRevert(bytes("Index does not match token"));
    directory.removeCurrencies(token, 0); // Index 0 is associated with address(4), not address(5)
  }
}

contract TestRemoveCurrencies_L2 is FeeCurrencyDirectoryTest_L2, TestRemoveCurrencies {
  function setUp() public override(TestRemoveCurrencies, FeeCurrencyDirectoryTest_L2) {
    super.setUp();
  }
}

contract TestGetExchangeRate is FeeCurrencyDirectoryTest {
  address token;

  function setUp() public virtual override {
    super.setUp();
    token = address(3);
    oracle.setExchangeRate(token, 200, 4); // 50:1 ratio
    directory.setCurrencyConfig(token, address(oracle), 21000);
  }

  function test_ShouldReturnExchangeRateSuccessfully() public {
    (uint256 numerator, uint256 denominator) = directory.getExchangeRate(token);
    assertEq(numerator, 200);
    assertEq(denominator, 4);
  }

  function test_Reverts_WhenTokenDoesntExist() public {
    vm.expectRevert("Currency not in the directory");
    directory.getExchangeRate(address(4));
  }
}

contract TestGetExchangeRate_L2 is FeeCurrencyDirectoryTest_L2, TestGetExchangeRate {
  function setUp() public override(TestGetExchangeRate, FeeCurrencyDirectoryTest_L2) {
    super.setUp();
  }
}

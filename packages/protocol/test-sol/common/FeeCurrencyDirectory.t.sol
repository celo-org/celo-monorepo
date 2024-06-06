// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";
import "@celo-contracts-8/common/mocks/MockOracle.sol";

contract FeeCurrencyDirectoryTestBase is Test {
  FeeCurrencyDirectory directory;
  MockOracle oracle;
  address nonOwner;
  address owner;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");
    oracle = new MockOracle();

    directory = new FeeCurrencyDirectory(true);
    directory.initialize();
  }
}

contract TestSetCurrencyConfig is FeeCurrencyDirectoryTestBase {
  function test_ShouldAllowOwnerSetCurrencyConfig() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    directory.setCurrencyConfig(token, address(oracle), intrinsicGas);
    IFeeCurrencyDirectory.CurrencyConfig memory config = directory.getCurrencyConfig(token);

    assertEq(directory.getCurrencies().length, 1);
    assertEq(config.oracle, address(oracle));
    assertEq(config.intrinsicGas, intrinsicGas);
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

contract TestRemoveCurrencies is FeeCurrencyDirectoryTestBase {
  function setUp() public override {
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

contract TestGetExchangeRate is FeeCurrencyDirectoryTestBase {
  address token;

  function setUp() public override {
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

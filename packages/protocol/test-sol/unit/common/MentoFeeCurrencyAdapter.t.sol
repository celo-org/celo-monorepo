// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/MentoFeeCurrencyAdapter.sol";
import "@celo-contracts-8/common/mocks/MockOracle.sol";

contract MentoFeeCurrencyAdapterBase is Test {
  MentoFeeCurrencyAdapter mentoAdapter;
  MockOracle oracle;
  address nonOwner;
  address owner;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");
    oracle = new MockOracle();

    mentoAdapter = new MentoFeeCurrencyAdapter(true);
    mentoAdapter.initialize();
  }
}

contract TestSetCurrencyConfig is MentoFeeCurrencyAdapterBase {
  function test_ShouldAllowOwnerSetCurrencyConfig() public {
    address token = address(1);
    address currencyIdentifier = address(2);
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(oracle));
    MentoFeeCurrencyAdapter.MentoCurrencyConfig memory config = mentoAdapter.getCurrencyConfig(
      token
    );

    assertEq(mentoAdapter.getCurrencies().length, 1);
    assertEq(config.oracle, address(oracle));
    assertEq(config.currencyIdentifier, currencyIdentifier);
  }

  function test_Reverts_WhenNonOwnerSetsCurrencyConfig() public {
    address token = address(2);
    address currencyIdentifier = address(3);
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(oracle));
  }

  function test_Reverts_WhenZeroOracle() public {
    address token = address(1);
    address currencyIdentifier = address(2);
    vm.expectRevert(bytes("Oracle address cannot be zero"));
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(0));
  }

  function test_Reverts_WhenZeroCurrencyIdentifier() public {
    address token = address(1);
    vm.expectRevert(bytes("Currency identifier cannot be zero"));
    mentoAdapter.setCurrencyConfig(token, address(0), address(oracle));
  }

  function test_Reverts_CurrencyAlreadyWhitelisted() public {
    address token = address(1);
    address currencyIdentifier = address(2);
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(oracle));

    vm.expectRevert(bytes("Currency already in the adapter"));
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(oracle));
  }
}

contract TestRemoveCurrencies is MentoFeeCurrencyAdapterBase {
  address token;
  address currencyIdentifier;

  function setUp() public override {
    super.setUp();

    token = address(1);
    currencyIdentifier = address(2);
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(oracle));
  }

  function test_ShouldAllowOwnerRemoveCurrency() public {
    mentoAdapter.removeCurrencies(token, 0);

    assertEq(mentoAdapter.getCurrencies().length, 0);
  }

  function test_Reverts_WhenNonOwnerRemovesCurrency() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    mentoAdapter.removeCurrencies(token, 0);
  }

  function test_Reverts_WhenIndexOutOfBounds() public {
    vm.expectRevert("Index out of bounds");
    mentoAdapter.removeCurrencies(token, 1);
  }

  function test_Reverts_WhenIndexDoesNotMatchToken() public {
    address token2 = address(7);
    mentoAdapter.setCurrencyConfig(token2, address(oracle), address(oracle));

    vm.expectRevert("Index does not match token");
    mentoAdapter.removeCurrencies(token, 1);
  }
}

contract TestGetExchangeRate is MentoFeeCurrencyAdapterBase {
  address token;
  address currencyIdentifier;

  function setUp() public override {
    super.setUp();
    currencyIdentifier = address(2);
    token = address(3);
    oracle.setExchangeRate(currencyIdentifier, 200, 4); // 50:1 ratio
    mentoAdapter.setCurrencyConfig(token, currencyIdentifier, address(oracle));
  }

  function test_ShouldReturnPriceSuccessfully() public {
    (uint256 numerator, uint256 denominator) = mentoAdapter.getExchangeRate(token);
    assertEq(numerator, 200);
    assertEq(denominator, 4);
  }

  function test_Reverts_WhenTokenDoesntExist() public {
    vm.expectRevert("Currency not in the mentoAdapter");
    mentoAdapter.getExchangeRate(address(4));
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "../../contracts-0.8/common/FeeCurrencyDirectory.sol";

contract MockOracle is IOracle {
  uint256 numerator;
  uint256 denominator;
  uint256 lastUpdateTimestamp;

  function setExchangeRate(uint256 _numerator, uint256 _denominator) public {
    numerator = _numerator;
    denominator = _denominator;
    lastUpdateTimestamp = block.timestamp;
  }

  function getExchangeRateFor(address) external view returns (uint256, uint256, uint256) {
    return (numerator, denominator, lastUpdateTimestamp);
  }
}

contract FeeCurrencyDirectoryTestBase is Test {
  FeeCurrencyDirectory directory;
  MockOracle oracle;
  address nonOwner;
  address owner;
  address tokenIdentifier;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");
    oracle = new MockOracle();
    tokenIdentifier = address(0x2);

    directory = new FeeCurrencyDirectory(true);
    directory.initialize();
  }
}

contract TestSetCurrencyConfig is FeeCurrencyDirectoryTestBase {
  function test_OwnerCanSetCurrencyConfig() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), intrinsicGas);
    FeeCurrencyDirectory.CurrencyConfig memory config = directory.getWhitelistedCurrencyConfig(
      token
    );

    assertEq(directory.getWhitelistedCurrencies().length, 1);
    assertEq(config.currencyIdentifier, tokenIdentifier);
    assertEq(config.oracle, address(oracle));
    assertEq(config.intrinsicGas, intrinsicGas);
  }

  function test_NonOwnerCannotSetCurrencyConfig() public {
    address token = address(2);
    uint256 intrinsicGas = 21000;
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), intrinsicGas);
  }

  function test_Reverts_WhenZeroCurrencyIdentifier() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    vm.expectRevert(bytes("Currency identifier cannot be zero"));
    directory.setCurrencyConfig(token, address(0), address(oracle), intrinsicGas);
  }

  function test_Reverts_WhenZeroOracle() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    vm.expectRevert(bytes("Oracle address cannot be zero"));
    directory.setCurrencyConfig(token, address(2), address(0), intrinsicGas);
  }

  function test_Reverts_WhenZeroIntrinsicGas() public {
    address token = address(1);
    vm.expectRevert(bytes("Intrinsic gas cannot be zero"));
    directory.setCurrencyConfig(token, address(2), address(oracle), 0);
  }
}

contract TestRemoveWhitelistedCurrencies is FeeCurrencyDirectoryTestBase {
  function setUp() public override {
    super.setUp();
    address token = address(4);
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), 21000);
  }

  function test_RemoveWhitelistedCurrencies() public {
    address token = address(4);
    directory.removeWhitelistedCurrencies(token, 0);
    FeeCurrencyDirectory.CurrencyConfig memory config = directory.getWhitelistedCurrencyConfig(
      token
    );
    assertEq(directory.getWhitelistedCurrencies().length, 0);
    assertEq(config.currencyIdentifier, address(0));
  }

  function test_Reverts_WhenNonOwnerRemovesWhitelistedCurrencies() public {
    address token = address(4);
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    directory.removeWhitelistedCurrencies(token, 0);
  }

  function test_Reverts_WhenInvalidIndex() public {
    vm.expectRevert(bytes("Index out of bounds"));
    directory.removeWhitelistedCurrencies(address(4), 1); // Index 1 is out of bounds for only one item
  }

  function test_Reverts_WhenMismatchedTokenAndIndex() public {
    address token = address(5);
    directory.setCurrencyConfig(token, address(oracle), address(oracle), 21000);

    vm.expectRevert(bytes("Index does not match token"));
    directory.removeWhitelistedCurrencies(token, 0); // Index 0 is associated with address(4), not address(5)
  }
}

contract TestGetPrice is FeeCurrencyDirectoryTestBase {
  address token;

  function setUp() public override {
    super.setUp();
    oracle.setExchangeRate(200, 4); // 50:1 ratio
    token = address(3);
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), 21000);
  }

  function test_ReturnsPriceSuccessfully() public {
    uint256 price = directory.getPrice(token);
    assertEq(price, 50); // Expecting 50 since 200 / 4 = 50
  }

  function test_Reverts_WhenTokenDoesntExist() public {
    vm.expectRevert("Currency not whitelisted");
    directory.getPrice(address(4));
  }
}

contract TestTranslateGasPrice is FeeCurrencyDirectoryTestBase {
  address token;

  function setUp() public override {
    super.setUp();
    oracle.setExchangeRate(200, 4); // 50:1 ratio
    token = address(3);
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), 21000);
  }

  function test_ReturnsGasPriceSuccessfully() public {
    uint256 priceInCelo = 100; // Expecting 5000 since 100 * 50 = 5000
    uint256 gasInToken = directory.translateGasPrice(token, priceInCelo);
    assertEq(gasInToken, 5000);
  }

  function test_Reverts_WhenTokenDoesntExist() public {
    vm.expectRevert("Currency not whitelisted");
    directory.translateGasPrice(address(4), 100);
  }
}

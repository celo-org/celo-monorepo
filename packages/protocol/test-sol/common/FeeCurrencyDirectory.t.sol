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
    FeeCurrencyDirectory.CurrencyConfig memory config = directory.getCurrencyConfig(token);

    assertEq(directory.getCurrencies().length, 1);
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

  function test_Reverts_CurrencyAlreadyWhitelisted() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), intrinsicGas);
    vm.expectRevert(bytes("Currency already in the directory"));
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), intrinsicGas);
  }
}

contract TestRemoveCurrencies is FeeCurrencyDirectoryTestBase {
  function setUp() public override {
    super.setUp();
    address token = address(4);
    directory.setCurrencyConfig(token, tokenIdentifier, address(oracle), 21000);
  }

  function test_RemoveCurrencies() public {
    address token = address(4);
    directory.removeCurrencies(token, 0);
    FeeCurrencyDirectory.CurrencyConfig memory config = directory.getCurrencyConfig(token);
    assertEq(directory.getCurrencies().length, 0);
    assertEq(config.currencyIdentifier, address(0));
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
    directory.setCurrencyConfig(token, address(oracle), address(oracle), 21000);

    vm.expectRevert(bytes("Index does not match token"));
    directory.removeCurrencies(token, 0); // Index 0 is associated with address(4), not address(5)
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
    (uint256 numerator, uint256 denominator) = directory.getExchangeRate(token);
    assertEq(numerator, 200);
    assertEq(denominator, 4);
  }

  function test_Reverts_WhenTokenDoesntExist() public {
    vm.expectRevert("Currency not in the directory");
    directory.getExchangeRate(address(4));
  }
}

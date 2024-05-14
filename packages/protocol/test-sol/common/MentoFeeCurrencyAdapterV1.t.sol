// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "../../contracts-0.8/common/MentoFeeCurrencyAdapterV1.sol";

contract MockOracleV1 {
  uint256 numerator;
  uint256 denominator;
  uint256 lastUpdateTimestamp;
  address token;

  function setExchangeRate(address _token, uint256 _numerator, uint256 _denominator) public {
    numerator = _numerator;
    denominator = _denominator;
    lastUpdateTimestamp = block.timestamp;
    token = _token;
  }

  function medianRate(address token) external view returns (uint256, uint256) {
    return (numerator, denominator);
  }
}

contract MentoFeeCurrencyAdapterBase is Test {
  MentoFeeCurrencyAdapterV1 mentoAdapter;
  MockOracleV1 oracle;
  address nonOwner;
  address owner;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");
    oracle = new MockOracleV1();

    mentoAdapter = new MentoFeeCurrencyAdapterV1(true);
    mentoAdapter.initialize(address(oracle));
  }
}

contract GetExchangeRate is MentoFeeCurrencyAdapterBase {
  function test_ShouldReturnExchangeRateFromOracle() public {
    address token = address(1);
    uint256 numerator = 1;
    uint256 denominator = 2;
    oracle.setExchangeRate(token, numerator, denominator);
    (uint256 rateNumerator, uint256 rateDenominator) = mentoAdapter.getExchangeRate(token);

    assertEq(rateNumerator, numerator);
    assertEq(rateDenominator, denominator);
  }
}

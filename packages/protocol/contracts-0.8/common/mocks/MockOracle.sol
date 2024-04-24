// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../../../contracts-0.8/common/FeeCurrencyDirectory.sol";

contract MockOracle is IOracle {
  uint256 numerator;
  uint256 denominator;
  uint256 lastUpdateTimestamp;

  function setExchangeRate(uint256 _numerator, uint256 _denominator) public {
    numerator = _numerator;
    denominator = _denominator;
    lastUpdateTimestamp = block.timestamp;
  }

  function getExchangeRateFor(address) external view returns (uint256, uint256) {
    return (numerator, denominator);
  }
}

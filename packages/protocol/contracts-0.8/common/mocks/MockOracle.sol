// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../../../contracts-0.8/common/FeeCurrencyDirectory.sol";

contract MockOracle is IOracle {
  uint256 numerator;
  uint256 denominator;
  uint256 lastUpdateTimestamp;
  address token;

  function getExchangeRate(address _token) external view returns (uint256, uint256) {
    require(token == _token, "Token not supported");
    return (numerator, denominator);
  }

  function setExchangeRate(address _token, uint256 _numerator, uint256 _denominator) public {
    numerator = _numerator;
    denominator = _denominator;
    lastUpdateTimestamp = block.timestamp;
    token = _token;
  }
}

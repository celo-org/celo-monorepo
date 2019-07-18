pragma solidity ^0.5.8;


/**
 * @title A mock SortedOracles for testing.
 */
contract MockSortedOracles {

  mapping(address => uint128) public numerators;
  mapping(address => uint128) public denominators;
  mapping(address => uint128) public medianTimestamp;
  mapping(address => uint128) public numRates;

  function setMedianRate(
    address token,
    uint128 numerator,
    uint128 denominator
  )
    external
    returns (bool)
  {
    numerators[token] = numerator;
    denominators[token] = denominator;
    return true;
  }

  function setMedianTimestamp(address token, uint128 timestamp) external {
    medianTimestamp[token] = timestamp;
  }

  function setMedianTimestampToNow(address token) external {
    // solhint-disable-next-line not-rely-on-time
    medianTimestamp[token] = uint128(now);
  }

  function setNumRates(address token, uint128 rate) external {
    numRates[token] = rate;
  }

  function medianRate(address token) external view returns (uint128, uint128) {
    return (numerators[token], denominators[token]);
  }
}

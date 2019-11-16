pragma solidity ^0.5.3;

/**
 * @title A mock SortedOracles for testing.
 */
contract MockSortedOracles {
  uint256 public constant DENOMINATOR = 0x10000000000000000;
  mapping(address => uint256) public numerators;
  mapping(address => uint256) public medianTimestamp;
  mapping(address => uint256) public numRates;

  function setMedianRate(address token, uint256 numerator) external returns (bool) {
    numerators[token] = numerator;
    return true;
  }

  function setMedianTimestamp(address token, uint256 timestamp) external {
    medianTimestamp[token] = timestamp;
  }

  function setMedianTimestampToNow(address token) external {
    // solhint-disable-next-line not-rely-on-time
    medianTimestamp[token] = uint128(now);
  }

  function setNumRates(address token, uint256 rate) external {
    numRates[token] = rate;
  }

  function medianRate(address token) external view returns (uint256, uint256) {
    return (numerators[token], DENOMINATOR);
  }
}

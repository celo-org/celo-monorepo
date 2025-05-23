pragma solidity >=0.5.13 <0.9.0;
import "../../../contracts-0.8/common/interfaces/IOracle.sol";

/**
 * @title A mock SortedOracles for testing.
 */
contract MockSortedOracles is IOracle {
  uint256 public constant DENOMINATOR = 1000000000000000000000000;
  mapping(address => uint256) public numerators;
  mapping(address => uint256) public medianTimestamp;
  mapping(address => uint256) public _numRates;
  mapping(address => bool) public expired;

  function setMedianRate(address token, uint256 numerator) external returns (bool) {
    numerators[token] = numerator;
    return true;
  }

  function setMedianTimestamp(address token, uint256 timestamp) external {
    medianTimestamp[token] = timestamp;
  }

  function setMedianTimestampToNow(address token) external {
    // solhint-disable-next-line not-rely-on-time
    medianTimestamp[token] = uint128(block.timestamp);
  }

  function setNumRates(address token, uint256 rate) external {
    _numRates[token] = rate; // This change may breack something, TODO
  }

  function numRates(address token) external view returns (uint256) {
    return _numRates[token];
  }

  function getExchangeRate(
    address token
  ) external view returns (uint256 numerator, uint256 denominator) {
    (numerator, denominator) = medianRate(token);
  }

  function setOldestReportExpired(address token) public {
    expired[token] = true;
  }

  function medianRate(address token) public view returns (uint256, uint256) {
    if (numerators[token] > 0) {
      return (numerators[token], DENOMINATOR);
    }
    return (0, 0);
  }

  function isOldestReportExpired(address token) public view returns (bool, address) {
    return (expired[token], token);
  }
}

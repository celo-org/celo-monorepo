pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./SortedFractionMedianList.sol";
import "./interfaces/ISortedOracles.sol";
import "../common/Initializable.sol";


/**
 * @title Maintains a sorted list of oracle exchange rates between Celo Gold and other currencies.
 */
contract SortedOracles is ISortedOracles, Ownable, Initializable {
  using SafeMath for uint256;
  using SafeMath for uint128;
  using SortedFractionMedianList for SortedFractionMedianList.List;

  // Maps a token address to a sorted list of oracle values.
  mapping(address => SortedFractionMedianList.List) public rates;
  // TODO(asa): This doesn't need to be a list of fractions.
  mapping(address => SortedFractionMedianList.List) public timestamps;
  mapping(address => mapping(address => bool)) public isOracle;
  mapping(address => address[]) public oracles;

  uint256 public reportExpirySeconds;

  event OracleAdded(
    address indexed token,
    address indexed oracleAddress
  );

  event OracleRemoved(
    address indexed token,
    address indexed oracleAddress
  );

  event OracleReported(
    address token,
    address oracle,
    uint256 timestamp,
    uint128 numerator,
    uint128 denominator
  );

  event OracleReportRemoved(
    address indexed token,
    address indexed oracle
  );

  event MedianUpdated(
    address token,
    uint128 numerator,
    uint128 denominator
  );

  event ReportExpirySet(
    uint256 reportExpiry
  );

  modifier onlyOracle(address token) {
    require(isOracle[token][msg.sender], "sender was not an oracle for token addr");
    _;
  }

  function initialize(uint256 _reportExpirySeconds) external initializer {
    _transferOwnership(msg.sender);
    reportExpirySeconds = _reportExpirySeconds;
  }

  /**
   * @notice Sets the report expiry parameter.
   * @param _reportExpirySeconds Desired value of report expiry.
   */
  function setReportExpiry(uint256 _reportExpirySeconds) external onlyOwner {
    reportExpirySeconds = _reportExpirySeconds;
    emit ReportExpirySet(_reportExpirySeconds);
  }

  /**
   * @notice Adds a new Oracle.
   * @param token The address of the token.
   * @param oracleAddress The address of the oracle.
   */
  function addOracle(address token, address oracleAddress) external onlyOwner {
    require(
      token != address(0) && oracleAddress != address(0) && !isOracle[token][oracleAddress],
      "token addr was null or oracle addr was null or oracle addr is not an oracle for token addr"
    );
    isOracle[token][oracleAddress] = true;
    oracles[token].push(oracleAddress);
    emit OracleAdded(token, oracleAddress);
  }

  /**
   * @notice Removes an Oracle.
   * @param oracleAddress The address of the oracle.
   */
  function removeOracle(address token, address oracleAddress, uint256 index) external onlyOwner {
    require(
      token != address(0) &&
      oracleAddress != address(0) &&
      oracles[token].length > index &&
      oracles[token][index] == oracleAddress,
      "token addr null or oracle addr null or index of token oracle not mapped to oracle addr"
    );
    isOracle[token][oracleAddress] = false;
    oracles[token][index] = oracles[token][oracles[token].length.sub(1)];
    oracles[token].length = oracles[token].length.sub(1);
    if (reportExists(token, oracleAddress)) {
      removeReport(token, oracleAddress);
    }
    emit OracleRemoved(token, oracleAddress);
  }

  /**
   * @notice Removes a report that is expired.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param n The number of expired reports to remove, at most (deterministic upper gas bound).
   */
  function removeExpiredReports(address token, uint256 n) external {
    require(
      token != address(0) &&
      timestamps[token].tail != address(0) &&
      n < timestamps[token].numElements
    );
    for (uint256 i = 0; i < n; i++) {
      address oldest = timestamps[token].tail;
      uint128 timestamp = timestamps[token].elements[oldest].numerator;
      // solhint-disable-next-line not-rely-on-time
      if (uint128(now).sub(timestamp) >= uint128(reportExpirySeconds)) {
        removeReport(token, oldest);
      } else {
        break;
      }
    }
  }

  /**
   * @notice Updates an oracle value and the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param numerator The amount of tokens equal to `denominator` Celo Gold.
   * @param denominator The amount of Celo Gold equal to `numerator` tokens.
   * @param lesserKey The element which should be just left of the new oracle value.
   * @param greaterKey The element which should be just right of the new oracle value.
   * @dev Values are passed as uint128 to avoid uint256 overflow when multiplying.
   * @dev Note that only one of `lesserKey` or `greaterKey` needs to be correct to reduce friction.
   */
  function report(
    address token,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    external
    onlyOracle(token)
  {
    SortedFractionMedianList.Element memory originalMedian = getMedianElement(rates[token]);
    rates[token].insertOrUpdate(msg.sender, numerator, denominator, lesserKey, greaterKey);
    timestamps[token].insertOrUpdate(
      msg.sender,
      // solhint-disable-next-line not-rely-on-time
      uint128(now),
      1,
      getLesserTimestampKey(token, msg.sender),
      address(0)
    );
    // solhint-disable-next-line not-rely-on-time
    emit OracleReported(token, msg.sender, now, numerator, denominator);
    emitIfMedianUpdated(token, originalMedian);
  }

  /**
   * @notice Returns the number of rates.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The number of reported oracle rates for `token`.
   */
  function numRates(address token) external view returns (uint256) {
    return rates[token].numElements;
  }

  /**
   * @notice Returns the median rate.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The median exchange rate for `token`.
   */
  function medianRate(address token) external view returns (uint128, uint128) {
    SortedFractionMedianList.Element memory median = getMedianElement(rates[token]);
    return (median.numerator, median.denominator);
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getRates(
    address token
  )
    external
    view
    returns (
        address[] memory,
        uint256[] memory,
        uint256[] memory,
        SortedFractionMedianList.MedianRelation[] memory
    )
  {
    return rates[token].getElements();
  }

  /**
   * @notice Returns the number of timestamps.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The number of oracle report timestamps for `token`.
   */
  function numTimestamps(address token) external view returns (uint256) {
    return timestamps[token].numElements;
  }

  /**
   * @notice Returns the median timestamp.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The median report timestamp for `token`.
   */
  function medianTimestamp(address token) external view returns (uint128) {
    return getMedianElement(timestamps[token]).numerator;
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getTimestamps(
    address token
  )
    external
    view
    returns (
        address[] memory,
        uint256[] memory,
        uint256[] memory,
        SortedFractionMedianList.MedianRelation[] memory
    )
  {
    return timestamps[token].getElements();
  }

  /**
   * @notice Returns whether a report exists on token from oracle.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param oracle The oracle whose report should be checked.
   */
  function reportExists(address token, address oracle) internal view returns (bool) {
    return rates[token].elements[oracle].denominator != 0 &&
      timestamps[token].elements[oracle].denominator != 0;
  }

  /**
   * @notice Returns the median element.
   * @return The median element.
   */
  function getMedianElement(
    SortedFractionMedianList.List storage list
  )
    private
    view
    returns (SortedFractionMedianList.Element memory)
  {
    return list.elements[list.medianKey];
  }

  /**
   * @notice Removes an oracle value and updates the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param oracle The oracle whose value should be removed.
   * @dev This can be used to delete elements for oracles that have been removed.
   */
  function removeReport(address token, address oracle) private {
    SortedFractionMedianList.Element memory originalMedian = getMedianElement(rates[token]);
    rates[token].remove(oracle);
    timestamps[token].remove(oracle);
    emit OracleReportRemoved(token, oracle);
    emitIfMedianUpdated(token, originalMedian);
  }

  /**
   * @notice Emits the MedianUpdated event if the median rate has changed.
   * @param token The address of the token for which the median rate may have changed.
   * @param originalMedian The original median rate.
   */
  function emitIfMedianUpdated(
    address token,
    SortedFractionMedianList.Element memory originalMedian
  )
    private
  {
    SortedFractionMedianList.Element memory newMedian = getMedianElement(rates[token]);
    if (
      originalMedian.numerator != newMedian.numerator ||
      originalMedian.denominator != newMedian.denominator
    ) {
      emit MedianUpdated(
        token,
        newMedian.numerator,
        newMedian.denominator
      );
    }
  }

  /**
   * @notice Returns the key for the lesser element in the timestamp list.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param oracle The address of the oracle to sort into the timestamp list.
   * @return The key of the lesser element in the list.
   */
  function getLesserTimestampKey(address token, address oracle) private view returns(address) {
    address head = timestamps[token].head;
    if (head == oracle) {
      return timestamps[token].elements[head].lesserKey;
    } else {
      return head;
    }
  }
}

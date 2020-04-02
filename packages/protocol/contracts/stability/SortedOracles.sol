pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/ISortedOracles.sol";
import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "../common/linkedlists/AddressSortedLinkedListWithMedian.sol";
import "../common/linkedlists/SortedLinkedListWithMedian.sol";

/**
 * @title Maintains a sorted list of oracle exchange rates between Celo Gold and other currencies.
 */
contract SortedOracles is ISortedOracles, Ownable, Initializable {
  using SafeMath for uint256;
  using AddressSortedLinkedListWithMedian for SortedLinkedListWithMedian.List;
  using FixidityLib for FixidityLib.Fraction;

  uint256 private constant FIXED1_UINT = 1000000000000000000000000;

  // Maps a token address to a sorted list of report values.
  mapping(address => SortedLinkedListWithMedian.List) private rates;
  // Maps a token address to a sorted list of report timestamps.
  mapping(address => SortedLinkedListWithMedian.List) private timestamps;
  mapping(address => mapping(address => bool)) public isOracle;
  mapping(address => address[]) public oracles;

  uint256 public reportExpirySeconds;

  event OracleAdded(address indexed token, address indexed oracleAddress);
  event OracleRemoved(address indexed token, address indexed oracleAddress);
  event OracleReported(
    address indexed token,
    address indexed oracle,
    uint256 timestamp,
    uint256 value
  );
  event OracleReportRemoved(address indexed token, address indexed oracle);
  event MedianUpdated(address indexed token, uint256 value);
  event ReportExpirySet(uint256 reportExpiry);

  modifier onlyOracle(address token) {
    require(isOracle[token][msg.sender], "sender was not an oracle for token addr");
    _;
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _reportExpirySeconds The number of seconds before a report is considered expired.
   */
  function initialize(uint256 _reportExpirySeconds) external initializer {
    _transferOwnership(msg.sender);
    setReportExpiry(_reportExpirySeconds);
  }

  /**
   * @notice Sets the report expiry parameter.
   * @param _reportExpirySeconds The number of seconds before a report is considered expired.
   */
  function setReportExpiry(uint256 _reportExpirySeconds) public onlyOwner {
    require(_reportExpirySeconds > 0, "report expiry seconds must be > 0");
    require(_reportExpirySeconds != reportExpirySeconds, "reportExpirySeconds hasn't changed");
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
   * @param token The address of the token.
   * @param oracleAddress The address of the oracle.
   * @param index The index of `oracleAddress` in the list of oracles.
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
      token != address(0) && n < timestamps[token].getNumElements(),
      "token addr null or trying to remove too many reports"
    );
    for (uint256 i = 0; i < n; i = i.add(1)) {
      (bool isExpired, address oldestAddress) = isOldestReportExpired(token);
      if (isExpired) {
        removeReport(token, oldestAddress);
      } else {
        break;
      }
    }
  }

  /**
   * @notice Check if last report is expired.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return bool isExpired and the address of the last report
   */
  function isOldestReportExpired(address token) public view returns (bool, address) {
    require(token != address(0));
    address oldest = timestamps[token].getTail();
    uint256 timestamp = timestamps[token].getValue(oldest);
    // solhint-disable-next-line not-rely-on-time
    if (now.sub(timestamp) >= reportExpirySeconds) {
      return (true, oldest);
    }
    return (false, oldest);
  }

  /**
   * @notice Updates an oracle value and the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param value The amount of `token` equal to one Celo Gold, expressed as a fixidity value.
   * @param lesserKey The element which should be just left of the new oracle value.
   * @param greaterKey The element which should be just right of the new oracle value.
   * @dev Note that only one of `lesserKey` or `greaterKey` needs to be correct to reduce friction.
   */
  function report(address token, uint256 value, address lesserKey, address greaterKey)
    external
    onlyOracle(token)
  {
    uint256 originalMedian = rates[token].getMedianValue();
    if (rates[token].contains(msg.sender)) {
      rates[token].update(msg.sender, value, lesserKey, greaterKey);

      // Rather than update the timestamp, we remove it and re-add it at the
      // head of the list later. The reason for this is that we need to handle
      // a few different cases:
      //   1. This oracle is the only one to report so far. lesserKey = address(0)
      //   2. Other oracles have reported since this one's last report. lesserKey = getHead()
      //   3. Other oracles have reported, but the most recent is this one.
      //      lesserKey = key immediately after getHead()
      //
      // However, if we just remove this timestamp, timestamps[token].getHead()
      // does the right thing in all cases.
      timestamps[token].remove(msg.sender);
    } else {
      rates[token].insert(msg.sender, value, lesserKey, greaterKey);
    }
    timestamps[token].insert(
      msg.sender,
      // solhint-disable-next-line not-rely-on-time
      now,
      timestamps[token].getHead(),
      address(0)
    );
    emit OracleReported(token, msg.sender, now, value);
    uint256 newMedian = rates[token].getMedianValue();
    if (newMedian != originalMedian) {
      emit MedianUpdated(token, newMedian);
    }
  }

  /**
   * @notice Returns the number of rates.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The number of reported oracle rates for `token`.
   */
  function numRates(address token) public view returns (uint256) {
    return rates[token].getNumElements();
  }

  /**
   * @notice Returns the median rate.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The median exchange rate for `token`.
   */
  function medianRate(address token) external view returns (uint256, uint256) {
    return (rates[token].getMedianValue(), numRates(token) == 0 ? 0 : FIXED1_UINT);
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getRates(address token)
    external
    view
    returns (address[] memory, uint256[] memory, SortedLinkedListWithMedian.MedianRelation[] memory)
  {
    return rates[token].getElements();
  }

  /**
   * @notice Returns the number of timestamps.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The number of oracle report timestamps for `token`.
   */
  function numTimestamps(address token) public view returns (uint256) {
    return timestamps[token].getNumElements();
  }

  /**
   * @notice Returns the median timestamp.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return The median report timestamp for `token`.
   */
  function medianTimestamp(address token) external view returns (uint256) {
    return timestamps[token].getMedianValue();
  }

  /**
   * @notice Gets all elements from the doubly linked list.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return An unpacked list of elements from largest to smallest.
   */
  function getTimestamps(address token)
    external
    view
    returns (address[] memory, uint256[] memory, SortedLinkedListWithMedian.MedianRelation[] memory)
  {
    return timestamps[token].getElements();
  }

  /**
   * @notice Returns whether a report exists on token from oracle.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param oracle The oracle whose report should be checked.
   */
  function reportExists(address token, address oracle) internal view returns (bool) {
    return rates[token].contains(oracle) && timestamps[token].contains(oracle);
  }

  /**
   * @notice Returns the list of oracles for a particular token.
   * @param token The address of the token whose oracles should be returned.
   * @return The list of oracles for a particular token.
   */
  function getOracles(address token) external view returns (address[] memory) {
    return oracles[token];
  }

  /**
   * @notice Removes an oracle value and updates the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param oracle The oracle whose value should be removed.
   * @dev This can be used to delete elements for oracles that have been removed.
   * However, a > 1 elements reports list should always be maintained
   */
  function removeReport(address token, address oracle) private {
    if (numTimestamps(token) == 1 && reportExists(token, oracle)) return;
    uint256 originalMedian = rates[token].getMedianValue();
    rates[token].remove(oracle);
    timestamps[token].remove(oracle);
    emit OracleReportRemoved(token, oracle);
    uint256 newMedian = rates[token].getMedianValue();
    if (newMedian != originalMedian) {
      emit MedianUpdated(token, newMedian);
    }
  }
}

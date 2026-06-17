// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

import "@celo-contracts/common/linkedlists/SortedLinkedListWithMedian.sol";

// Test-only standalone interface for SortedOracles. Solidity 0.5 does not allow
// interface inheritance, so this redeclares the canonical ISortedOracles methods
// plus the median-typed getters (getRates/getTimestamps) that reference the
// 0.5.x SortedLinkedListWithMedian.MedianRelation type. Keeping those types out
// of the canonical ISortedOracles avoids dragging the 0.5 linkedlist into the
// 0.8 build graph (0.8 contracts import the canonical interface). Only the 0.5
// stability tests use this interface.
interface ISortedOraclesTest {
  function initialize(uint256 _reportExpirySeconds) external;

  // Canonical ISortedOracles
  function addOracle(address, address) external;
  function removeOracle(address, address, uint256) external;
  function report(address, uint256, address, address) external;
  function removeExpiredReports(address, uint256) external;
  function isOldestReportExpired(address token) external view returns (bool, address);
  function numRates(address) external view returns (uint256);
  function medianRate(address) external view returns (uint256, uint256);
  function numTimestamps(address) external view returns (uint256);
  function medianTimestamp(address) external view returns (uint256);

  // Extended surface exercised by the tests
  function setReportExpiry(uint256 _reportExpirySeconds) external;
  function setTokenReportExpiry(address _token, uint256 _reportExpirySeconds) external;
  function setBreakerBox(address newBreakerBox) external;
  function setEquivalentToken(address token, address equivalentToken) external;
  function deleteEquivalentToken(address token) external;
  function getEquivalentToken(address token) external view returns (address);
  function getTokenReportExpirySeconds(address token) external view returns (uint256);
  function medianRateWithoutEquivalentMapping(
    address token
  ) external view returns (uint256, uint256);
  function getExchangeRate(
    address token
  ) external view returns (uint256 numerator, uint256 denominator);
  function getOracles(address token) external view returns (address[] memory);
  function getRates(
    address token
  )
    external
    view
    returns (address[] memory, uint256[] memory, SortedLinkedListWithMedian.MedianRelation[] memory);
  function getTimestamps(
    address token
  )
    external
    view
    returns (address[] memory, uint256[] memory, SortedLinkedListWithMedian.MedianRelation[] memory);
  function isOracle(address token, address oracle) external view returns (bool);
  function reportExpirySeconds() external view returns (uint256);
  function tokenReportExpirySeconds(address token) external view returns (uint256);
  function breakerBox() external view returns (address);
}

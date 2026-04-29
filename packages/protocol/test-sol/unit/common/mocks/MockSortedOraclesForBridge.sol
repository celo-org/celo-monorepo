// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";

/**
 * @dev Minimal mock that only implements medianRate() for GasSponsoredOFTBridge tests.
 */
contract MockSortedOraclesForBridge is ISortedOracles {
  struct Rate {
    uint256 numerator;
    uint256 denominator;
  }

  mapping(address => Rate) private _rates;

  function setMedianRate(address token, uint256 numerator, uint256 denominator) external {
    _rates[token] = Rate(numerator, denominator);
  }

  function medianRate(address token) external view override returns (uint256, uint256) {
    Rate memory r = _rates[token];
    return (r.numerator, r.denominator);
  }

  // --- Stubs (unused in bridge tests) ---
  function addOracle(address, address) external override {}
  function removeOracle(address, address, uint256) external override {}
  function report(address, uint256, address, address) external override {}
  function removeExpiredReports(address, uint256) external override {}

  function isOldestReportExpired(address) external pure override returns (bool, address) {
    return (false, address(0));
  }

  function numRates(address) external pure override returns (uint256) {
    return 1;
  }

  function numTimestamps(address) external pure override returns (uint256) {
    return 1;
  }

  function medianTimestamp(address) external view override returns (uint256) {
    return block.timestamp;
  }
}

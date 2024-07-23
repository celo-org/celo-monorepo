// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../Election.sol";
import "../../../contracts/common/FixidityLib.sol";

/**
 * @title A wrapper around Election that exposes onlyVm functions for testing.
 */
contract ElectionTest is Election(true) {
  function distributeEpochRewards(
    address group,
    uint256 value,
    address lesser,
    address greater
  ) external override {
    return _distributeEpochRewards(group, value, lesser, greater);
  }
}

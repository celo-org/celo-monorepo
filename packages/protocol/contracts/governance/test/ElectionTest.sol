pragma solidity ^0.5.13;

import "../Election.sol";
import "../../common/FixidityLib.sol";

/**
 * @title A wrapper around Election that exposes onlyVm functions for testing.
 */
contract ElectionTest is Election(true) {
  function distributeEpochRewards(address group, uint256 value, address lesser, address greater)
    external
  {
    return _distributeEpochRewards(group, value, lesser, greater);
  }
}

pragma solidity ^0.5.8;

import "../Election.sol";
import "../../common/FixidityLib.sol";

/**
 * @title A wrapper around Election that exposes onlyVm functions for testing.
 */
contract ElectionTest is Election {

  function distributeEpochRewards(
    address group,
    uint256 value,
    address lesser,
    address greater
  )
    external
  {
    return _distributeEpochRewards(group, value, lesser, greater);
  }
}

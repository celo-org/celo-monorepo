pragma solidity ^0.5.8;

import "../Validators.sol";
import "../../common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsTest is Validators {
  function updateValidatorScore(address validator, uint256 uptime) external {
    return _updateValidatorScore(validator, uptime);
  }

  function distributeEpochPayment(address validator, uint256 maxPayment)
    external
    returns (uint256)
  {
    return _distributeEpochPayment(validator, maxPayment);
  }
}

pragma solidity ^0.5.8;

import "../Validators.sol";
import "../../common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsTest is Validators {

  function getEpochNumber() public view returns (uint256) {
    uint256 epoch = 100;
    uint256 ret = block.number / epoch;
    if (block.number % epoch == 0) {
      ret = ret - 1;
    }
    return ret;
  }

  function updateValidatorScore(address validator, uint256 uptime) external {
    return _updateValidatorScore(validator, uptime);
  }

  function distributeEpochPayment(address validator) external {
    return _distributeEpochPayment(validator);
  }
}

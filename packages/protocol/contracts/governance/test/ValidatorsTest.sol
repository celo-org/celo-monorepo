pragma solidity ^0.5.8;

import "../Validators.sol";
import "../../common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsTest is Validators {
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) external {
    return _updateValidatorScoreFromSigner(signer, uptime);
  }

  function distributeEpochPaymentsFromSigner(address signer, uint256 maxPayment)
    external
    returns (uint256)
  {
    return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }
}

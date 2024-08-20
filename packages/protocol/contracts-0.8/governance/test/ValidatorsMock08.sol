pragma solidity >=0.8.7 <0.8.20;

import "../Validators.sol";
import "../../../contracts/common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsMock is Validators(true) {
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) external {
    return _updateValidatorScoreFromSigner(signer, uptime);
  }

  function distributeEpochPaymentsFromSigner(
    address signer,
    uint256 maxPayment
  ) external returns (uint256) {
    return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }
}

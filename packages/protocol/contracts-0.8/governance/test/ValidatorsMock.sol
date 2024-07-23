// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;


import "../Validators.sol";
import "../../../contracts/common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsMock is Validators(true) {
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) override external {
    return _updateValidatorScoreFromSigner(signer, uptime);
  }

  function distributeEpochPaymentsFromSigner(
    address signer,
    uint256 maxPayment
  ) external override returns (uint256) {
    return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }
}

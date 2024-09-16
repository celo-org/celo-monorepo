// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../Validators.sol";
import "../../../contracts/common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsMock08 is Validators(true) {
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) external override {
    // console2.log("### update Validator Score From Signer");
  }

  function distributeEpochPaymentsFromSigner(
    address signer,
    uint256 maxPayment
  ) external override returns (uint256) {
    // console2.log("### distributeEpochPaymentsFromSigner");
    return 0;
    // return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }

  function computeEpochReward(
    address account,
    uint256 score,
    uint256 maxPayment
  ) external view override returns (uint256) {
    return 1;
  }
}

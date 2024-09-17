// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/Validators.sol";
import "@celo-contracts/common/FixidityLib.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsMock is Validators(true) {
  function computeEpochReward(
    address account,
    uint256 score,
    uint256 maxPayment
  ) external view override returns (uint256) {
    return 1;
  }
}

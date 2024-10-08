// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../EpochManager.sol";

contract EpochManager_WithMocks is EpochManager(true) {
  function _setPaymentAllocation(address validator, uint256 amount) external {
    validatorPendingPayments[validator] = amount;
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../EpochManager.sol";

contract EpochManager_WithMocks is EpochManager(true) {
  function _setPaymentAllocation(address validator, uint256 amount) external {
    validatorPendingPayments[validator] = amount;
  }

  // mocks finishNextEpochProcess to increment the epoch number.
  function finishNextEpochProcess(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external override nonReentrant {
    require(isOnEpochProcess(), "Epoch process is not started");

    epochs[currentEpochNumber].lastBlock = block.number - 1;

    currentEpochNumber++;
    epochs[currentEpochNumber].firstBlock = block.number;
    epochs[currentEpochNumber].startTimestamp = block.timestamp;

    EpochProcessState storage _epochProcessing = epochProcessing;
    epochs[currentEpochNumber].elected = elected;
    _epochProcessing.status = EpochProcessStatus.NotStarted;
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

/**
 * @notice Minimal EpochManager mock for ValidatorsTest_UpdateMembershipHistory.
 *
 * The real EpochManager_WithMocks never advances its currentEpochNumber without
 * full epoch processing (startNextEpochProcess + finishNextEpochProcess), so all
 * block numbers map to the same epoch.  These membership-history tests need the
 * epoch to advance on each travelNEpoch(1) call.
 *
 * This mock computes epoch numbers with the same L1-precompile formula that the
 * test helpers (getEpochNumber / UsingPrecompiles.epochNumberOfBlock) use, so
 * both sides of every assertion agree.
 *
 * L1_BLOCK_IN_EPOCH = 17280 (constant from TestConstants)
 */
contract MockEpochManagerForMembershipHistory {
  uint256 private constant L1_BLOCK_IN_EPOCH = 17280;

  // Mirrors UsingPrecompiles.epochNumberOfBlock(blockNumber, epochSize).
  // The Solidity `return epochNumber++` idiom actually returns epochNumber+1
  // for blockNumber % epochSize != 0 (observed at runtime).
  function getEpochNumberOfBlock(uint256 blockNumber) external pure returns (uint256) {
    uint256 epochNumber = blockNumber / L1_BLOCK_IN_EPOCH;
    if (blockNumber % L1_BLOCK_IN_EPOCH == 0) {
      return epochNumber;
    } else {
      return epochNumber + 1;
    }
  }

  // No-op: no pending payments in test context
  function sendValidatorPayment(address) external {}

  // Epoch processing never started in this mock
  function isEpochProcessingStarted() external pure returns (bool) {
    return false;
  }

  function systemAlreadyInitialized() external pure returns (bool) {
    return true;
  }
}

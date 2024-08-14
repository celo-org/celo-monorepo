// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IEpochManager {
  /**
   * @notice Sets the time duration of an epoch.
   */
  function setEpochDuration(uint256) external;

  /**
   * @notice Starts the processing of the previous epoch.
   */
  function startProcessingEpoch() external;

  /**
   * @notice Marks the end of the previous epoch processing.
   */
  function finishProcessingEpoch() external;

  /**
   * @return Whether or not an epoch is ready for processing.
   */
  function checkReadyStartProcessingEpoch() external returns (bool);
}

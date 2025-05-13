// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IMintGoldSchedule {
  /**
   * @notice Mints CELO to the beneficiaries according to the predefined schedule.
   */
  function mintAccordingToSchedule() external returns (bool);

  /**
   * @return The currently mintable amount.
   */
  function getMintableAmount() external returns (uint256);

  /**
   * @notice Returns the target Gold supply according to the target schedule.
   * @return The target Gold supply according to the target schedule.
   */
  function getTargetGoldTotalSupply() external returns (uint256, uint256, uint256);
}

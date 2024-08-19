// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface ICeloDistributionSchedule {
  /**
   * @notice Sets the distribution schedule dependencies during L2 transition.
   */
  function activate(uint256, uint256, address, uint256, address) external;

  /**
   * @notice Mints CELO to the beneficiaries according to the predefined schedule.
   */
  function mintAccordingToSchedule() external returns (bool);

  /**
   * @return The currently mintable amount.
   */
  function getMintableAmount() external returns (uint256);

  /**
   * @notice Returns the target CELO supply according to the target schedule.
   * @return The target CELO supply according to the target schedule.
   */
  function getTargetCeloTotalSupply() external returns (uint256, uint256, uint256);

  /**
   * @notice Releases the Celo to the specified address.
   * @param to The address to release the amount to.
   * @param amount The amount to release.
   */
  function release(address to, uint256 amount) external ;
}

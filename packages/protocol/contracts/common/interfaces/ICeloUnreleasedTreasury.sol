// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9;

interface ICeloUnreleasedTreasury {
  /**
   * @notice Releases the Celo to the specified address.
   * @param to The address to release the amount to.
   * @param amount The amount to release.
   */
  function release(address to, uint256 amount) external;
}

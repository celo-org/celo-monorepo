// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.9.0;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IGoldToken is IERC20 {
  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress Address of the Registry contract.
   */
  function initialize(address registryAddress) external;

  /**
   * @notice Updates the address pointing to a Registry contract.
   * @param registryAddress The address of a registry contract for routing to other contracts.
   */
  function setRegistry(address registryAddress) external;

  /**
   * @notice Used set the address of the MintGoldSchedule contract.
   * @param goldTokenMintingScheduleAddress The address of the MintGoldSchedule contract.
   */
  function setGoldTokenMintingScheduleAddress(address goldTokenMintingScheduleAddress) external;

  /**
   * @dev Mints a new token.
   * @param to The address that will own the minted token.
   * @param value The amount of token to be minted.
   */
  function mint(address to, uint256 value) external returns (bool);
}

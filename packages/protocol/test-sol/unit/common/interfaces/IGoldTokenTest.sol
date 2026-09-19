// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Test-only superset interface for GoldToken covering all methods used
 * by unit and integration tests. Kept separate from the production interfaces
 * so 0.8 importers are not pulled into 0.5 compilation units.
 */
interface IGoldTokenTest {
  // ICeloTokenInitializer
  function initialize(address registryAddress) external;

  // UsingRegistry (needed by setUp helpers)
  function setRegistry(address registryAddress) external;

  // ICeloToken
  function transferWithComment(
    address to,
    uint256 value,
    string calldata comment
  ) external returns (bool);
  function burn(uint256 value) external returns (bool);
  function name() external view returns (string memory);
  function symbol() external view returns (string memory);
  function decimals() external view returns (uint8);
  function allocatedSupply() external view returns (uint256);
  function totalSupply() external view returns (uint256);

  // IERC20
  function transfer(address to, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
  function approve(address spender, uint256 value) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint256);
  function balanceOf(address owner) external view returns (uint256);

  // GoldToken-specific
  function getBurnedAmount() external view returns (uint256);
  function increaseAllowance(address spender, uint256 value) external returns (bool);
  function decreaseAllowance(address spender, uint256 value) external returns (bool);
}

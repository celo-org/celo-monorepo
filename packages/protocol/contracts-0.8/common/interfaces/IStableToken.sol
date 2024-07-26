// SPDX-License-Identifier: MIT
pragma solidity >=0.5.13 <0.9.0;

/**
 * @title This interface describes the functions specific to Celo Stable Tokens, and in the
 * absence of interface inheritance is intended as a companion to IERC20.sol and ICeloToken.sol.
 */
interface IStableToken {
  function mint(address, uint256) external returns (bool);

  function burn(uint256) external returns (bool);

  function setInflationParameters(uint256, uint256) external;

  function initialize(
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals,
    address registryAddress,
    uint256 inflationRate,
    uint256 inflationFactorUpdatePeriod,
    address[] calldata initialBalanceAddresses,
    uint256[] calldata initialBalanceValues,
    string calldata exchangeIdentifier
  ) external;

  function transfer(address recipient, uint256 amount) external returns (bool);

  function valueToUnits(uint256) external view returns (uint256);

  function unitsToValue(uint256) external view returns (uint256);

  function getInflationParameters() external view returns (uint256, uint256, uint256, uint256);

  // NOTE: duplicated with IERC20.sol, remove once interface inheritance is supported.
  function balanceOf(address) external view returns (uint256);
}

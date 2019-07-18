pragma solidity ^0.5.8;


/**
 * @title This interface describes the functions specific to Celo Stable Tokens, and in the
 * absence of interface inheritance is intended as a companion to IERC20.sol and ICeloToken.sol.
 */
interface IStableToken {

  function initialize(
    string calldata,
    string calldata,
    uint8,
    address,
    uint256,
    uint256,
    uint256
  ) external;

  function setMinter(address) external;

  function mint(address, uint256) external returns (bool);
  function burn(uint256) external returns (bool);
  function debitFrom(address, uint256) external;
  function creditTo(address, uint256) external;
  function setInflationParameters(uint256, uint256, uint256) external;

  function fractionMulExp(
    uint256,
    uint256,
    uint256,
    uint256,
    uint256,
    uint256
  )
    external
    view
    returns (uint256, uint256);

  function valueToUnits(uint256) external view returns (uint256);
  function unitsToValue(uint256) external view returns (uint256);
  function getInflationParameters()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256, uint256);

  // NOTE: duplicated with IERC20.sol, remove once interface inheritance is supported.
  function balanceOf(address) external view returns (uint256);
}

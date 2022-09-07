// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/*
 * @title Broker Interface for trader functions
 * @notice The broker is responsible for executing swaps and keeping track of trading limits
 */
interface IBroker {
  /**
   * @notice Emitted when a swap occurs
   * @param exchangeManager The exchange manager used
   * @param exchangeId The id of the exchange used
   * @param trader The user that initiated the swap
   * @param tokenIn The address of the token that was sold
   * @param tokenOut The address of the token that was bought
   * @param amountIn The amount of token sold 
   * @param amountOut The amount of token bought
   */
  event Swap(
    address exchangeManager,
    bytes32 indexed exchangeId,
    address indexed trader,
    address indexed tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut
  );

  /**
   * @notice Execute a token swap with fixed amountIn
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin
  ) external returns (uint256 amountOut);

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @param amountInMax Maximum amount of tokenIn that can be traded
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut,
    uint256 amountInMax
  ) external returns (uint256 amountIn);

  /**
   * @notice Quote a token swap with fixed amountIn
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function quoteIn(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn
  ) external returns (uint256 amountOut);

  /**
   * @notice Quote a token swap with fixed amountOut
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function quoteOut(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut
  ) external returns (uint256 amountIn);

  /**
   * @notice Get the list of registered exchange managers.
   * @dev This can be used by UI or clients to discover all pairs.
   * @return exchangeManagers the addresses of all exchange managers.
   */
  function getExchangeManagers() external returns (address[] memory exchangeManagers);
}

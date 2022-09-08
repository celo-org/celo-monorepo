// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/*
 * @title ExchangeManager interface
 * @notice The IExchangeManager interface is the interface that the Broker uses
 * to communicate with different listing manager implementations like the TwoAssetPoolManager
 */
interface IExchangeManager {
  /**
   * @notice Execute a token swap with fixed amountIn
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    returns (uint256 amountOut);

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    external
    returns (uint256 amountIn);

  /**
   * @notice Quote a token swap with fixed amountIn
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function quoteIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    returns (uint256 amountOut);

  /**
   * @notice Quote a token swap with fixed amountOut
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function quoteOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    external
    returns (uint256 amountIn);
}

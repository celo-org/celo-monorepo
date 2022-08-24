// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/*
 * @title Broker Interface
 * @notice The broker is responsible for executing swaps and keeping track of trading limits
 */
interface IBroker {
  /**
   * @notice Emitted when a swap occurs
   * @param pairId The id of the pair where the swap occured
   * @param trader The user that initiated the swap
   * @param tokenIn The address of the token that was sold
   * @param tokenOut The address of the token that was bought
   * @param amountIn The amount of token sold 
   * @param amountOut The amount of token bought
   */
  event Swap(
    bytes32 indexed pairId,
    address indexed trader,
    address indexed tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut
  );

  /**
   * @notice Execute a token swap
   * @param pairId The id of the pair to be swapped
   * @param tokenIn The address of the token to be sold
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return tokenOut The token to be bought 
   * @return amountOut The amount of tokenOut to be bought
   */
  function swap(bytes32 pairId, address tokenIn, uint256 amountIn, uint256 amountOutMin)
    external
    view
    returns (address tokenOut, uint256 amountOut);

  /**
   * @notice Calculates the quote for a swap
   * @param pairId The id of the pair
   * @param tokenIn The address of the token to be sold
   * @param amountIn The amount of tokenIn to be sold
   * @return tokenOut The token to be bought 
   * @return amountOut The amount of tokenOut to be bought
   */
  function quote(bytes32 pairId, address tokenIn, uint256 amountIn)
    external
    view
    returns (address tokenOut, uint256 amountOut);

}

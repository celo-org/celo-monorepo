// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/*
 * @title ListingManager interface
 * @notice The IListingManager interface is the interface that the Broker uses
 * to communicate with different listing manager implementations like the TwoAssetPoolManager
 */
interface IListingManager {
  /**
   * @notice Execute a token swap with fixed amountIn
   * @param pairId The id of the pair to be swapped
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(
    bytes32 pairId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin
  ) external returns (uint256 amountOut);

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param pairId The id of the pair to be swapped
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(
    address listingManager,
    bytes32 pairId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut,
    uint256 amountInMax
  ) external returns (uint256 amountIn);

  /**
   * @notice Quote a token swap with fixed amountIn
   * @param pairId The id of the pair to be swapped
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function quoteIn(bytes32 pairId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    returns (uint256 amountOut);

  /**
   * @notice Quote a token swap with fixed amountOut
   * @param pairId The id of the pair to be swapped
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function quoteOut(bytes32 pairId, address tokenIn, address tokenOut, uint256 amountOut)
    external
    returns (uint256 amountIn);
}

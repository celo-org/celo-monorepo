// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

/*
 * @title ExchangeProvider interface
 * @notice The IExchangeProvider interface is the interface that the Broker uses
 * to communicate with different exchange manager implementations like the TwoAssetPoolManager
 */
interface IExchangeProvider {
  /** 
   * @notice Exchange - a struct that's used only by UIs (frontends/CLIs)
   * in order to discover what asset swaps are possible within an 
   * exchange provider. 
   * It's up to the specific exchange provider to convert its internal
   * representation to this universal struct. This conversion should
   * only happen in view calls used for discovery.
   * @param exchangeId The ID of the exchange, used to initiate swaps or get quotes.
   * @param assets An array of addresses of ERC20 tokens that can be swapped.
   */
  struct Exchange {
    bytes32 exchangeId;
    address[] assets;
  }

  /**
   * @notice Get all exchanges supported by the ExchangeProvider.
   * @return exchanges An array of Exchange structs.
   */
  function getExchanges() external view returns (Exchange[] memory exchanges);

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
   * @notice Calculate amountOut of tokenOut received for a given amountIn of tokenIn
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function getAmountOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    returns (uint256 amountOut);

  /**
   * @notice Calculate amountIn of tokenIn needed for a given amountOut of tokenOut
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function getAmountIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    external
    returns (uint256 amountIn);
}

pragma solidity ^0.5.13;

/**
 * @title Interface for a Mento exchange.
 * @notice A Mento exchange represents an exchange relation between a pair of ERC20 assets.
 */
interface IMentoExchange {
  /**
   * @notice Returns the output amount for a given input amount.
   * @param tokenIn Address of the token being used to pay for another one.
   * @param tokenOut Address of the token being exchanged for.
   * @param tokenInBucketSize Size of the tokenIn bucket.
   * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param amountIn Amount of tokenIn being paid in.
   * @return amountOut Amount of tokenOut that will be paid out.
   */
  function getAmountOut(
    address tokenIn,
    address tokenOut,
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 amountIn
  ) external view returns (uint256 amountOut);

  /**
   * @notice Returns the size of a pair's buckets after an exchange.
   * @param tokenIn Address of the token being paid in.
   * @param tokenOut Address of the token being paid out.
   * @param amountIn Amount of tokenIn being paid in
   * @param amountOut Amount of tokenOut being paid out.
   * @param pairId The ID for the pair which updated buckets are being queried.
   * @return tokenInBucketSize Size of the tokenIn bucket after an update.
   * @return tokenOutBucketSize Size of the tokenOut bucket after an update.
   */
  function getUpdatedBuckets(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut,
    bytes32 pairId
  ) external view returns (uint256 tokenInBucketSize, uint256 tokenOutBucketSize);

  /**
   * @notice Retrieve the name of this exchange.
   * @return exchangeName The name of the exchange.
   */
  function name() external pure returns (string memory exchangeName);
}

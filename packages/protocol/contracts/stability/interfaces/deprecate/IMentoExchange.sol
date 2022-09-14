pragma solidity ^0.5.13;

/**
 * @title Interface for a Mento exchange.
 * @notice A Mento exchange represents an exchange relation between a pair of ERC20 assets.
 */
interface IMentoExchange {
  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param amountIn Amount of tokens being paid in.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @param spread The spread of the pool.
   * @return amountOut Amount of tokens that will be paid out.
   * @return nextInBucketSize Size of the in bucket after the swap.
   * @return nextOutBucketSize Size of the out bucket after the swap.
   */
  function getAmountOut(
    uint256 amountIn,
    uint256 inBucketSize,
    uint256 outBucketSize,
    uint256 spread
  ) external pure returns (uint256 amountOut, uint256 nextInBucketSize, uint256 nextOutBucketSize);

  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param amountOut Amount of tokens desired to be paid out.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @param spread The spread of the pool.
   * @return amountIn Amount of tokens that have to be paid in.
   * @return nextInBucketSize Size of the in bucket after the swap.
   * @return nextOutBucketSize Size of the out bucket after the swap.
   */
  function getAmountIn(
    uint256 amountOut,
    uint256 inBucketSize,
    uint256 outBucketSize,
    uint256 spread
  ) external pure returns (uint256 amountIn, uint256 nextInBucketSize, uint256 nextOutBucketSize);

  /**
   * @notice Returns the size of a pair's buckets after an exchange.
   * @param amountIn Amount of in being paid in
   * @param amountOut Amount of out being paid out.
   * @param inBucketSize Size of the in bucket.
   * @param outBucketSize Size of the out bucket.
   * @return newinBucketSize Size of the in bucket after the swap.
   * @return newoutBucketSize Size of the out bucket after the swap.
   */
  function getUpdatedBuckets(
    uint256 amountIn,
    uint256 amountOut,
    uint256 inBucketSize,
    uint256 outBucketSize
  ) external pure returns (uint256 nextInBucketSize, uint256 nextOutBucketSize);

  /**
   * @notice Retrieve the name of this exchange.
   * @return exchangeName The name of the exchange.
   */
  function name() external view returns (string memory exchangeName);
}

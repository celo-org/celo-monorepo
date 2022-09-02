pragma solidity ^0.5.13;

/**
 * @title Interface for a PricingModule that 
 * @notice A Mento exchange represents an exchange relation between a pair of ERC20 assets.
 */
interface IPricingModule {
  /**
   * @notice Returns the output amount for given buckets and an amount in
   * @param tokenInBucketSize Size of the tokenIn bucket.
   * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param amountIn Amount of tokenIn being paid in.
   * @return amountOut Amount of tokenOut that will be paid out.
   */
  function getAmountOut(uint256 tokenInBucketSize, uint256 tokenOutBucketSize, uint256 amountIn)
    external
    view
    returns (uint256 amountOut);

  /**
   * @notice Returns the input amount for given buckets and an amount out
   * @param tokenInBucketSize Size of the tokenIn bucket.
   * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param amountOut Amount of tokenOut being paid out
   * @return amountIn Amount of tokenIn that will be paid in.
   */
  function getAmountIn(uint256 tokenInBucketSize, uint256 tokenOutBucketSize, uint256 amountOut)
    external
    view
    returns (uint256 amountIn);

  /**
   * @notice Retrieve the name of this exchange.
   * @return exchangeName The name of the exchange.
   */
  function name() external view returns (string memory exchangeName);
}

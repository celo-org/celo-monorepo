// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;

/**
 * @title Interface for a Mento Pricing Module.
 * @notice A Mento pricing module represents an exchange relation between a pair of ERC20 assets.
 */
interface IPricingModule {
  /**
   * @notice Returns the output amount and new bucket sizes for a given input amount.
   * @param tokenInBucketSize Size of the tokenIn bucket.
   * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param spread Spread charged on exchanges.
   * @param amountIn Amount of tokenIn being paid in.
   * @return amountOut Amount of tokenOut that will be paid out.
   */
  function getAmountOut(
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 spread,
    uint256 amountIn
  ) external view returns (uint256 amountOut);

  /**
    * @notice Returns the input amount necessary for a given output amount.
    * @param tokenInBucketSize Size of the tokenIn bucket.
    * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param spread Spread charged on exchanges.
    * @param amountOut Amount of tokenIn being paid out.
    * @return amountIn Amount of tokenOut that would have to be paid in.
    */
  function getAmountIn(
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 spread,
    uint256 amountOut
  ) external view returns (uint256 amountIn);

  /**
   * @notice Retrieve the name of this pricing module.
   * @return exchangeName The name of the pricing module.
   */
  function name() external view returns (string memory pricingModuleName);
}

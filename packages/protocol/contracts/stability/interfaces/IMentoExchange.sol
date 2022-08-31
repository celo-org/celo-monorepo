pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// TODO: Remove after merge to branch and use IPairManager.Pairz
import { FixidityLib } from "../../common/FixidityLib.sol";

/**
 * @title Interface for a Mento exchange.
 * @notice A Mento exchange represents an exchange relation between a pair of ERC20 assets.
 */
interface IMentoExchange {
  // TODO: Remove after merge to branch and use IPairManager.Pair
  struct Pair {
    address stableAsset;
    address collateralAsset;
    IMentoExchange mentoExchange;
    uint256 stableBucket;
    uint256 collateralBucket;
    uint256 bucketUpdateFrequency;
    uint256 lastBucketUpdate;
    FixidityLib.Fraction collateralBucketFraction;
    FixidityLib.Fraction stableBucketMaxFraction;
    FixidityLib.Fraction spread;
    uint256 minimumReports;
    uint256 minSupplyForStableBucketCap;
  }

  /**
   * @notice Returns the output amount for a given input amount.
   * @param tokenIn Address of the token being used to pay for another one.
   * @param tokenOut Address of the token being exchanged for.
   * @param tokenInBucketSize Size of the tokenIn bucket.
   * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param spread Spread charged on exchanges.
   * @param amountIn Amount of tokenIn being paid in.
   * @return amountOut Amount of tokenOut that will be paid out.
   */
  function getAmountOut(
    address tokenIn,
    address tokenOut,
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 spread,
    uint256 amountIn
  ) external view returns (uint256 amountOut);

  /**
   * @notice Returns the input amount necessary for a given output amount.
   * @param tokenIn Address of the token being used to pay for another one.
   * @param tokenOut Address of the token being exchanged for.
   * @param tokenInBucketSize Size of the tokenIn bucket.
   * @param tokenOutBucketSize Size of the tokenOut bucket.
   * @param spread Spread charged on exchanges.
   * @param amountOut Amount of tokenIn being paid out.
   * @return amountIn Amount of tokenOut that would have to be paid in.
   */
  function getAmountIn(
    address tokenIn,
    address tokenOut,
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 spread,
    uint256 amountOut
  ) external view returns (uint256 amountIn);

  /**
   * @notice Calculates the new size of a given pair's buckets after a price update.
   * @param pair The pair being updated.
   * @return updatedStableBucket Size of the stable bucket after an update.
   * @return updatedCollateralBucket Size of the collateral bucket after an update.
   */
  function getUpdatedBuckets(Pair calldata pair)
    external
    view
    returns (uint256 updatedStableBucket, uint256 updatedCollateralBucket);
}

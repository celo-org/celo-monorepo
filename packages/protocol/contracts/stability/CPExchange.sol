pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IMentoExchange } from "./interfaces/IMentoExchange.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";
import { IReserve } from "./interfaces/IReserve.sol";

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Initializable } from "../common/Initializable.sol";
import { FixidityLib } from "../common/FixidityLib.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";
import { ReentrancyGuard } from "../common/libraries/ReentrancyGuard.sol";

contract CPExchange is IMentoExchange, UsingRegistry, ReentrancyGuard, Initializable {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  /* ==================== Constructor ==================== */

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Allows the contract to be upgradable via the proxy.
   * @param registryAddress The address of the Celo registry.
   */
  function initilize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /* ==================== View Functions ==================== */

  // TODO(pedro-clabs): add spread to getAmount{In,Out}.
  function getAmountOut(
    address tokenIn, // TODO(pedro-clabs): do we need the token addresses?
    address tokenOut, // TODO(pedro-clabs): do we need the token addresses?
    uint256 tokenInBucketSize,
    uint256 tokenOutBucketSize,
    uint256 amountIn
  ) external view returns (uint256) {
    if (amountIn == 0) return 0;

    FixidityLib.Fraction memory amountInFixed = FixidityLib.newFixed(amountIn);
    FixidityLib.Fraction memory numerator = amountInFixed.multiply(
      FixidityLib.newFixed(tokenOutBucketSize)
    );
    FixidityLib.Fraction memory denominator = FixidityLib.newFixed(tokenInBucketSize).add(
      amountInFixed
    );

    // Can't use FixidityLib.divide because denominator can easily be greater
    // than maxFixedDivisor.
    // Fortunately, we expect an integer result, so integer division gives us as
    // much precision as we could hope for.
    return numerator.unwrap().div(denominator.unwrap());
  }

  /**
   * @notice Calculates the new size of a given pair's buckets after a price update.
   * @param pair The pair being updated.
   * @return updatedStableBucket Size of the stable bucket after an update.
   * @return updatedCollateralBucket Size of the collateral bucket after an update.
   */
  function getUpdatedBuckets(Pair calldata pair)
    external
    view
    returns (uint256 updatedStableBucket, uint256 updatedCollateralBucket)
  {
    //if (shouldUpdateBuckets(pair.stableAsset, pair.bucketUpdateFrequency, pair.minimumReports)) {}

    // Get the updated buckets

    return (0, 0);
    // return (tokenInBucketSize + amountIn, tokenOutBucketSize - amountOut);
  }

  /* ==================== Private Functions ==================== */

  /**
   * @notice Checks if conditions have been met to update the buckets of a pair.
   * @param stable The address of the mento stable of the pair.
   * @param updateFrequency The update frequency of the pair.
   * @param minimumReports The minimum number of reports required for the pair.
   * @param lastBucketUpdate The timestamp of the last bucket update for the pair.
   * @return Returns a bool indicating whether or not buckets for the pair should be updated.
   */
  function shouldUpdateBuckets(
    address stable,
    uint256 updateFrequency,
    uint256 minimumReports,
    uint256 lastBucketUpdate
  ) private view returns (bool) {
    ISortedOracles sortedOracles = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    );

    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(stable);
    bool timePassed = now >= lastBucketUpdate.add(updateFrequency);
    bool enoughReports = sortedOracles.numRates(stable) >= minimumReports;
    bool medianReportRecent = sortedOracles.medianTimestamp(stable) > now.sub(updateFrequency);

    return timePassed && enoughReports && medianReportRecent && !isReportExpired;
  }

  function getUpdatedCollateralBucket(address collateralAsset) private view returns (uint256) {}
}

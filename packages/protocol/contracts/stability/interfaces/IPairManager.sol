pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { FixidityLib } from "../../common/FixidityLib.sol";

/**
 * @title Pair Manager Interface
 * @notice The pair manager is responsible for managing the state of all Mento virtual pairs.
 */
interface IPairManager {
  struct Pair {
    address stableAsset;
    address collateralAsset;
    address mentoExchange;
    uint256 stableBucket;
    uint256 collateralBucket;
    uint256 bucketUpdateFrequency;
    uint256 lastBucketUpdate;
    FixidityLib.Fraction collateralBucketFraction;
    FixidityLib.Fraction stableBucketMaxFraction;
    FixidityLib.Fraction spread;
    uint256 minimumReports;
    uint256 minSupplyForStableBucketCap;
    bytes32 stableTokenRegistryId;
  }

  /**
   * @notice Emitted when a new virtual pair has been created.
   * @param stableAsset The address of the stable asset.
   * @param collateralAsset The address of the collateral asset.
   * @param mentoExchange The address of the Mento exchange.
   */
  event PairCreated(
    address indexed stableAsset,
    address indexed collateralAsset,
    address indexed mentoExchange
  );

  /**
   * @notice Emitted when a virtual pair has been destroyed.
   * @param stableAsset The address of the stable asset.
   * @param collateralAsset The address of the collateral asset.
   * @param mentoExchange The address of the Mento exchange.
   */
  event PairDestroyed(
    address indexed stableAsset,
    address indexed collateralAsset,
    address indexed mentoExchange
  );

  /**
   * @notice Retrieves the pair with the specified pairId.
   * @param pairId The id of the pair to be retrieved.
   * @return found A boolean indicating whether a pair with the given pairId was found.
   * @return pair The pair information.
   */
  function getPair(bytes32 pairId) external view returns (bool found, Pair memory pair);
}

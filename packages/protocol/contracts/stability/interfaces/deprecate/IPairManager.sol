pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IMentoExchange } from "./IMentoExchange.sol";

import { FixidityLib } from "../../../common/FixidityLib.sol";

/**
 * @title Pair Manager Interface
 * @notice The pair manager is responsible for managing the state of all Mento virtual pairs.
 */
interface IPairManager {
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
   * @notice Emitted when a new virtual pair has been created.
   * @param stableAsset The address of the stable asset.
   * @param collateralAsset The address of the collateral asset.
   * @param mentoExchange The address of the Mento exchange.
   * @param pairId The id of the newly created pair.
   */
  event PairCreated(
    address indexed stableAsset,
    address indexed collateralAsset,
    address indexed mentoExchange,
    bytes32 pairId
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
   * @notice Emitted when the broker address is updated.
   * @param newBroker The address of the new broker.
   */
  event BrokerUpdated(address indexed newBroker);

  /**
   * @notice Emitted when the reserve address is updated.
   * @param newReserve The address of the new reserve.
   */
  event ReserveUpdated(address indexed newReserve);

  /**
   * @notice Emitted when the buckets for a specified pair are updated.
   * @param pairId The id of the pair.
   * @param collateralBucket The new collateral bucket size.
   * @param stableBucket The new stable bucket size.
   */
  event BucketsUpdated(bytes32 pairId, uint256 collateralBucket, uint256 stableBucket);

  /**
   * @notice Retrieves the pair with the specified pairId.
   * @param pairId The id of the pair to be retrieved.
   * @return found A boolean indicating whether a pair with the given pairId was found.
   * @return pair The pair information.
   */
  function getPair(bytes32 pairId) external view returns (Pair memory pair);

  /**
   * @notice Updates the bucket sizes for the virtual pair with the specified pairId.
   * @param pairId The id of the pair to be updated.
   * @param stableBucket The new stable bucket size.
   * @param collateralBucket The new collateral bucket size.
   */
  function updateBuckets(bytes32 pairId, uint256 stableBucket, uint256 collateralBucket) external;
}

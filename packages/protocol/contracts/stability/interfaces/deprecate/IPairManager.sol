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

/*
    pair_cUSD_CELO = IPairManager.Pair(
      address(cUSDToken),
      address(celoToken),
      crossProductExchange,
      10**24,
      2 * 10**24,
      60 * 5,
      now,
      FixidityLib.newFixedFraction(50, 100), // collateralBucketFraction
      FixidityLib.newFixedFraction(30, 100), // stableBucketMaxFraction
      FixidityLib.newFixedFraction(5, 100), // spread
      5, // minimumReports
      10**20 // minSupplyForStableBucketCap
    );

    pair_cUSD_CELO_ID = pairManager.createPair(pair_cUSD_CELO);

    pair_cUSD_USDCet = IPairManager.Pair(
      address(cUSDToken),
      address(usdcToken),
      crossProductExchange,
      10**24,
      2 * 10**24,
      60 * 5,
      now,
      FixidityLib.newFixedFraction(50, 100), // collateralBucketFraction
      FixidityLib.newFixedFraction(30, 100), // stableBucketMaxFraction
      FixidityLib.newFixedFraction(5, 100), // spread
      5, // minimumReports
      10**20 // minSupplyForStableBucketCap
    );

    pair_cUSD_USDCet_ID = pairManager.createPair(pair_cUSD_USDCet);

    pair_cEUR_CELO = IPairManager.Pair(
      address(cEURToken),
      address(celoToken),
      crossProductExchange,
      10**24,
      2 * 10**24,
      60 * 5,
      now,
      FixidityLib.newFixedFraction(50, 100), // collateralBucketFraction
      FixidityLib.newFixedFraction(30, 100), // stableBucketMaxFraction
      FixidityLib.newFixedFraction(5, 100), // spread
      5, // minimumReports
      10**20 // minSupplyForStableBucketCap
    );

    pair_cEUR_CELO_ID = pairManager.createPair(pair_cEUR_CELO);

    pair_cEUR_USDCet = IPairManager.Pair(
      address(cEURToken),
      address(usdcToken),
      crossProductExchange,
      10**24,
      2 * 10**24,
      60 * 5,
      now,
      FixidityLib.newFixedFraction(50, 100), // collateralBucketFraction
      FixidityLib.newFixedFraction(30, 100), // stableBucketMaxFraction
      FixidityLib.newFixedFraction(5, 100), // spread
      5, // minimumReports
      10**20 // minSupplyForStableBucketCap
    );

    pair_cEUR_CELO_ID = pairManager.createPair(pair_cEUR_USDCet);




    pair_cUSD_CELO.stableAsset = address(cUSDToken);
    pair_cUSD_CELO.collateralAsset = address(celoToken);
    pair_cUSD_CELO.mentoExchange = crossProductExchange;
    pair_cUSD_CELO.stableBucket = 10**24;
    pair_cUSD_CELO.collateralBucket = 2 * 10**24;
    pair_cUSD_CELO.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_CELO.lastBucketUpdate = now;
    pair_cUSD_CELO.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cUSD_CELO.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cUSD_CELO.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_CELO.minimumReports = 5;
    pair_cUSD_CELO.minSupplyForStableBucketCap = 10**20;

    pair_cUSD_CELO_ID = pairManager.createPair(pair_cUSD_CELO);

    pair_cUSD_USDCet.stableAsset = address(cUSDToken);
    pair_cUSD_USDCet.collateralAsset = address(usdcToken);
    pair_cUSD_USDCet.mentoExchange = crossProductExchange;
    pair_cUSD_USDCet.stableBucket = 10**24;
    pair_cUSD_USDCet.collateralBucket = 2 * 10**24;
    pair_cUSD_USDCet.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_USDCet.lastBucketUpdate = now;
    pair_cUSD_USDCet.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cUSD_USDCet.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cUSD_USDCet.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_USDCet.minimumReports = 5;
    pair_cUSD_USDCet.minSupplyForStableBucketCap = 10**20;

    pair_cUSD_USDCet_ID = pairManager.createPair(pair_cUSD_USDCet);

    pair_cEUR_CELO.stableAsset = address(cEURToken);
    pair_cEUR_CELO.collateralAsset = address(celoToken);
    pair_cEUR_CELO.mentoExchange = crossProductExchange;
    pair_cEUR_CELO.stableBucket = 10**24;
    pair_cEUR_CELO.collateralBucket = 2 * 10**24;
    pair_cEUR_CELO.bucketUpdateFrequency = 60 * 5;
    pair_cEUR_CELO.lastBucketUpdate = now;
    pair_cEUR_CELO.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cEUR_CELO.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cEUR_CELO.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cEUR_CELO.minimumReports = 5;
    pair_cEUR_CELO.minSupplyForStableBucketCap = 10**20;

    pair_cEUR_CELO_ID = pairManager.createPair(pair_cEUR_CELO);

    pair_cEUR_USDCet.stableAsset = address(cEURToken);
    pair_cEUR_USDCet.collateralAsset = address(usdcToken);
    pair_cEUR_USDCet.mentoExchange = crossProductExchange;
    pair_cEUR_USDCet.stableBucket = 10**24;
    pair_cEUR_USDCet.collateralBucket = 2 * 10**24;
    pair_cEUR_USDCet.bucketUpdateFrequency = 60 * 5;
    pair_cEUR_USDCet.lastBucketUpdate = now;
    pair_cEUR_USDCet.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cEUR_USDCet.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cEUR_USDCet.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cEUR_USDCet.minimumReports = 5;
    pair_cEUR_USDCet.minSupplyForStableBucketCap = 10**20;

    pair_cEUR_CELO_ID = pairManager.createPair(pair_cEUR_USDCet);
  */


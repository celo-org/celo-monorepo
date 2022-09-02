pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPricingModule } from "./IPricingModule.sol";

import { FixidityLib } from "../../common/FixidityLib.sol";

/**
 * @title Pair Manager Interface
 * @notice The pair manager is responsible for managing the state of all Mento virtual pairs.
 */
interface IPairManager {
  struct Pair {
    address asset0;
    address asset1;
    uint256 bucket0;
    uint256 bucket1;
    IPricingModule pricingModule;
    uint256 bucketUpdateFrequency;
    uint256 lastBucketUpdate;
    FixidityLib.Fraction spread;
    uint256 minimumReports;
    uint256 bucket0TargetSize;
    FixidityLib.Fraction bucket0MaxFraction;
    uint256 minSupplyForBucket0Cap;
  }

  /**
   * @notice Emitted when a new virtual pair has been created.
   * @param pairId The id of the newly created pair.
   * @param asset0 The address of asset0
   * @param asset1 The address of asset1
   * @param pricingModule the address of the pricingModule
   */
  event PairCreated(
    address indexed pairId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );

  /**
   * @notice Emitted when a virtual pair has been destroyed.
   * @param pairId The id of the newly created pair.
   * @param asset0 The address of asset0
   * @param asset1 The address of asset1
   */
  event PairDestroyed(address indexed pairId, address indexed asset0, address indexed asset1);

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
   * @param bucket0 The new bucket0 size
   * @param bucket1 The new bucket1 size
   */
  event BucketsUpdated(bytes32 pairId, uint256 bucket0, uint256 bucket1);

  /**
   * @notice Retrieves the pair with the specified pairId.
   * @param pairId The id of the pair to be retrieved.
   * @return pair The pair information.
   */
  function getPair(bytes32 pairId) external view returns (Pair memory pair);
}

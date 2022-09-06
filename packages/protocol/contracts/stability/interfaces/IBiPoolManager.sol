pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPricingModule } from "./IPricingModule.sol";

import { FixidityLib } from "../../common/FixidityLib.sol";

/**
 * @title BiPool Manager interface 
 * @notice The two asset pool manager is responsible for managing the state of all Mento virtual pools.
 */
interface IBiPoolManager {
  struct Pool {
    address asset0;
    address asset1;
    uint256 bucket0;
    uint256 bucket1;
    address oracleReportTarget; // can be a stable address or custom
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
   * @notice Emitted when a new virtual pool has been created.
   * @param poolId The id of the newly created pool.
   * @param asset0 The address of asset0
   * @param asset1 The address of asset1
   * @param pricingModule the address of the pricingModule
   */
  event PoolCreated(
    address indexed poolId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );

  /**
   * @notice Emitted when a virtual pool has been destroyed.
   * @param poolId The id of the newly created pool.
   * @param asset0 The address of asset0
   * @param asset1 The address of asset1
   */
  event PoolDestroyed(address indexed poolId, address indexed asset0, address indexed asset1);

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
   * @notice Emitted when the sortedOracles address is updated.
   * @param newSortedOracles The address of the new sortedOracles.
   */
  event SortedOraclesUpdated(address indexed newSortedOracles);

  /**
   * @notice Emitted when the buckets for a specified pool are updated.
   * @param poolId The id of the pool.
   * @param bucket0 The new bucket0 size
   * @param bucket1 The new bucket1 size
   */
  event BucketsUpdated(bytes32 indexed poolId, uint256 bucket0, uint256 bucket1);

  /**
   * @notice Retrieves the pool with the specified poolId.
   * @param poolId The id of the pool to be retrieved.
   * @return pool The pool information.
   */
  function getPool(bytes32 poolId) external view returns (Pool memory pool);
}

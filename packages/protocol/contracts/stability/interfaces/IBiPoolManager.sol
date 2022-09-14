pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPricingModule } from "./IPricingModule.sol";
import { FixidityLib } from "../../common/FixidityLib.sol";

/**
 * @title BiPool Manager interface 
 * @notice The two asset pool manager is responsible for 
 * managing the state of all two-asset virtual pools.
 */
interface IBiPoolManager {
  /** 
   * @title PoolExchange
   * @notice The PoolExchange is a type of asset exchange that
   * that implements an AMM with two virtual buckets.
   */
  struct PoolExchange {
    address asset0;
    address asset1;
    IPricingModule pricingModule;
    uint256 bucket0;
    uint256 bucket1;
    uint256 lastBucketUpdate;
    PoolConfig config;
  }

  /** 
   * @notice Variables related to bucket updates and sizing.
   * @dev Broken down into a separate struct because the compiler
   * version doesn't support structs with too many members. 
   * Sad reacts only.
   */
  struct PoolConfig {
    FixidityLib.Fraction spread;
    address oracleReportTarget; // can be a stable address or custom
    uint256 bucketUpdateFrequency;
    uint256 minimumReports;
    uint256 bucket0TargetSize;
    FixidityLib.Fraction bucket0MaxFraction;
    uint256 minSupplyForBucket0Cap;
  }

  /**
   * @notice Emitted when a new PoolExchange has been created.
   * @param exchangeId The id of the new PoolExchange
   * @param asset0 The address of asset0
   * @param asset1 The address of asset1
   * @param pricingModule the address of the pricingModule
   */
  event ExchangeCreated(
    bytes32 indexed exchangeId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );

  /**
   * @notice Emitted when a PoolExchange has been destroyed.
   * @param exchangeId The id of the PoolExchange
   * @param asset0 The address of asset0
   * @param asset1 The address of asset1
   * @param pricingModule the address of the pricingModule
   */
  event ExchangeDestroyed(
    bytes32 indexed exchangeId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
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
   * @notice Emitted when the sortedOracles address is updated.
   * @param newSortedOracles The address of the new sortedOracles.
   */
  event SortedOraclesUpdated(address indexed newSortedOracles);

  /**
   * @notice Emitted when the buckets for a specified exchange are updated.
   * @param exchangeId The id of the exchange
   * @param bucket0 The new bucket0 size
   * @param bucket1 The new bucket1 size
   */
  event BucketsUpdated(bytes32 indexed exchangeId, uint256 bucket0, uint256 bucket1);

  /**
   * @notice Retrieves the pool with the specified poolId.
   * @param exchangeId The id of the pool to be retrieved.
   * @return exchange The PoolExchange with that ID.
   */
  function getPoolExchange(bytes32 exchangeId) external view returns (PoolExchange memory exchange);

  /**
   * @notice Get all exchange IDs.
   * @return exchangeIds List of the exchangeIds.
   */
  function getExchangeIds() external view returns (bytes32[] memory exchangeIds);

  /**
   * @notice Create a PoolExchange with the provided data.
   * @param exchange The PoolExchange to be created.
   * @return exchangeId The id of the exchange.
   */
  function createExchange(PoolExchange calldata exchange) external returns (bytes32 exchangeId);

  /**
   * @notice Delete a PoolExchange.
   * @param exchangeId The PoolExchange to be created.
   * @param exchangeIdIndex The index of the exchangeId in the exchangeIds array.
   * @return destroyed - true on successful delition.
   */
  function destroyExchange(bytes32 exchangeId, uint256 exchangeIdIndex)
    external
    returns (bool destroyed);
}

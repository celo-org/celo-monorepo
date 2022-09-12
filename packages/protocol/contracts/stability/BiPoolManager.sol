pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { IExchangeManager } from "./interfaces/IExchangeManager.sol";
import { IBiPoolManager } from "./interfaces/IBiPoolManager.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { IPricingModule } from "./interfaces/IPricingModule.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";

import { StableToken } from "./StableToken.sol";

import { Initializable } from "../common/Initializable.sol";
import { FixidityLib } from "../common/FixidityLib.sol";

// TODO: Remove when migrating to mento-core. Newer versions of OZ-contracts have this interface
interface IERC20Metadata {
  function symbol() external view returns (string memory);
}

/**
 * @title BiPoolManager 
 * @notice An exchange manager that manages asset pools consisting of two assets
 */
contract BiPoolManager is IExchangeManager, IBiPoolManager, Initializable, Ownable {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  /* ==================== State Variables ==================== */

  // Address of the broker contract.
  address public broker;

  // Maps a pool id to the corresponding pool struct.
  // poolId is in the format "asset0Symbol:asset1Symbol:pricingModuleName"
  mapping(bytes32 => Pool) public pools;
  bytes32[] public poolIds;

  // Address of the Mento reserve contract
  IReserve public reserve;

  // Address of the Mento reserve contract
  ISortedOracles public sortedOracles;

  /* ==================== Constructor ==================== */

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Allows the contract to be upgradable via the proxy.
   * @param _broker The address of the broker contract.
   * @param _reserve The address of the reserve contract.
   */
  function initialize(address _broker, IReserve _reserve, ISortedOracles _sortedOracles)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setBroker(_broker);
    setReserve(_reserve);
    setSortedOracles(_sortedOracles);
  }

  /* ==================== Modifiers ==================== */

  modifier onlyBroker() {
    require(msg.sender == broker, "Caller is not the Broker");
    _;
  }

  /* ==================== View Functions ==================== */

  /**
   * @notice Get a pool from memory
   * @param poolId the pool id
   */
  function getPool(bytes32 poolId) public view returns (Pool memory pool) {
    pool = pools[poolId];
    require(pool.asset0 != address(0), "A pool with the specified id does not exist");
  }

  /**
   * @notice Get all pool Ids
   * @dev We don't expect the number of pools to grow to
   * astronomical values so this is safe gas-wise as is.
   */
  function getPoolIds() public view returns (bytes32[] memory) {
    return poolIds;
  }

  /**
   * @notice Get all pools (used by interfaces)
   * @dev We don't expect the number of pools to grow to
   * astronomical values so this is safe gas-wise as is.
   */
  function getPools() public view returns (Pool[] memory _pools) {
    for (uint256 i = 0; i < poolIds.length; i++) {
      _pools[i] = pools[poolIds[i]];
    }
  }

  /**
   * @notice Calculate amountOut of tokenOut received for a given amountIn of tokenIn
   * @param exchangeId The id of the exchange i.e Pool to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function getAmountOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    public
    returns (uint256)
  {
    Pool memory pool = getPool(exchangeId);
    return _getAmountOut(pool, tokenIn, tokenOut, amountIn);
  }

  /**
   * @notice Calculate amountIn of tokenIn for a given amountIn of tokenIn
   * @param exchangeId The id of the exchange i.e Pool to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function getAmountIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    public
    returns (uint256)
  {
    Pool memory pool = getPool(exchangeId);
    return _getAmountIn(pool, tokenIn, tokenOut, amountOut);
  }

  /* ==================== Mutative Functions ==================== */

  /**
   * @notice Sets the address of the broker contract.
   * @param _broker The new address of the broker contract.
   */
  function setBroker(address _broker) public onlyOwner {
    require(_broker != address(0), "Broker address must be set");
    broker = _broker;
    emit BrokerUpdated(_broker);
  }

  /**
   * @notice Sets the address of the reserve contract.
   * @param _reserve The new address of the reserve contract.
   */
  function setReserve(IReserve _reserve) public onlyOwner {
    require(address(_reserve) != address(0), "Reserve address must be set");
    reserve = _reserve;
    emit ReserveUpdated(address(_reserve));
  }

  /**
   * @notice Sets the address of the sortedOracles contract.
   * @param _sortedOracles The new address of the sorted oracles contract.
   */
  function setSortedOracles(ISortedOracles _sortedOracles) public onlyOwner {
    require(address(_sortedOracles) != address(0), "SortedOracles address must be set");
    sortedOracles = _sortedOracles;
    emit SortedOraclesUpdated(address(_sortedOracles));
  }

  /**
   * @notice Creates a new pool using the given parameters.
   * @param _pool The information required to create the pool.
   * @return poolId The id of the newly created pool.
   */
  function createPool(Pool calldata _pool) external onlyOwner returns (bytes32 poolId) {
    Pool memory pool = _pool;
    require(address(pool.pricingModule) != address(0), "pricingModule must be set");
    require(pool.asset0 != address(0), "asset0 must be set");
    require(pool.asset1 != address(0), "asset1 must be set");

    poolId = keccak256(
      abi.encodePacked(
        IERC20Metadata(pool.asset0).symbol(),
        IERC20Metadata(pool.asset1).symbol(),
        pool.pricingModule.name()
      )
    );
    require(
      pools[poolId].asset0 == address(0),
      "A pool with the specified assets and exchange exists"
    );

    validatePoolInfo(pool);
    (uint256 bucket0, uint256 bucket1) = getUpdatedBuckets(pool);

    pool.bucket0 = bucket0;
    pool.bucket1 = bucket1;

    pools[poolId] = pool;
    poolIds.push(poolId);

    emit PoolCreated(poolId, pool.asset0, pool.asset1, address(pool.pricingModule));
  }

  /**
   * @notice Destroys a pool with the given parameters if it exists and frees up
   *         the collateral and stable allocation it was using.
   * @param poolId the id of the pool to destroy
   * @param poolIdIndex The index of the poolId in the ids array
   * @return destroyed A boolean indicating whether or not the pool was successfully destroyed.
   */
  function destroyPool(bytes32 poolId, uint256 poolIdIndex)
    external
    onlyOwner
    returns (bool destroyed)
  {
    require(poolIdIndex < poolIds.length, "poolIdIndex not in range");
    require(poolIds[poolIdIndex] == poolId, "poolId at index doesn't match");
    Pool memory pool = pools[poolId];

    delete pools[poolId];
    poolIds[poolIdIndex] = poolIds[poolIds.length - 1];
    poolIds.pop();
    destroyed = true;

    emit PoolDestroyed(poolId, pool.asset0, pool.asset1, address(pool.pricingModule));
  }

  /**
   * @notice Execute a token swap with fixed amountIn
   * @param exchangeId The id of exchange, i.e. Pool to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    onlyBroker
    returns (uint256 amountOut)
  {
    Pool memory pool = getPool(exchangeId);
    bool bucketsUpdated;
    (pool, bucketsUpdated) = updateBucketsIfNecessary(exchangeId, pool);

    amountOut = _getAmountOut(pool, tokenIn, tokenOut, amountIn);
    executeSwap(exchangeId, pool, tokenIn, amountIn, amountOut, bucketsUpdated);
    return amountOut;
  }

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param exchangeId The id of exchange, i.e. Pool to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    external
    onlyBroker
    returns (uint256 amountIn)
  {
    Pool memory pool = getPool(exchangeId);
    bool bucketsUpdated;
    (pool, bucketsUpdated) = updateBucketsIfNecessary(exchangeId, pool);

    amountIn = _getAmountIn(pool, tokenIn, tokenOut, amountOut);
    executeSwap(exchangeId, pool, tokenIn, amountIn, amountOut, bucketsUpdated);
    return amountIn;
  }

  /* ==================== Private Functions ==================== */

  /**
   * @notice Execute a swap against the in memory pool and write
   * the new bucket sizes to storage.
   * @param poolId The id of the pool
   * @param pool The pool to operate on
   * @param tokenIn The token to be sold
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOut The amount of tokenOut to be bought
   * @param bucketsUpdated wether the buckets updated during the swap
   */
  function executeSwap(
    bytes32 poolId,
    Pool memory pool,
    address tokenIn,
    uint256 amountIn,
    uint256 amountOut,
    bool bucketsUpdated
  ) internal {
    if (tokenIn == pool.asset0) {
      pools[poolId].bucket0 = pool.bucket0 + amountIn;
      pools[poolId].bucket1 = pool.bucket1 - amountOut;
    } else {
      pools[poolId].bucket0 = pool.bucket0 - amountOut;
      pools[poolId].bucket1 = pool.bucket1 + amountIn;
    }
    // pools[poolId].lastBucketUpdate = pool.lastBucketUpdate;

    if (bucketsUpdated) {
      // solhint-disable-next-line not-rely-on-time
      pools[poolId].lastBucketUpdate = now;
    }
  }

  /**
   * @notice Calculate amountOut of tokenOut received for a given amountIn of tokenIn
   * @param pool The pool to operate on
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function _getAmountOut(Pool memory pool, address tokenIn, address tokenOut, uint256 amountIn)
    internal
    view
    returns (uint256)
  {
    require(
      (tokenIn == pool.asset0 && tokenOut == pool.asset1) ||
        (tokenIn == pool.asset1 && tokenOut == pool.asset0),
      "tokenIn and tokenOut must match pool"
    );

    if (tokenIn == pool.asset0) {
      return
        pool.pricingModule.getAmountOut(
          pool.bucket0,
          pool.bucket1,
          pool.config.spread.unwrap(),
          amountIn
        );
    } else {
      return
        pool.pricingModule.getAmountOut(
          pool.bucket1,
          pool.bucket0,
          pool.config.spread.unwrap(),
          amountIn
        );
    }
  }

  /**
   * @notice Calculate amountIn of tokenIn for a given amountIn of tokenIn
   * @param pool The pool to operate on
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function _getAmountIn(Pool memory pool, address tokenIn, address tokenOut, uint256 amountOut)
    internal
    view
    returns (uint256)
  {
    require(
      (tokenIn == pool.asset0 && tokenOut == pool.asset1) ||
        (tokenIn == pool.asset1 && tokenOut == pool.asset0),
      "tokenIn and tokenOut must match pool"
    );

    if (tokenIn == pool.asset0) {
      return
        pool.pricingModule.getAmountIn(
          pool.bucket0,
          pool.bucket1,
          pool.config.spread.unwrap(),
          amountOut
        );
    } else {
      return
        pool.pricingModule.getAmountIn(
          pool.bucket1,
          pool.bucket0,
          pool.config.spread.unwrap(),
          amountOut
        );
    }
  }

  /**
   * @notice If conditions are met, update the pool bucket sizes.
   * @dev This doesn't checkpoint the pool, just updates the in-memory one
   * so it should be used in a context that then checkpoints the pool.
   * @param poolId The id of the pool being updated.
   * @param pool The pool being updated.
   * @return poolAfter The updated pool.
   */
  function updateBucketsIfNecessary(bytes32 poolId, Pool memory pool)
    internal
    returns (Pool memory, bool updated)
  {
    updated = false;
    if (shouldUpdateBuckets(pool)) {
      (pool.bucket0, pool.bucket1) = getUpdatedBuckets(pool);
      updated = true;
      emit BucketsUpdated(poolId, pool.bucket0, pool.bucket1);
    }
    return (pool, updated);
  }

  /**
   * @notice Determine if a pool's buckets should be updated
   * based on staleness of buckets and oracle rates.
   * @param pool The pool being updated.
   * @return shouldUpdate
   */
  function shouldUpdateBuckets(Pool memory pool) internal view returns (bool) {
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(pool.config.oracleReportTarget);
    // solhint-disable-next-line not-rely-on-time
    bool timePassed = now >= pool.lastBucketUpdate.add(pool.config.bucketUpdateFrequency);
    bool enoughReports = (sortedOracles.numRates(pool.config.oracleReportTarget) >=
      pool.config.minimumReports);
    // solhint-disable-next-line not-rely-on-time
    bool medianReportRecent = sortedOracles.medianTimestamp(pool.config.oracleReportTarget) >
      now.sub(pool.config.bucketUpdateFrequency);
    return timePassed && enoughReports && medianReportRecent && !isReportExpired;
  }

  /**
   * @notice Calculate the new bucket sizes for a pool
   * @param pool The pool being updated.
   * @return bucket0 the size of bucket0
   * @return bucket1 the size of bucket1
   */
  function getUpdatedBuckets(Pool memory pool)
    internal
    view
    returns (uint256 bucket0, uint256 bucket1)
  {
    // TODO: Take max fraction/min supply in account when setting the bucket size
    bucket0 = pool.config.bucket0TargetSize;
    uint256 exchangeRateNumerator;
    uint256 exchangeRateDenominator;
    (exchangeRateNumerator, exchangeRateDenominator) = getOracleExchangeRate(
      pool.config.oracleReportTarget
    );

    bucket1 = exchangeRateDenominator.mul(bucket0).div(exchangeRateNumerator);
  }

  /**
   * @notice Get the exchange rate as numerator,denominator from sorted oracles
   * and protect in case of a 0-denominator.
   * @param target the reportTarget to read from SortedOracles
   * @return rateNumerator
   * @return rateDenominator
   */
  function getOracleExchangeRate(address target) internal view returns (uint256, uint256) {
    uint256 rateNumerator;
    uint256 rateDenominator;
    (rateNumerator, rateDenominator) = sortedOracles.medianRate(target);
    require(rateDenominator > 0, "exchange rate denominator must be greater than 0");
    return (rateNumerator, rateDenominator);
  }

  /**
   * @notice Valitates a virtual pool with the given information.
   * @param poolInfo The information on the virtual pool to be validated.
   * @return isValid A bool indicating whether or not the pool information provided is valid.
   */
  function validatePoolInfo(Pool memory poolInfo) private view {
    require(
      reserve.isStableAsset(poolInfo.asset0),
      "asset0 must be a stable registered with the reserve"
    );
    require(
      reserve.isStableAsset(poolInfo.asset1) || reserve.isCollateralAsset(poolInfo.asset1),
      "asset1 must be a stable or collateral registered with the reserve"
    );

    require(
      poolInfo.config.bucket0MaxFraction.unwrap() > 0,
      "bucket0MaxFraction must be greater than 0"
    );

    require(
      poolInfo.config.bucket0MaxFraction.lt(FixidityLib.fixed1()),
      "bucket0MaxFraction must be smaller than 1"
    );

    require(
      FixidityLib.lte(poolInfo.config.spread, FixidityLib.fixed1()),
      "Spread must be less than or equal to 1"
    );

    require(poolInfo.config.oracleReportTarget != address(0), "oracleReportTarget must be set");

    // TODO: Stable bucket max fraction should not exceed available stable bucket fraction.
    // TODO: minSupplyForStableBucketCap gt 0 & is there an aggregated value that needs to be checked

  }
}

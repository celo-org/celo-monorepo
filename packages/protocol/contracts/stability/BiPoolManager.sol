pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IExchangeManager } from "./interfaces/IExchangeManager.sol";
import { IBiPoolManager } from "./interfaces/IBiPoolManager.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { IPricingModule } from "./interfaces/IPricingModule.sol";

import { StableToken } from "./StableToken.sol";

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
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

  /* ==================== State Variables ==================== */

  // Address of the broker contract.
  address public broker;

  // Maps a pool id to the corresponding pool struct.
  // poolId is in the format "asset0Symbol:asset1Symbol:pricingModuleName"
  mapping(bytes32 => Pool) public pools;
  address[] public poolIds;

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
  function initilize(address _broker, IReserve _reserve, ISortedOracles _sortedOracles)
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
   * @notice Get all pools (used by interfaces)
   * @dev We don't expect the number of pools to grow to
   * astronomical values so this is safe gas-wise as is.
   */
  function getPools() public view returns (Pool[] memory _pools) {
    for (uint256 i = 0; i < poolIds.length; i++) {
      _pools[i] = pools[poolIds[i]];
    }
  }

  function quoteIn(bytes32 pairId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    returns (uint256 amountOut);

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
   * @param pool The information required to create the pool.
   * @return poolId The id of the newly created pool.
   */
  function createPool(Pool calldata pool) external onlyOwner returns (bytes32 poolId) {
    require(address(pool.pricingModule), "PricingModule must be set");
    require(pool.asset0 != address(0), "Asset0 must be set");
    require(pool.asset1 != address(0), "Asset1 must be set");

    poolId = keccak256(
      abi.encodePacked(
        IERC20Metadata(pool.asset0).symbol(),
        IERC20Metadata(pool.asset1).symbol(),
        poolInfo.pricingModule.name()
      )
    );
    require(
      pools[poolId].asset0 == address(0),
      "A pool with the specified assets and exchange exists"
    );

    validatePoolInfo(pool);
    (uint256 bucket0, uint256 bucket1) = getUpdatedBuckets(pool);

    pool.bucket0 = tokenInBucket;
    pool.bucket1 = tokenOutBucket;

    pools[poolId] = pool;
    poolIds.push(poolId);

    emit PoolCreated(pool.asset0, pool.asset1, address(pool.pricingModule), poolId);
  }

  /**
   * @notice Destroys a pool with the given parameters if it exists and frees up
   *         the collateral and stable allocation it was using.
   * @param asset0 The stable asset of the pool.
   * @param asset1 The collateral asset of the pool.
   * @return destroyed A boolean indicating whether or not the pool was successfully destroyed.
   */
  function destroyPool(bytes32 poolId, uint256 poolIdIndex)
    external
    onlyOwner
    returns (bool destroyed)
  {
    require(poolIds[poolIdIndex] == poolId);
    Pool memory pool = pools[poolId];

    require(
      pool.asset0 != address(0),
      "A pool with the specified assets and exchange does not exist"
    );

    delete pools[poolId];
    poolIds[poolIdsIndex] = poolIds[poolIds.length - 1];
    poolIds.pop();
    destroyed = true;

    emit PoolDestroyed(pool.asset0, asset1, address(mentoExchange));
  }

  /* ==================== Private Functions ==================== */

  function getUpdatedBuckets(Pool pool) private view returns (uint256 bucket0, uint256 bucket1) {
    // TODO: Take max fraction/min supply in account when setting the bucket size
    bucket0 = pool.bucket0TargetSize;
    uint256 exchangeRateNumerator;
    uint256 exchangeRateDenominator;
    (exchangeRateNumerator, exchangeRateDenominator) = getOracleExchangeRate(
      pool.oracleReportTarget
    );

    bucket1 = exchangeRateDenominator.mul(bucket0).div(exchangeRateNumerator);
  }

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
      reserve.isStableAsset(poolInfo.asset0) || reserve.isCollateralAsset(poolInfo.asset1),
      "asset1 mult be a stable or collateral registered with reserve"
    );

    require(poolInfo.bucket0MaxFraction.unwrap() > 0, "bucket0MaxFraction must be greater than 0");

    require(
      poolInfo.bucket0MaxFraction.lt(FixidityLib.fixed1()),
      "bucket0MaxFraction must be smaller than 1"
    );

    require(
      FixidityLib.lte(poolInfo.spread, FixidityLib.fixed1()),
      "Spread must be less than or equal to 1"
    );

    // TODO: Stable bucket max fraction should not exceed available stable bucket fraction.
    // TODO: minSupplyForStableBucketCap gt 0 & is there an aggregated value that needs to be checked

  }
}

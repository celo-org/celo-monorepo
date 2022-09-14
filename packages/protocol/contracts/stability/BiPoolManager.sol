pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { IExchangeProvider } from "./interfaces/IExchangeProvider.sol";
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
 * @title BiPoolExchangeManager 
 * @notice An exchange manager that manages asset exchanges consisting of two assets
 */
contract BiPoolManager is IExchangeProvider, IBiPoolManager, Initializable, Ownable {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  /* ==================== State Variables ==================== */

  // Address of the broker contract.
  address public broker;

  // Maps a exchange id to the corresponding PoolExchange struct.
  // exchangeId is in the format "asset0Symbol:asset1Symbol:pricingModuleName"
  mapping(bytes32 => PoolExchange) public exchanges;
  bytes32[] public exchangeIds;

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
   * @notice Get a PoolExchange from storage.
   * @param exchangeId the exchange id
   */
  function getPoolExchange(bytes32 exchangeId) public view returns (PoolExchange memory exchange) {
    exchange = exchanges[exchangeId];
    require(exchange.asset0 != address(0), "An exchange with the specified id does not exist");
  }

  /**
   * @notice Get all exchange IDs.
   * @return exchangeIds List of the exchangeIds.
   */
  function getExchangeIds() external view returns (bytes32[] memory) {
    return exchangeIds;
  }

  /**
   * @notice Get all exchanges (used by interfaces)
   * @dev We don't expect the number of exchanges to grow to
   * astronomical values so this is safe gas-wise as is.
   */
  function getExchanges() public view returns (Exchange[] memory _exchanges) {
    _exchanges = new Exchange[](exchangeIds.length);
    for (uint256 i = 0; i < exchangeIds.length; i++) {
      _exchanges[i].exchangeId = exchangeIds[i];
      _exchanges[i].assets = new address[](2);
      _exchanges[i].assets[0] = exchanges[exchangeIds[i]].asset0;
      _exchanges[i].assets[1] = exchanges[exchangeIds[i]].asset1;
    }
  }

  /**
   * @notice Calculate amountOut of tokenOut received for a given amountIn of tokenIn
   * @param exchangeId The id of the exchange i.e PoolExchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function getAmountOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    public
    returns (uint256)
  {
    PoolExchange memory exchange = getPoolExchange(exchangeId);
    return _getAmountOut(exchange, tokenIn, tokenOut, amountIn);
  }

  /**
   * @notice Calculate amountIn of tokenIn for a given amountIn of tokenIn
   * @param exchangeId The id of the exchange i.e PoolExchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function getAmountIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    public
    returns (uint256)
  {
    PoolExchange memory exchange = getPoolExchange(exchangeId);
    return _getAmountIn(exchange, tokenIn, tokenOut, amountOut);
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
   * @notice Creates a new exchange using the given parameters.
   * @param _exchange the PoolExchange to create.
   * @return exchangeId The id of the newly created exchange.
   */
  function createExchange(PoolExchange calldata _exchange)
    external
    onlyOwner
    returns (bytes32 exchangeId)
  {
    PoolExchange memory exchange = _exchange;
    require(address(exchange.pricingModule) != address(0), "pricingModule must be set");
    require(exchange.asset0 != address(0), "asset0 must be set");
    require(exchange.asset1 != address(0), "asset1 must be set");

    exchangeId = keccak256(
      abi.encodePacked(
        IERC20Metadata(exchange.asset0).symbol(),
        IERC20Metadata(exchange.asset1).symbol(),
        exchange.pricingModule.name()
      )
    );
    require(
      exchanges[exchangeId].asset0 == address(0),
      "An exchange with the specified assets and exchange exists"
    );

    validate(exchange);
    (uint256 bucket0, uint256 bucket1) = getUpdatedBuckets(exchange);

    exchange.bucket0 = bucket0;
    exchange.bucket1 = bucket1;

    exchanges[exchangeId] = exchange;
    exchangeIds.push(exchangeId);

    emit ExchangeCreated(
      exchangeId,
      exchange.asset0,
      exchange.asset1,
      address(exchange.pricingModule)
    );
  }

  /**
   * @notice Destroys a exchange with the given parameters if it exists and frees up
   *         the collateral and stable allocation it was using.
   * @param exchangeId the id of the exchange to destroy
   * @param exchangeIdIndex The index of the exchangeId in the ids array
   * @return destroyed A boolean indicating whether or not the exchange was successfully destroyed.
   */
  function destroyExchange(bytes32 exchangeId, uint256 exchangeIdIndex)
    external
    onlyOwner
    returns (bool destroyed)
  {
    require(exchangeIdIndex < exchangeIds.length, "exchangeIdIndex not in range");
    require(exchangeIds[exchangeIdIndex] == exchangeId, "exchangeId at index doesn't match");
    PoolExchange memory exchange = exchanges[exchangeId];

    delete exchanges[exchangeId];
    exchangeIds[exchangeIdIndex] = exchangeIds[exchangeIds.length - 1];
    exchangeIds.pop();
    destroyed = true;

    emit ExchangeDestroyed(
      exchangeId,
      exchange.asset0,
      exchange.asset1,
      address(exchange.pricingModule)
    );
  }

  /**
   * @notice Execute a token swap with fixed amountIn
   * @param exchangeId The id of exchange, i.e. PoolExchange to use
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
    PoolExchange memory exchange = getPoolExchange(exchangeId);
    bool bucketsUpdated;
    (exchange, bucketsUpdated) = updateBucketsIfNecessary(exchangeId, exchange);

    amountOut = _getAmountOut(exchange, tokenIn, tokenOut, amountIn);
    executeSwap(exchangeId, exchange, tokenIn, amountIn, amountOut, bucketsUpdated);
    return amountOut;
  }

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param exchangeId The id of exchange, i.e. PoolExchange to use
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
    PoolExchange memory exchange = getPoolExchange(exchangeId);
    bool bucketsUpdated;
    (exchange, bucketsUpdated) = updateBucketsIfNecessary(exchangeId, exchange);

    amountIn = _getAmountIn(exchange, tokenIn, tokenOut, amountOut);
    executeSwap(exchangeId, exchange, tokenIn, amountIn, amountOut, bucketsUpdated);
    return amountIn;
  }

  /* ==================== Private Functions ==================== */

  /**
   * @notice Execute a swap against the in memory exchange and write
   * the new bucket sizes to storage.
   * @param exchangeId The id of the exchange
   * @param exchange The exchange to operate on
   * @param tokenIn The token to be sold
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOut The amount of tokenOut to be bought
   * @param bucketsUpdated wether the buckets updated during the swap
   */
  function executeSwap(
    bytes32 exchangeId,
    PoolExchange memory exchange,
    address tokenIn,
    uint256 amountIn,
    uint256 amountOut,
    bool bucketsUpdated
  ) internal {
    if (tokenIn == exchange.asset0) {
      exchanges[exchangeId].bucket0 = exchange.bucket0 + amountIn;
      exchanges[exchangeId].bucket1 = exchange.bucket1 - amountOut;
    } else {
      exchanges[exchangeId].bucket0 = exchange.bucket0 - amountOut;
      exchanges[exchangeId].bucket1 = exchange.bucket1 + amountIn;
    }
    // exchanges[exchangeId].lastBucketUpdate = exchange.lastBucketUpdate;

    if (bucketsUpdated) {
      // solhint-disable-next-line not-rely-on-time
      exchanges[exchangeId].lastBucketUpdate = now;
    }
  }

  /**
   * @notice Calculate amountOut of tokenOut received for a given amountIn of tokenIn
   * @param exchange The exchange to operate on
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function _getAmountOut(
    PoolExchange memory exchange,
    address tokenIn,
    address tokenOut,
    uint256 amountIn
  ) internal view returns (uint256) {
    require(
      (tokenIn == exchange.asset0 && tokenOut == exchange.asset1) ||
        (tokenIn == exchange.asset1 && tokenOut == exchange.asset0),
      "tokenIn and tokenOut must match exchange"
    );

    if (tokenIn == exchange.asset0) {
      return
        exchange.pricingModule.getAmountOut(
          exchange.bucket0,
          exchange.bucket1,
          exchange.config.spread.unwrap(),
          amountIn
        );
    } else {
      return
        exchange.pricingModule.getAmountOut(
          exchange.bucket1,
          exchange.bucket0,
          exchange.config.spread.unwrap(),
          amountIn
        );
    }
  }

  /**
   * @notice Calculate amountIn of tokenIn for a given amountIn of tokenIn
   * @param exchange The exchange to operate on
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function _getAmountIn(
    PoolExchange memory exchange,
    address tokenIn,
    address tokenOut,
    uint256 amountOut
  ) internal view returns (uint256) {
    require(
      (tokenIn == exchange.asset0 && tokenOut == exchange.asset1) ||
        (tokenIn == exchange.asset1 && tokenOut == exchange.asset0),
      "tokenIn and tokenOut must match exchange"
    );

    if (tokenIn == exchange.asset0) {
      return
        exchange.pricingModule.getAmountIn(
          exchange.bucket0,
          exchange.bucket1,
          exchange.config.spread.unwrap(),
          amountOut
        );
    } else {
      return
        exchange.pricingModule.getAmountIn(
          exchange.bucket1,
          exchange.bucket0,
          exchange.config.spread.unwrap(),
          amountOut
        );
    }
  }

  /**
   * @notice If conditions are met, update the exchange bucket sizes.
   * @dev This doesn't checkpoint the exchange, just updates the in-memory one
   * so it should be used in a context that then checkpoints the exchange.
   * @param exchangeId The id of the exchange being updated.
   * @param exchange The exchange being updated.
   * @return exchangeAfter The updated exchange.
   */
  function updateBucketsIfNecessary(bytes32 exchangeId, PoolExchange memory exchange)
    internal
    returns (PoolExchange memory, bool updated)
  {
    updated = false;
    if (shouldUpdateBuckets(exchange)) {
      (exchange.bucket0, exchange.bucket1) = getUpdatedBuckets(exchange);
      updated = true;
      emit BucketsUpdated(exchangeId, exchange.bucket0, exchange.bucket1);
    }
    return (exchange, updated);
  }

  /**
   * @notice Determine if a exchange's buckets should be updated
   * based on staleness of buckets and oracle rates.
   * @param exchange The PoolExchange.
   * @return shouldUpdate
   */
  function shouldUpdateBuckets(PoolExchange memory exchange) internal view returns (bool) {
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(
      exchange.config.oracleReportTarget
    );
    // solhint-disable-next-line not-rely-on-time
    bool timePassed = now >= exchange.lastBucketUpdate.add(exchange.config.bucketUpdateFrequency);
    bool enoughReports = (sortedOracles.numRates(exchange.config.oracleReportTarget) >=
      exchange.config.minimumReports);
    // solhint-disable-next-line not-rely-on-time
    bool medianReportRecent = sortedOracles.medianTimestamp(exchange.config.oracleReportTarget) >
      now.sub(exchange.config.bucketUpdateFrequency);
    return timePassed && enoughReports && medianReportRecent && !isReportExpired;
  }

  /**
   * @notice Calculate the new bucket sizes for a exchange.
   * @param exchange The PoolExchange in context.
   * @return bucket0 The size of bucket0.
   * @return bucket1 The size of bucket1.
   */
  function getUpdatedBuckets(PoolExchange memory exchange)
    internal
    view
    returns (uint256 bucket0, uint256 bucket1)
  {
    // TODO: Take max fraction/min supply in account when setting the bucket size
    bucket0 = exchange.config.bucket0TargetSize;
    uint256 exchangeRateNumerator;
    uint256 exchangeRateDenominator;
    (exchangeRateNumerator, exchangeRateDenominator) = getOracleExchangeRate(
      exchange.config.oracleReportTarget
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
   * @notice Valitates a PoolExchange's parameters and configuration
   * @dev Reverts if not valid
   * @param exchange The PoolExchange to validate
   */
  function validate(PoolExchange memory exchange) private view {
    require(
      reserve.isStableAsset(exchange.asset0),
      "asset0 must be a stable registered with the reserve"
    );
    require(
      reserve.isStableAsset(exchange.asset1) || reserve.isCollateralAsset(exchange.asset1),
      "asset1 must be a stable or collateral registered with the reserve"
    );

    require(
      exchange.config.bucket0MaxFraction.unwrap() > 0,
      "bucket0MaxFraction must be greater than 0"
    );

    require(
      exchange.config.bucket0MaxFraction.lt(FixidityLib.fixed1()),
      "bucket0MaxFraction must be smaller than 1"
    );

    require(
      FixidityLib.lte(exchange.config.spread, FixidityLib.fixed1()),
      "Spread must be less than or equal to 1"
    );

    require(exchange.config.oracleReportTarget != address(0), "oracleReportTarget must be set");

    // TODO: Stable bucket max fraction should not exceed available stable bucket fraction.
    // TODO: minSupplyForStableBucketCap gt 0 & is there an aggregated value that needs to be checked

  }
}

pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPairManager } from "./interfaces/IPairManager.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { IMentoExchange } from "./interfaces/IMentoExchange.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { StableToken } from "./StableToken.sol";

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { Initializable } from "../common/Initializable.sol";
import { FixidityLib } from "../common/FixidityLib.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";

// TODO: Remove when migrating to mento-core. Newer versions of OZ-contracts have this interface
interface IERC20Metadata {
  function symbol() external view returns (string memory);
}

/**
 * @title PairManager
 * @notice The pair manager allows the creation of virtual pairs that are tradeable via Mento.
 */
contract PairManager is IPairManager, Initializable, Ownable, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  /* ==================== State Variables ==================== */

  // Address of the broker contract.
  address public broker;

  // Maps a pair id to the corresponding pair struct.
  // pairId is in the format "stableSymbol:collateralSymbol:exchangeName"
  mapping(bytes32 => Pair) public pairs;

  // Address of the Mento reserve contract
  IReserve public reserve;

  // TODO: Implement getPairs that takes in asset addresses & not exchange

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
  function initilize(address _broker, IReserve _reserve) external initializer {
    _transferOwnership(msg.sender);
    setBroker(_broker);
    setReserve(_reserve);
  }

  /* ==================== Modifiers ==================== */

  modifier onlyBroker() {
    require(msg.sender == broker, "Caller is not the Broker");
    _;
  }

  /* ==================== View Functions ==================== */

  function getPair(bytes32 pairId) public view returns (Pair memory pair) {
    pair = pairs[pairId];
    require(pair.stableAsset != address(0), "A pair with the specified id does not exist");
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
    if (
      shouldUpdateBuckets(
        pair.stableAsset,
        pair.bucketUpdateFrequency,
        pair.minimumReports,
        pair.lastBucketUpdate
      )
    ) {
      uint256 updatedCollateralBucket = getUpdatedCollateralBucket(
        pair.collateralAsset,
        pair.collateralBucketFraction
      );
      (uint256 exchangeRateNumerator, uint256 exchangeRateDenominator) = getOracleExchangeRate(
        address(pair.stableAsset)
      );
      uint256 updatedStableBucket = exchangeRateNumerator.mul(updatedCollateralBucket).div(
        exchangeRateDenominator
      );
      uint256 maxStableBucketSize = broker.getStableBucketCap(pair.stableAsset);
      // Check if the bucket is bigger that the cap
      if (updatedStableBucket > maxStableBucketSize) {
        // Resize down CA bucket
        uint256 cappedUpdatedCollateralBucket = exchangeRateDenominator
          .mul((maxStableBucketSize))
          .div(exchangeRateNumerator);
        return (cappedUpdatedCollateralBucket, maxStableBucketSize);
      }
      return (updatedCollateralBucket, updatedStableBucket);
    }
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
   * @notice Creates a new pair using the given parameters.
   * @param pair The information required to create the pair.
   * @return pairId The id of the newly created pair.
   */
  function createPair(Pair calldata pair) external onlyOwner returns (bytes32 pairId) {
    require(address(pair.mentoExchange) != address(0), "Mento exchange must be set");
    require(address(pair.stableAsset) != address(0), "Stable asset must be set");
    require(address(pair.collateralAsset) != address(0), "Collateral asset must be set");

    Pair memory pairInfo = pair;

    pairId = keccak256(
      abi.encodePacked(
        IERC20Metadata(pairInfo.stableAsset).symbol(),
        IERC20Metadata(pairInfo.collateralAsset).symbol(),
        pairInfo.mentoExchange.name()
      )
    );
    require(
      pairs[pairId].stableAsset == address(0),
      "A pair with the specified assets and exchange exists"
    );

    validatePairInfo(pairInfo);

    // TODO: getUpdatedBuckets Function sig should change. May not need amounts
    // but instead pass minSupplyForStableBucketCap & stableBucketMaxFraction
    (uint256 tokenInBucket, uint256 tokenOutBucket) = pairInfo.mentoExchange.getUpdatedBuckets(
      pairInfo.stableAsset,
      pairInfo.collateralAsset,
      0,
      0,
      pairId
    );

    pairInfo.stableBucket = tokenInBucket;
    pairInfo.collateralBucket = tokenOutBucket;

    pairs[pairId] = pairInfo;

    emit PairCreated(
      pairInfo.stableAsset,
      pairInfo.collateralAsset,
      address(pairInfo.mentoExchange),
      pairId
    );
  }

  /**
   * @notice Destroys a pair with the given parameters if it exists and frees up
   *         the collateral and stable allocation it was using.
   * @param stableAsset The stable asset of the pair.
   * @param collateralAsset The collateral asset of the pair.
   * @return destroyed A boolean indicating whether or not the pair was successfully destroyed.
   */
  function destroyPair(address stableAsset, address collateralAsset, IMentoExchange mentoExchange)
    external
    onlyOwner
    returns (bool destroyed)
  {
    require(stableAsset != address(0), "Stable asset address must be specified");
    require(collateralAsset != address(0), "Collateral asset address must be specified");

    bytes32 pairId = keccak256(
      abi.encodePacked(
        IERC20Metadata(stableAsset).symbol(),
        IERC20Metadata(collateralAsset).symbol(),
        mentoExchange.name()
      )
    );

    Pair memory pair = pairs[pairId];

    require(
      pair.stableAsset != address(0),
      "A pair with the specified assets and exchange does not exist"
    );

    delete pairs[pairId];
    destroyed = true;

    emit PairDestroyed(stableAsset, collateralAsset, address(mentoExchange));
  }

  /**
   * @notice Updates the bucket sizes for the virtual pair with the specified pairId.
   * @param pairId The id of the pair to be updated.
   * @param stableBucket The new stable bucket size.
   * @param collateralBucket The new collateral bucket size.
   */
  function updateBuckets(bytes32 pairId, uint256 stableBucket, uint256 collateralBucket)
    external
    onlyBroker
  {
    Pair memory pair = getPair(pairId);
    pair.collateralBucket = collateralBucket;
    pair.stableBucket = stableBucket;

    pairs[pairId] = pair;

    // TODO: Emit asset addresses & exchange
    emit BucketsUpdated(pairId, collateralBucket, stableBucket);
  }

  /* ==================== Private Functions ==================== */

  /**
   * @notice Valitates a virtual pair with the given information.
   * @param pairInfo The information on the virtual pair to be validated.
   * @return isValid A bool indicating whether or not the pair information provided is valid.
   */
  function validatePairInfo(Pair memory pairInfo) private view {
    require(
      reserve.isStableAsset(pairInfo.stableAsset),
      "Stable asset specified is not registered with reserve"
    );
    require(
      reserve.isCollateralAsset(pairInfo.collateralAsset),
      "Collateral asset specified is not registered with reserve"
    );
    require(
      pairInfo.collateralBucketFraction.lt(FixidityLib.fixed1()),
      "Collateral asset fraction must be smaller than 1"
    );

    require(
      pairInfo.stableBucketMaxFraction.unwrap() > 0,
      "Stable bucket fraction must be greater than 0"
    );

    require(
      pairInfo.stableBucketMaxFraction.lt(FixidityLib.fixed1()),
      "Stable bucket fraction must be smaller than 1"
    );

    require(
      FixidityLib.lte(pairInfo.spread, FixidityLib.fixed1()),
      "Spread must be less than or equal to 1"
    );

    // TODO: Stable bucket max fraction should not exceed available stable bucket fraction.
    // TODO: minSupplyForStableBucketCap gt 0 & is there an aggregated value that needs to be checked

  }

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

  /**
   * @notice Returns the size of the collateral bucket to be set during an update.
   * @param collateralAsset The address of the collateral asset.
   * @param collateralFraction The fraction of the reserve collateral that is allocated to the pair when updating buckets.
   * @return Returns the new size of the collateral bucket.
   */
  function getUpdatedCollateralBucket(
    address collateralAsset,
    FixidityLib.Fraction memory collateralFraction
  ) private view returns (uint256) {
    uint256 reserveCollateralBalance = getReserve().getReserveAddressesCollateralAssetBalance(
      collateralAsset
    );
    return collateralFraction.multiply(FixidityLib.newFixed(reserveCollateralBalance)).fromFixed();
  }

  /**
   * @notice Retrieves the oracle exchange rate for a given stable asset.
   * @param stable The address of the stable to retrieve the exchange rate for.
   * @return Returns the exchange rate and the rate denominator.
   */
  function getOracleExchangeRate(address stable) private view returns (uint256, uint256) {
    uint256 medianRate;
    uint256 numRates;
    (medianRate, numRates) = ISortedOracles(registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID))
      .medianRate(stable);
    require(numRates > 0, "exchange rate denominator must be greater than 0");
    return (medianRate, numRates);
  }
}

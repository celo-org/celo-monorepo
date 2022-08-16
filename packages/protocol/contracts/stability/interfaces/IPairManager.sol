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
    address mentoExchange; // TODO: Switch to IMentoExchange after merge
    uint256 stableBucket;
    uint256 collateralBucket;
    uint256 bucketUpdateFrequency;
    uint256 lastBucketUpdate;
    FixidityLib.Fraction reserveCollateralFraction;
    FixidityLib.Fraction spread;
    FixidityLib.Fraction stableBucketMaxFraction;
    uint256 minimumReports;
    uint256 minSupplyForStableBucketCap;
    bytes32 stableTokenRegistryId;
  }

  /**
   * @notice Retrieves the pair with the specified pairId.
   * @param pairId The id of the pair to be retrieved.
   * @return found A boolean indicating whether a pair with the given pairId was found.
   * @return pair The pair information.
   */
  function getPair(bytes32 pairId) external view returns (bool found, Pair memory pair);
}

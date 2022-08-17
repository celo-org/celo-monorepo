pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPairManager } from "./interfaces/IPairManager.sol";
import { IReserve } from "./interfaces/IReserve.sol";

import { StableToken } from "./StableToken.sol";

import { UsingRegistry } from "../common/UsingRegistry.sol";
import { Initializable } from "../common/Initializable.sol";
import { FixidityLib } from "../common/FixidityLib.sol";

/**
 * @title PairManager
 * @notice The pair manager allows the creation of virtual pairs that are tradeable via Mento.
 */
contract PairManager is IPairManager, Initializable, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /* ==================== State Variables ==================== */

  // Maps a pair id to the corresponding pair struct.
  // pairId is in the format "stableSymbol:collateralSymbol:exchangeName"
  mapping(bytes32 => Pair) public pairs;
  // Tracks whether or not a pair with the given pairId exists.
  mapping(bytes32 => bool) public isPair;

  // Tracks the total fraction of reserve collateral
  // that has been allocated to existing virtual pairs.
  mapping(address => FixidityLib.Fraction) public allocatedCollateralFractions;

  // TODO: Confirm total allocations with Nadiem
  // Tracks the total fraction of reserve stable that has been allocated to existing virtual pairs.
  mapping(address => FixidityLib.Fraction) public allocatedStableFractions;

  /* ==================== Constructor ==================== */

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Allows the contract to be upgradable via the proxy.
   */
  function initilize() external initializer {
    _transferOwnership(msg.sender);
  }

  /* ==================== Restricted Functions ==================== */

  /**
   * @notice Creates a new pair using the given parameters.
   * @param pairInfo The information required to create the pair.
   * @return pairId The id of the newly created pair.
   */
  function createPair(Pair calldata pairInfo) external onlyOwner returns (bytes32 pairId) {
    validatePairInfo(pairInfo);

    // TODO: Erc20 does not have definition for symbol
    // TODO: Need IMentoExchange.name()
    pairId = keccak256(abi.encodePacked(StableToken(pairInfo.stableAsset).symbol(), ":"));
    require(!isPair[pairId], "A pair with the specified assets and exchange exists");

    // Initilize buckets
    // TODO: Add call to
    // IMentoExchange.getUpdatedBuckets()
    // (uint256 newStableBucket, uint256 newCollateralBucket) = IMentoExchange(pairInfo.mentoExchange).getUpdatedBuckets(...);
    // pairInfo.stableBucket = newStableBucket;
    // pairInfo.collateralBucket = newCollateralBucket;

    pairs[pairId] = pairInfo;
    isPair[pairId] = true;
    emit PairCreated(pairInfo.stableAsset, pairInfo.collateralAsset, pairInfo.mentoExchange);
  }

  /**
   * @notice Valitates a virtual pair with the given information.
   * @param pairInfo The information on the virtual pair to be validated.
   * @return isValid A bool indicating whether or not the pair information provided is valid.
   */
  function validatePairInfo(Pair memory pairInfo) private returns (bool isValid) {
    IReserve reserve = IReserve(registry.getAddressForOrDie(RESERVE_REGISTRY_ID));

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
      pairInfo.collateralBucketFraction.lt(
        getAvailableCollateralFraction(pairInfo.collateralAsset)
      ),
      "Collateral asset fraction must be less than available collateral fraction"
    );
    require(pairInfo.mentoExchange != address(0), "Mento exchange must be set");

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

    isValid = true; //TODO: Necessary?
  }

  /* ==================== Private Functions ==================== */

  /**
   * @notice Retrieve the availble fraction of the reserve collateral that can be allocated to a virtual pair.
   * @param collateralAsset The address of the collateral asset.
   * @return availableFraction The available fraction that can be allocated to a pair with the specified collateral asset.
   */
  function getAvailableCollateralFraction(address collateralAsset)
    private
    returns (FixidityLib.Fraction memory availableFraction)
  {
    return FixidityLib.fixed1().subtract(allocatedCollateralFractions[collateralAsset]);
  }

  /**
   * @notice Retrieve the availble fraction of the reserve stable assets that can be allocated to a virtual pair.
   * @param stableAsset The address of the stable asset.
   * @return availableFraction The available fraction that can be allocated to a pair with the specified collateral asset.
   */
  function getAvailableStableFraction(address stableAsset)
    private
    returns (FixidityLib.Fraction memory availableFraction)
  {
    return FixidityLib.fixed1().subtract(allocatedStableFractions[stableAsset]);
  }
}

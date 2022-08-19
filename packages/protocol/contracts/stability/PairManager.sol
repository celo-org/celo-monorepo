pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPairManager } from "./interfaces/IPairManager.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { IMentoExchange } from "./interfaces/IMentoExchange.sol";

import { StableToken } from "./StableToken.sol";

import { UsingRegistry } from "../common/UsingRegistry.sol";
import { Initializable } from "../common/Initializable.sol";
import { FixidityLib } from "../common/FixidityLib.sol";

// TODO: Remove when migrating to mento-core. Newer versions of OZ-contracts have this interface
interface IERC20Metadata {
  function symbol() external view returns (string memory);
}

/**
 * @title PairManager
 * @notice The pair manager allows the creation of virtual pairs that are tradeable via Mento.
 */
contract PairManager is IPairManager, Initializable, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /* ==================== State Variables ==================== */

  // Address of the broker contract.
  address broker;

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
   * @param _broker The address of the broker contract.
   */
  function initilize(address _broker) external initializer {
    _transferOwnership(msg.sender);
    setBroker(_broker);
  }

  modifier onlyBroker() {
    require(msg.sender == broker, "Caller is not the Broker");
    _;
  }

  /* ==================== Restricted Functions ==================== */

  /**
   * @notice Sets the address of the broker contract.
   * @param _broker The new address of the broker contract.
   */
  function setBroker(address _broker) public onlyOwner {
    require(_broker != address(0), "Broker address must be set");
    _broker = broker;
    emit BrokerUpdated(_broker);
  }

  /**
   * @notice Creates a new pair using the given parameters.
   * @param pair The information required to create the pair.
   * @return pairId The id of the newly created pair.
   */
  function createPair(Pair calldata pair) external onlyOwner returns (bytes32 pairId) {
    Pair memory pairInfo = pair;

    validatePairInfo(pairInfo);

    // TODO: OZ Erc20 does not have definition for symbol -____-
    pairId = keccak256(
      abi.encodePacked(
        IERC20Metadata(pairInfo.stableAsset).symbol(),
        IERC20Metadata(pairInfo.collateralAsset).symbol(),
        pairInfo.mentoExchange.name()
      )
    );
    require(!isPair[pairId], "A pair with the specified assets and exchange exists");

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

    // Update allocated collateral fraction
    allocatedCollateralFractions[pairInfo.collateralAsset] = allocatedCollateralFractions[pairInfo
      .collateralAsset]
      .add(pairInfo.collateralBucketFraction);

    // Update allocated stable bucket fraction
    allocatedStableFractions[pairInfo.stableAsset] = allocatedStableFractions[pairInfo.stableAsset]
      .add(pairInfo.stableBucketMaxFraction);

    pairs[pairId] = pairInfo;
    isPair[pairId] = true;

    emit PairCreated(
      pairInfo.stableAsset,
      pairInfo.collateralAsset,
      address(pairInfo.mentoExchange)
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
    require(isPair[pairId], "A pair with the specified assets and exchange does not exist");

    Pair memory pair = pairs[pairId];

    // Update allocated collateral fraction
    allocatedCollateralFractions[pair.collateralAsset] = allocatedCollateralFractions[pair
      .collateralAsset]
      .subtract(pair.collateralBucketFraction);

    // Update allocated stable bucket fraction
    allocatedStableFractions[pair.stableAsset] = allocatedStableFractions[pair.stableAsset]
      .subtract(pair.stableBucketMaxFraction);

    isPair[pairId] = false;
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
    require(isPair[pairId], "A pair with the specified id does not exist");

    Pair memory pair = pairs[pairId];
    pair.collateralBucket = collateralBucket;
    pair.stableBucket = stableBucket;

    pairs[pairId] = pair;

    // TODO: Emit asset addresses & exchange
    emit BucketsUpdated(pairId, collateralBucket, stableBucket);
  }

  /* ==================== View Functions ==================== */

  function getPair(bytes32 pairId) external view returns (Pair memory pair) {
    require(isPair[pairId], "A pair with the specified id does not exist");
    pair = pairs[pairId];
  }

  /* ==================== Private Functions ==================== */

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
    require(address(pairInfo.mentoExchange) != address(0), "Mento exchange must be set");

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

pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPairManager } from "./interfaces/deprecate/IPairManager.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { IMentoExchange } from "./interfaces/deprecate/IMentoExchange.sol";

import { StableToken } from "./StableToken.sol";

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
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
contract PairManager is IPairManager, Initializable, Ownable {
  using FixidityLib for FixidityLib.Fraction;

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
  function initialize(address _broker, address _reserve) external initializer {
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
  function setReserve(address _reserve) public onlyOwner {
    require(address(_reserve) != address(0), "Reserve address must be set");
    reserve = IReserve(_reserve);
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

    // // TODO: getUpdatedBuckets Function sig should change. May not need amounts
    // // but instead pass minSupplyForStableBucketCap & stableBucketMaxFraction
    // (uint256 tokenInBucket, uint256 tokenOutBucket) = pairInfo.mentoExchange.getUpdatedBuckets(
    //   0,
    //   0,
    //   0,
    //   0,
    // );

    // pairInfo.stableBucket = tokenInBucket;
    // pairInfo.collateralBucket = tokenOutBucket;

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
}

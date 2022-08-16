pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { IPairManager } from "./interfaces/IPairManager.sol";

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

  // Maps a pair id to the corresponding pair.
  // pairId is in the format "stableSymbol:collateralSymbol:exchangeName"
  mapping(bytes32 => Pair) public pairs;

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

  // TODO: Create function overload with minimal parms

  /**
   * @notice Creates a new virtual pair using the given parameters.
   * @param pairInfo The info
   */
  function createPair(Pair calldata pairInfo) external onlyOwner returns (bytes32 pairId) {}
}

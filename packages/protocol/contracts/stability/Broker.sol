pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { IPairManager } from "./interfaces/IPairManager.sol";
import { IBroker } from "./interfaces/IBroker.sol";
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
 * @title Broker
 * @notice The broker executes swaps and keeps track of spending limits per pair
 */
contract Broker is IBroker, Initializable, Ownable {
  using FixidityLib for FixidityLib.Fraction;

  /* ==================== State Variables ==================== */

  // Address of the broker contract.
  IPairManager public pairManager;

  // Address of the reserve.
  IReserve public reserve;

  /* ==================== Constructor ==================== */

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Allows the contract to be upgradable via the proxy.
   * @param _broker The address of the broker contract.
   * @param registryAddress The address of the Celo registry.
   */
  function initilize(address _pairManager, address _registry) external initializer {
    _transferOwnership(msg.sender);
    setPairManager(registryAddress);
    setRegistry(_broker);
  }

  /* ==================== View Functions ==================== */

  function quote(bytes32 pairId, address tokenIn, uint256 amountIn)
    external
    view
    returns (address tokenOut, uint256 amountOut)
  {
    Pair memory pair = pairManager.getPair(pairId);

    require(
      tokenIn == pair.stableAsset || tokenIn == pair.collateralAsset,
      "tokenIn is not in the pair"
    );

    if (pair.stableAsset == tokenIn) {
      tokenOut = pair.collateralAsset;
      amountOut = pair.exchange.getAmountOut(
        tokenIn,
        tokenOut,
        pair.stableBucket,
        pair.collateralBucket,
        amountIn
      );
    } else {
      tokenOut = pair.stableAsset;
      amountOut = pair.exchange.getAmountOut(
        tokenIn,
        tokenOut,
        pair.collateralBucket,
        pair.stableBucket,
        amountIn
      );
    }
  }

  /* ==================== Mutative Functions ==================== */

  function swap(bytes32 pairId, address tokenIn, uint256 amountIn, uint256 amountOutMin)
    external
    view
    returns (address tokenOut, uint256 amountOut)
  {
    (address tokenOut, uint256 amountOut) = quote(pairId, tokenIn, amountIn);
    require(amountOut < amountOutMin, "slippage to low");

    // TODO: adjust bucket
    if (tokenIn == pair.stableAsset) {
      IERC20(tokenIn).transferFrom(msg.sender, amountIn, address(this));
      IERC20(tokenIn).burn(amountIn);
      reserve.transferToken(tokenOut, msg.sender, amountOut);
    } else {
      IERC20(tokenIn).transferFrom(msg.sender, amountIn, address(reserve));
      IERC20(tokenOut).mint(msg.sender, amountOut);
    }
  }
}

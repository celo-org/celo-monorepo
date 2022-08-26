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
  function initilize(address _pairManager, address _reserve) external initializer {
    _transferOwnership(msg.sender);
    setPairManager(_pairManager);
    setReserve(_reserve);
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

  /**
   * @notice Update the PairManager address
   * @dev only callable by owner
   * @param _pairManager The new pair manager address
   */
  function setPairManager(address _pairManager) external onlyOwner {
    emit PairManagerUpdated(_pairManager, address(pairManager));
    pairManager = PairManager(_pairManager);
  }

  /**
   * @notice Update the PairManager address
   * @dev only callable by owner
   * @param _reserve The new pair manager address
   */
  function setReserve(address _reserve) external onlyOwner {
    emit ReserveUpdated(_reserve, address(reserve));
    reserve = Reserve(_reserve);
  }

  /**
   * @notice Execute a token swap
   * @param pairId The id of the pair to be swapped
   * @param tokenIn The address of the token to be sold
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return tokenOut The token to be bought 
   * @return amountOut The amount of tokenOut to be bought
   */
  function swap(bytes32 pairId, address tokenIn, uint256 amountIn, uint256 amountOutMin)
    external
    view
    returns (address tokenOut, uint256 amountOut)
  {
    (address tokenOut, uint256 amountOut) = quote(pairId, tokenIn, amountIn);
    require(amountOut < amountOutMin, "amountOutMin not met");

    uint256 nextStableBucket;
    uint256 nextCollateralBucket;

    if (tokenIn == pair.stableAsset) {
      IERC20(tokenIn).transferFrom(msg.sender, amountIn, address(this));
      IERC20(tokenIn).burn(amountIn);
      reserve.transferToken(tokenOut, msg.sender, amountOut);
      nextStableBucket = pair.stableBucket + amountIn;
      nextCollateralBucket = pair.collateralBucket - tokenOut;
    } else {
      IERC20(tokenIn).transferFrom(msg.sender, amountIn, address(reserve));
      IERC20(tokenOut).mint(msg.sender, amountOut);
      nextStableBucket = pair.stableBucket - amountIn;
      nextCollateralBucket = pair.collateralBucket + tokenOut;
    }

    pairManager.updateBuckets(pairId, nextStableBucket, nextCollateralBucket);
    emit Swap(pairId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
  }
}

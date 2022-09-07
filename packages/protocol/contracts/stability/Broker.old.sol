pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { IPairManager } from "./interfaces/deprecate/IPairManager.sol";
import { IBroker } from "./interfaces/deprecate/IBroker.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { IMentoExchange } from "./interfaces/deprecate/IMentoExchange.sol";

import { StableToken } from "./StableToken.sol";

import { Initializable } from "../common/Initializable.sol";
import { IStableToken } from "./interfaces/IStableToken.sol";

/**
 * @title Broker
 * @notice The broker executes swaps and keeps track of spending limits per pair
 */
contract Broker is IBroker, Initializable, Ownable {
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
   * @param _pairManager The address of the PairManager contract.
   * @param _reserve The address of the Rezerve contract.
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
    (tokenOut, amountOut, , , ) = _quote(pairId, tokenIn, amountIn);
  }

  /* ==================== Mutative Functions ==================== */

  /**
   * @notice Update the PairManager address
   * @dev only callable by owner
   * @param _pairManager The new pair manager address
   */
  function setPairManager(address _pairManager) public onlyOwner {
    require(_pairManager != address(0), "PairManager address must be set");
    emit PairManagerUpdated(_pairManager, address(pairManager));
    pairManager = IPairManager(_pairManager);
  }

  /**
   * @notice Update the PairManager address
   * @dev only callable by owner
   * @param _reserve The new pair manager address
   */
  function setReserve(address _reserve) public onlyOwner {
    require(_reserve != address(0), "Reserve address must be set");
    emit ReserveUpdated(_reserve, address(reserve));
    reserve = IReserve(_reserve);
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
    returns (address tokenOut, uint256 amountOut)
  {
    uint256 nextTokenInBucketSize;
    uint256 nextTokenOutBucketSize;
    bool tokenInIsStable;

    (tokenOut, amountOut, nextTokenInBucketSize, nextTokenOutBucketSize, tokenInIsStable) = _quote(
      pairId,
      tokenIn,
      amountIn
    );

    require(amountOutMin <= amountOut, "amountOutMin not met");
    emit Swap(pairId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);

    if (tokenInIsStable) {
      IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
      IStableToken(tokenIn).burn(amountIn);
      reserve.transferCollateralAsset(tokenOut, msg.sender, amountOut);
      pairManager.updateBuckets(pairId, nextTokenInBucketSize, nextTokenOutBucketSize);
    } else {
      IERC20(tokenIn).transferFrom(msg.sender, address(reserve), amountIn);
      IStableToken(tokenOut).mint(msg.sender, amountOut);
      pairManager.updateBuckets(pairId, nextTokenOutBucketSize, nextTokenInBucketSize);
    }
  }

  /* ==================== Private Functions ==================== */

  function _quote(bytes32 pairId, address tokenIn, uint256 amountIn)
    internal
    view
    returns (
      address tokenOut,
      uint256 amountOut,
      uint256 nextTokenInBucketSize,
      uint256 nextTokenOutBucketSize,
      bool tokenInIsStable
    )
  {
    IPairManager.Pair memory pair = pairManager.getPair(pairId);

    require(
      tokenIn == pair.stableAsset || tokenIn == pair.collateralAsset,
      "tokenIn is not in the pair"
    );

    if (pair.stableAsset == tokenIn) {
      tokenInIsStable = true;
      tokenOut = pair.collateralAsset;
      (amountOut, nextTokenInBucketSize, nextTokenOutBucketSize) = pair.mentoExchange.getAmountOut(
        tokenIn,
        tokenOut,
        pair.stableBucket,
        pair.collateralBucket,
        amountIn
      );
    } else {
      tokenOut = pair.stableAsset;
      (amountOut, nextTokenInBucketSize, nextTokenOutBucketSize) = pair.mentoExchange.getAmountOut(
        tokenIn,
        tokenOut,
        pair.collateralBucket,
        pair.stableBucket,
        amountIn
      );
    }
  }
}

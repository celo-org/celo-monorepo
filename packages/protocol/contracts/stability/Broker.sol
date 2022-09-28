// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IExchangeProvider } from "./interfaces/IExchangeProvider.sol";
import { IBroker } from "./interfaces/IBroker.sol";
import { IBrokerAdmin } from "./interfaces/IBrokerAdmin.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { Initializable } from "../common/Initializable.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { IStableToken } from "./interfaces/IStableToken.sol";
import { TradingLimits } from "./libraries/TradingLimits.sol";

import { console2 as console } from "forge-std/console2.sol";

/**
 * @title Broker
 * @notice The broker executes swaps and keeps track of spending limits per pair
 */
contract Broker is IBroker, IBrokerAdmin, Initializable, Ownable {
  using TradingLimits for TradingLimits.Counts;
  /* ==================== State Variables ==================== */

  address[] exchangeProviders;
  mapping(address => bool) public isExchangeProvider;
  /**
   * @dev tradingLimits are encoded in two uint256 values using the TradingLimits library
   */
  mapping(bytes32 => uint256[2]) tradingLimits;

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
   * @param _exchangeProviders The addresses of the ExchangeProvider contracts.
   * @param _reserve The address of the Reserve contract.
   */
  function initialize(address[] calldata _exchangeProviders, address _reserve)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    for (uint256 i = 0; i < _exchangeProviders.length; i++) {
      addExchangeProvider(_exchangeProviders[i]);
    }
    setReserve(_reserve);
  }

  /* ==================== Mutative Functions ==================== */

  /**
   * @notice Add exchange manager
   * @param exchangeProvider The address of the exchange manager to add
   * @return index The index where it was inserted
   */
  function addExchangeProvider(address exchangeProvider) public onlyOwner returns (uint256 index) {
    require(!isExchangeProvider[exchangeProvider], "ExchangeProvider already exists in the list");
    require(exchangeProvider != address(0), "ExchangeProvider address can't be 0");
    exchangeProviders.push(exchangeProvider);
    isExchangeProvider[exchangeProvider] = true;
    emit ExchangeProviderAdded(exchangeProvider);
    return index = exchangeProviders.length - 1;
  }

  /**
   * @notice Remove an exchange manager at an index
   * @param exchangeProvider The address of the exchange manager to remove
   * @param index The index in the exchange managers array
   * @return bool returns true if successful
   */
  function removeExchangeProvider(address exchangeProvider, uint256 index) public onlyOwner {
    require(
      index < exchangeProviders.length && exchangeProviders[index] == exchangeProvider,
      "index into exchangeProviders list not mapped to token"
    );
    exchangeProviders[index] = exchangeProviders[exchangeProviders.length - 1];
    exchangeProviders.pop();
    delete isExchangeProvider[exchangeProvider];
    emit ExchangeProviderRemoved(exchangeProvider);
  }

  /**
   * @notice Set the Mento reserve address
   * @param _reserve The Mento reserve address
   */
  function setReserve(address _reserve) public onlyOwner {
    require(_reserve != address(0), "Reserve address must be set");
    emit ReserveSet(_reserve, address(reserve));
    reserve = IReserve(_reserve);
  }

  /**
   * @notice Calculate amountIn of tokenIn for a given amountIn of tokenIn
   * @param exchangeProvider the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function getAmountIn(
    address exchangeProvider,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut
  ) external returns (uint256 amountIn) {
    require(isExchangeProvider[exchangeProvider], "ExchangeProvider does not exist");
    return
      amountIn = IExchangeProvider(exchangeProvider).getAmountIn(
        exchangeId,
        tokenIn,
        tokenOut,
        amountOut
      );
  }

  /**
   * @notice Calculate amountOut of tokenOut for a given amountIn of tokenIn
   * @param exchangeProvider the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function getAmountOut(
    address exchangeProvider,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn
  ) external returns (uint256 amountOut) {
    require(isExchangeProvider[exchangeProvider], "ExchangeProvider does not exist");
    return
      amountOut = IExchangeProvider(exchangeProvider).getAmountOut(
        exchangeId,
        tokenIn,
        tokenOut,
        amountIn
      );
  }

  /**
   * @notice Execute a token swap with fixed amountIn
   * @param exchangeProvider the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(
    address exchangeProvider,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin
  ) external returns (uint256 amountOut) {
    require(isExchangeProvider[exchangeProvider], "ExchangeProvider does not exist");
    amountOut = IExchangeProvider(exchangeProvider).swapIn(exchangeId, tokenIn, tokenOut, amountIn);
    require(amountOut >= amountOutMin, "amountOutMin not met");
    guardTradingLimits(exchangeId, tokenIn, amountIn, tokenOut, amountOut);
    transferIn(msg.sender, tokenIn, amountIn);
    transferOut(msg.sender, tokenOut, amountOut);
    emit Swap(exchangeProvider, exchangeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    return amountOut;
  }

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param exchangeProvider the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountOut The amount of tokenOut to be bought
   * @param amountInMax Maximum amount of tokenIn that can be traded
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(
    address exchangeProvider,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut,
    uint256 amountInMax
  ) external returns (uint256 amountIn) {
    require(isExchangeProvider[exchangeProvider], "ExchangeProvider does not exist");
    amountIn = IExchangeProvider(exchangeProvider).swapOut(
      exchangeId,
      tokenIn,
      tokenOut,
      amountOut
    );
    require(amountIn <= amountInMax, "amountInMax exceeded");
    guardTradingLimits(exchangeId, tokenIn, amountIn, tokenOut, amountOut);
    transferIn(msg.sender, tokenIn, amountIn);
    transferOut(msg.sender, tokenOut, amountOut);
    emit Swap(exchangeProvider, exchangeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    return amountIn;
  }

  function setTradingLimits(address _token, TradingLimits.Counts calldata config) external {
    bytes32 token = bytes32(uint256(uint160(_token)));
    storeTradingCounts(token, config.setTimestampsToNow());
  }

  function setTradingLimits(
    bytes32 exchangeId,
    address _token,
    TradingLimits.Counts calldata config
  ) external onlyOwner {
    bytes32 token = bytes32(uint256(uint160(_token)));
    bytes32 id = exchangeId ^ token;
    storeTradingCounts(id, config.setTimestampsToNow());
  }

  /* ==================== Private Functions ==================== */

  function guardTradingLimits(
    bytes32 exchangeId,
    address _tokenIn,
    uint256 amountIn,
    address _tokenOut,
    uint256 amountOut
  ) internal {
    bytes32 tokenIn = bytes32(uint256(uint160(_tokenIn)));
    bytes32 tokenOut = bytes32(uint256(uint160(_tokenOut)));

    bytes32 tcId = exchangeId ^ tokenIn;
    TradingLimits.Counts memory tc = getTradingCounts(tcId);
    tc.log();
    if (tc.anyEnabled()) {
      storeTradingCounts(tcId, tc.add(amountIn).validate());
    }
    tcId = exchangeId ^ tokenOut;
    tc = getTradingCounts(tcId);
    tc.log();
    if (tc.anyEnabled()) {
      storeTradingCounts(tcId, tc.subtract(amountIn));
    }

    tc = getTradingCounts(tokenIn);
    tc.log();
    if (tc.anyEnabled()) {
      storeTradingCounts(tokenIn, tc.add(amountIn).validate());
    }

    tc = getTradingCounts(tokenOut);
    tc.log();
    if (tc.anyEnabled()) {
      storeTradingCounts(tokenOut, tc.subtract(amountOut).validate());
    }
  }

  function getTradingCounts(bytes32 id) internal returns (TradingLimits.Counts memory tc) {
    uint256[2] memory slots = tradingLimits[id];
    console.log("GetTradingCounts:");
    console.log(slots[0], slots[1]);
    return TradingLimits.decode(slots[0], slots[1]);
  }

  function storeTradingCounts(bytes32 id, TradingLimits.Counts memory tc) internal {
    (uint256 s0, uint256 s1) = tc.encode();
    tc.log();
    console.log(s0, s1);
    tradingLimits[id] = [s0, s1];
  }

  /**
   * @notice This method is responsible for minting tokens
   * @param to The address receiving  
   * @param token The asset getting minted
   * @param amount The amount of asset getting minted
   */
  function transferOut(address payable to, address token, uint256 amount) private {
    if (reserve.isStableAsset(token)) {
      IStableToken(token).mint(to, amount);
    }
    if (reserve.isCollateralAsset(token)) {
      reserve.transferExchangeCollateralAsset(token, to, amount);
    }
  }

  /**
   * @notice This method is responsible for burning assets
   * @param token The asset getting burned
   * @param amount The amount of asset getting burned
   */
  function transferIn(address from, address token, uint256 amount) private {
    if (reserve.isStableAsset(token)) {
      IERC20(token).transferFrom(from, address(this), amount);
      IStableToken(token).burn(amount);
    }
    if (reserve.isCollateralAsset(token)) {
      IERC20(token).transferFrom(from, address(reserve), amount);
    }
  }

  /* ==================== View Functions ==================== */

  /**
   * @notice Get the list of registered exchange managers.
   * @dev This can be used by UI or clients to discover all pairs.
   * @return exchangeProviders the addresses of all exchange managers.
   */
  function getExchangeProviders() public view returns (address[] memory) {
    return exchangeProviders;
  }
}

pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IExchangeManager } from "./interfaces/IExchangeManager.sol";
import { IBroker } from "./interfaces/IBroker.sol";
import { IBrokerAdmin } from "./interfaces/IBrokerAdmin.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { Initializable } from "../common/Initializable.sol";

/**
 * @title Broker
 * @notice The broker executes swaps and keeps track of spending limits per pair
 */
contract Broker is IBroker, IBrokerAdmin, Initializable, Ownable {
  /* ==================== State Variables ==================== */
  address[] exchangeManagers;

  // Address of the broker contract.
  IExchangeManager public exchangeManager;

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
   * @param _exchangeManager The address of the PairManager contract.
   * @param _reserve The address of the Rezerve contract.
   */
  function initilize(address _exchangeManager, address _reserve) external initializer {
    _transferOwnership(msg.sender);
    addExchangeManager(_exchangeManager);
    setReserve(_reserve);
  }

  /* ==================== Mutative Functions ==================== */

  /**
   * @notice Add exchange manager
   * @param _exchangeManager The address of the exchange manager to add
   * @return index The index where it was inserted
   */
  function addExchangeManager(address _exchangeManager) public onlyOwner returns (uint256 index) {
    require(
      !existsInExchangeManagers(_exchangeManager),
      "ExchangeManager already exists in the list"
    );
    require(_exchangeManager != address(0), "ExchangeManager address can't be 0");
    exchangeManagers.push(_exchangeManager);
    emit ExchangeManagerAdded(_exchangeManager);
    return index = exchangeManagers.length - 1;
  }

  /**
   * @notice Remove an exchange manager at an index
   * @param _exchangeManager The address of the exchange manager to remove
   * @param index The index in the exchange managers array
   * @return bool returns true if successful
   */
  function removeExchangeManager(address _exchangeManager, uint256 index)
    public
    onlyOwner
    returns (bool)
  {
    require(
      index < exchangeManagers.length && exchangeManagers[index] == _exchangeManager,
      "index into exchangeManagers list not mapped to token"
    );
    exchangeManagers[index] = exchangeManagers[exchangeManagers.length - 1];
    exchangeManagers.pop();
    emit ExchangeManagerRemoved(_exchangeManager);
    return true;
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
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function getAmountIn(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountOut)
    external
    returns (uint256 amountIn)
  {
    return amountOut = exchangeManager.getAmountIn(exchangeId, tokenIn, tokenOut, amountOut);
  }

  /**
   * @notice Calculate amountOut of tokenOut for a given amountIn of tokenIn
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought 
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function getAmountOut(bytes32 exchangeId, address tokenIn, address tokenOut, uint256 amountIn)
    external
    returns (uint256 amountOut)
  {
    return amountOut = exchangeManager.getAmountOut(exchangeId, tokenIn, tokenOut, amountIn);
  }

  /**
   * @notice Execute a token swap with fixed amountIn
   * @param _exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(
    address _exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin
  ) external returns (uint256 amountOut) {
    require(existsInExchangeManagers(_exchangeManager), "ExchangeManager does not exist");
    exchangeManager = IExchangeManager(_exchangeManager);
    return
      amountOut = exchangeManager.swapIn(exchangeId, tokenIn, tokenOut, amountIn, amountOutMin);
    emit Swap(_exchangeManager, exchangeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
  }

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param _exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountOut The amount of tokenOut to be bought
   * @param amountInMax Maximum amount of tokenIn that can be traded
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(
    address _exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut,
    uint256 amountInMax
  ) external returns (uint256 amountIn) {
    require(existsInExchangeManagers(_exchangeManager), "ExchangeManager does not exist");
    exchangeManager = IExchangeManager(_exchangeManager);
    return
      amountIn = exchangeManager.swapOut(exchangeId, tokenIn, tokenOut, amountOut, amountInMax);
    emit Swap(_exchangeManager, exchangeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
  }

  /* ==================== View Functions ==================== */

  /**
   * @notice Checks if ExchangeManager exists in the exchangeManagers list
   * @param _exchangeManager the address of the exchange manager for the pair
   * @return bool Returns true or false
   */
  function existsInExchangeManagers(address _exchangeManager) public view returns (bool) {
    for (uint256 i = 0; i < exchangeManagers.length; i++) {
      if (exchangeManagers[i] == _exchangeManager) {
        return true;
      }
    }
    return false;
  }

  /**
   * @notice Get the list of registered exchange managers.
   * @dev This can be used by UI or clients to discover all pairs.
   * @return exchangeManagers the addresses of all exchange managers.
   */
  function getExchangeManagers() external view returns (address[] memory exchangeManagers) {
    return exchangeManagers;
  }
}

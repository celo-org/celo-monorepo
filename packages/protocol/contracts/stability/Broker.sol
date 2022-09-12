pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IExchangeManager } from "./interfaces/IExchangeManager.sol";
import { IBroker } from "./interfaces/IBroker.sol";
import { IBrokerAdmin } from "./interfaces/IBrokerAdmin.sol";
import { IReserve } from "./interfaces/IReserve.sol";
import { Initializable } from "../common/Initializable.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { IStableToken } from "./interfaces/IStableToken.sol";

/**
 * @title Broker
 * @notice The broker executes swaps and keeps track of spending limits per pair
 */
contract Broker is IBroker, IBrokerAdmin, Initializable, Ownable {
  /* ==================== State Variables ==================== */

  address[] exchangeManagers;
  mapping(address => bool) public isExchangeManager;

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
   * @param _exchangeManagers The addresses of the ExchangeManager contracts.
   * @param _reserve The address of the Reserve contract.
   */
  function initialize(address[] calldata _exchangeManagers, address _reserve) external initializer {
    _transferOwnership(msg.sender);
    for (uint256 i = 0; i < _exchangeManagers.length; i++) {
      addExchangeManager(_exchangeManagers[i]);
    }
    setReserve(_reserve);
  }

  /* ==================== Mutative Functions ==================== */

  /**
   * @notice Add exchange manager
   * @param exchangeManager The address of the exchange manager to add
   * @return index The index where it was inserted
   */
  function addExchangeManager(address exchangeManager) public onlyOwner returns (uint256 index) {
    require(!isExchangeManager[exchangeManager], "ExchangeManager already exists in the list");
    require(exchangeManager != address(0), "ExchangeManager address can't be 0");
    exchangeManagers.push(exchangeManager);
    isExchangeManager[exchangeManager] = true;
    emit ExchangeManagerAdded(exchangeManager);
    return index = exchangeManagers.length - 1;
  }

  /**
   * @notice Remove an exchange manager at an index
   * @param exchangeManager The address of the exchange manager to remove
   * @param index The index in the exchange managers array
   * @return bool returns true if successful
   */
  function removeExchangeManager(address exchangeManager, uint256 index)
    public
    onlyOwner
    returns (bool)
  {
    require(
      index < exchangeManagers.length && exchangeManagers[index] == exchangeManager,
      "index into exchangeManagers list not mapped to token"
    );
    exchangeManagers[index] = exchangeManagers[exchangeManagers.length - 1];
    exchangeManagers.pop();
    delete isExchangeManager[exchangeManager];
    emit ExchangeManagerRemoved(exchangeManager);
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
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountOut The amount of tokenOut to be bought
   * @return amountIn The amount of tokenIn to be sold
   */
  function getAmountIn(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut
  ) external returns (uint256 amountIn) {
    require(isExchangeManager[exchangeManager], "ExchangeManager does not exist");
    return
      amountOut = IExchangeManager(exchangeManager).getAmountIn(
        exchangeId,
        tokenIn,
        tokenOut,
        amountOut
      );
  }

  /**
   * @notice Calculate amountOut of tokenOut for a given amountIn of tokenIn
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountIn The amount of tokenIn to be sold
   * @return amountOut The amount of tokenOut to be bought
   */
  function getAmountOut(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn
  ) external returns (uint256 amountOut) {
    require(isExchangeManager[exchangeManager], "ExchangeManager does not exist");
    return
      amountOut = IExchangeManager(exchangeManager).getAmountOut(
        exchangeId,
        tokenIn,
        tokenOut,
        amountIn
      );
  }

  /**
   * @notice Execute a token swap with fixed amountIn
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountIn The amount of tokenIn to be sold
   * @param amountOutMin Minimum amountOut to be received - controls slippage
   * @return amountOut The amount of tokenOut to be bought
   */
  function swapIn(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin
  ) external returns (uint256 amountOut) {
    require(isExchangeManager[exchangeManager], "ExchangeManager does not exist");
    amountOut = IExchangeManager(exchangeManager).swapIn(exchangeId, tokenIn, tokenOut, amountIn);
    require(amountOut >= amountOutMin, "amountOutMin not met");
    transferIn(tokenIn, amountIn);
    emit Swap(exchangeManager, exchangeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    return amountOut;
  }

  /**
   * @notice Execute a token swap with fixed amountOut
   * @param exchangeManager the address of the exchange manager for the pair
   * @param exchangeId The id of the exchange to use
   * @param tokenIn The token to be sold
   * @param tokenOut The token to be bought
   * @param amountOut The amount of tokenOut to be bought
   * @param amountInMax Maximum amount of tokenIn that can be traded
   * @return amountIn The amount of tokenIn to be sold
   */
  function swapOut(
    address exchangeManager,
    bytes32 exchangeId,
    address tokenIn,
    address tokenOut,
    uint256 amountOut,
    uint256 amountInMax
  ) external returns (uint256 amountIn) {
    require(isExchangeManager[exchangeManager], "ExchangeManager does not exist");
    amountIn = IExchangeManager(exchangeManager).swapOut(exchangeId, tokenIn, tokenOut, amountOut);
    require(amountIn <= amountInMax, "amountInMax exceeded");
    transferOut(msg.sender, tokenOut, amountOut);
    emit Swap(exchangeManager, exchangeId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    return amountIn;
  }

  /* ==================== Private Functions ==================== */

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
      reserve.transferCollateralAsset(token, to, amount);
    }
  }

  /**
   * @notice This method is responsible for burning assets
   * @param token The asset getting burned
   * @param amount The amount of asset getting burned
   */
  function transferIn(address token, uint256 amount) private {
    if (reserve.isStableAsset(token)) {
      IStableToken(token).burn(amount);
    }
    if (reserve.isCollateralAsset(token)) {
      IERC20(token).transferFrom(msg.sender, address(reserve), amount);
    }
  }

  /* ==================== View Functions ==================== */

  /**
   * @notice Get the list of registered exchange managers.
   * @dev This can be used by UI or clients to discover all pairs.
   * @return exchangeManagers the addresses of all exchange managers.
   */
  function getExchangeManagers() external view returns (address[] memory exchangeManagers) {
    return exchangeManagers;
  }
}

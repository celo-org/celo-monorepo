pragma solidity ^0.5.13;

/**
 * @title Breaker Box Interface
 * @notice Defines the basic interface for the Breaker Box
 */
interface IBreakerBox {
  struct TradingModeInfo {
    uint256 tradingMode;
    uint256 lastUpdatedTime;
    uint256 lastUpdatedBlock;
  }

  /**
   * @notice Emitted when a new breaker is added to the breaker box.
   * @param breaker The address of the new breaker.
   */
  event BreakerAdded(address indexed breaker);

  /**
   * @notice Emitted when a breaker is removed from the breaker box.
   * @param breaker The address of the breaker that was removed.
   */
  event BreakerRemoved(address indexed breaker);

  /**
   * @notice Emitted when a new exchange is added to the breaker box.
   * @param exchange The address of the exchange that was added.
   */
  event ExchangeAdded(address indexed exchange);

  /**
   * @notice Emitted when an exchange is removed from the breaker box.
   * @param exchange The address of the exchange that was removed.
   */
  event ExchangeRemoved(address indexed exchange);

  /**
   * @notice Retrives an ordered array of all breaker addresses.
   */
  function getBreakers() external view returns (address[] memory);

  /**
   * @notice Checks if a breaker with the specified address has been added to the breaker box.
   * @param breaker The address of the breaker to check;
   * @return A bool indicating whether or not the breaker has been added.
   */
  function isBreaker(address breaker) external view returns (bool);

  /**
   * @notice Checks breakers for a specified exchange to determine the trading mode.
   * @param exchange The address of the exchange to run the checks for.
   * @return currentTradingMode Returns an int representing the current trading mode for the specified exchange.
   */
  function checkBreakers(address exchange) external returns (uint256 currentTradingMode);
}

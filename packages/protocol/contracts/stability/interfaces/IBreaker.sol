pragma solidity ^0.5.13;

/**
 * @title Breaker Interface
 * @notice Defines the basic interface for a Breaker
 */
interface IBreaker {
  /**
   * @notice Emitted after an exchange triggers a breaker.
   * @param exchange The address of the exchange that triggered the breaker.
   */
  event BreakerTriggered(address indexed exchange);

  /**
   * @notice Emitted after a breaker has been reset for an exchange.
   * @param exchange The address of the exchange.
   */
  event BreakerReset(address indexed exchange);

  /**
   * @notice Emitted after the cooldownTime has been updated.
   * @param newCooldownTime The new cooldownTime of the breaker.
   */
  event CooldownTimeUpdated(uint256 newCooldownTime);

  /**
   * @notice Retrieve the cooldown time for the breaker.
   * @return cooldown The amount of time that must pass before the breaker can reset.
   * @dev when cooldown is 0 auto reset will not be attempted.
   */
  function getCooldown() external view returns (uint256 cooldown);

  /**
   * @notice Retrieve the trading mode this breaker will set when triggered.
   * @return tradingMode The trading mode for the breaker.
   */
  function getTradingMode() external view returns (uint256 tradingMode);

  /**
   * @notice Check if the criteria has been met, by a specified exchange, to trigger the breaker.
   * @param exchange The address of the exchange to run the check against.
   * @return triggerBreaker A boolean indicating whether or not the breaker shoulf be triggered for the given exchange.
   */
  function shouldTrigger(address exchange) external view returns (bool triggerBreaker);

  /**
   * @notice Check if the criteria to automatically reset the breaker has been met.
   * @dev Allows the definition of additional critera to check before reset. If no additional criteria is needed set to !shouldTrigger();
   * @param exchange The exchange the criteria should be checked against.
   * @return resetBreaker A boolean indicating whether the breaker should be reset for the given exchange.
   */
  function shouldReset(address exchange) external view returns (bool resetBreaker);
}

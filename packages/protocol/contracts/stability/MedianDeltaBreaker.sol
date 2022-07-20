pragma solidity ^0.5.13;

import { IBreaker } from "./interfaces/IBreaker.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";
import { IExchange } from "./interfaces/IExchange.sol";

import { UsingRegistry } from "../common/UsingRegistry.sol";

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { FixidityLib } from "../common/FixidityLib.sol";

/**
 * @title   Median Delta Breaker
 * @notice  Breaker contract that will trigger when the current oracle median price change
 *          relative to the last is greater than a calculated threshold. If this
 *          breaker is triggered for an exchange it should be set to no trading mode.
 */
contract MedianDeltaBreaker is IBreaker, UsingRegistry {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  /* ==================== State Variables ==================== */

  // The amount of time that must pass before the breaker can be reset for an exchange.
  uint256 public cooldownTime;
  // The allowed threshold for the median price change. Multiplied by 10^24
  FixidityLib.Fraction public priceChangeThreshold;

  /* ==================== Events ==================== */

  event priceChangeThresholdUpdated(uint256 newPriceChangeThreshold);

  /* ==================== Constructor ==================== */

  constructor(address registryAddress, uint256 _cooldownTime, uint256 _priceChangeThreshold)
    public
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setCooldownTime(_cooldownTime);
    setPriceChangeThreshold(_priceChangeThreshold);
  }

  /* ==================== Restricted Functions ==================== */

  /**
   * @notice Sets the cooldownTime to the specified value.
   * @param _cooldownTime The new cooldownTime value.
   * @dev Should be set to 0 to force a manual reset.
   */
  function setCooldownTime(uint256 _cooldownTime) public onlyOwner {
    cooldownTime = _cooldownTime;
    emit CooldownTimeUpdated(_cooldownTime);
  }

  /**
   * @notice Sets priceChangeThreshold.
   * @param _priceChangeThreshold The new priceChangeThreshold value.
   */
  function setPriceChangeThreshold(uint256 _priceChangeThreshold) public onlyOwner {
    priceChangeThreshold = FixidityLib.wrap(_priceChangeThreshold);
    require(
      priceChangeThreshold.lt(FixidityLib.fixed1()),
      "price change threshold must be less than 1"
    );
    emit priceChangeThresholdUpdated(_priceChangeThreshold);
  }

  /* ==================== View Functions ==================== */

  /**
   * @notice Gets the cooldown time for the breaker.
   * @return Returns the time in seconds.
   */
  function getCooldown() external view returns (uint256) {
    return cooldownTime;
  }

  /**
   * @notice  Check if the current median report price change, for an exchange, relative 
   *          to the last median report is greater than a calculated threshold. 
   *          If the change is greater than the threshold the breaker will trip.
   * @param   exchange The exchange to be checked.
   * @return  triggerBreaker  A bool indicating whether or not this breaker 
   *                          should be tripped for the exchange.
   */
  function shouldTrigger(address exchange) public view returns (bool triggerBreaker) {
    ISortedOracles sortedOracles = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    );

    address stableToken = IExchange(exchange).stable();
    uint256 lastMedian = sortedOracles.lastMedianRate(stableToken);
    (uint256 currentMedian, ) = sortedOracles.medianRate(stableToken);

    // Check if current median is within allowed threshold of last median
    triggerBreaker = !isWithinThreshold(lastMedian, currentMedian, priceChangeThreshold.unwrap());
  }

  /**
   * @notice  Checks whether or not the conditions have been met 
   *          for the specifed exchange to be reset.
   * @return  resetBreaker A bool indicating whether or not 
   *          this breaker can be reset for the given exchange.
   */
  function shouldReset(address exchange) external view returns (bool resetBreaker) {
    return !shouldTrigger(exchange);
  }

  /**
   * @notice Checks if the specified current median rate is within the allowed threshold.
   * @param lastRate The last median rate.
   * @param currentRate The current median rate.
   * @return  Returns a bool indicating whether or not the current rate 
   *          is within the given threshold.
   */
  function isWithinThreshold(uint256 lastRate, uint256 currentRate, uint256 allowedThreshold)
    private
    pure
    returns (bool)
  {
    uint256 maxPercent = uint256(1 * 10**24).add(allowedThreshold);
    uint256 maxValue = (lastRate.mul(maxPercent)).div(10**24);

    uint256 minPercent = uint256(1 * 10**24).sub(allowedThreshold);
    uint256 minValue = (lastRate.mul(minPercent)).div(10**24);

    return (currentRate >= minValue && currentRate <= maxValue);
  }
}

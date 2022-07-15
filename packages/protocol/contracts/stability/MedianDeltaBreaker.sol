pragma solidity ^0.5.13;

import { IBreaker } from "./interfaces/IBreaker.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";
import { IExchange } from "./interfaces/IExchange.sol";

import { UsingRegistry } from "../common/UsingRegistry.sol";

import { Math as OzMath } from "openzeppelin-solidity/contracts/math/Math.sol";
import { BabylonianMath } from "../common/libraries/BabylonianMath.sol";
import { FixidityLib } from "../common/FixidityLib.sol";

/**
 * @title   Median Delta Breaker
 * @notice  Breaker contract that will trigger when the current oracle median price change
 *          relative to the last is greater than a calculated threshold. If this
 *          breaker is triggered for an exchange it should be set to no trading mode.
 */
contract MedianDeltaBreaker is IBreaker, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /* ==================== State Variables ==================== */

  uint256 public constant TRADING_MODE = 1; // The trading mode that should be used when this breaker is triggered. 1 == no trading.
  uint256 public cooldownTime; // The amount of time that must pass before the breaker can be reset for an exchange.
  FixidityLib.Fraction public minPriceChangeThreshold; // The min threshold for the median price change. Multiplied by 10^24
  FixidityLib.Fraction public maxPriceChangeThreshold; // The min threshold for the median price change. Multiplied by 10^24
  FixidityLib.Fraction public priceChangeThresholdTimeMultiplier; // Determines how quickly the calculated price change threshold scales in respect to time that has elapsed since the last report. Multiplied by 10^24

  /* ==================== Events ==================== */

  event MinPriceChangeUpdated(uint256 newMinPriceChangeThreshold);
  event MaxPriceChangeUpdated(uint256 newMaxPriceChangeThreshold);
  event PriceChangeMultiplierUpdated(uint256 newPriceChangeMultiplier);

  /* ==================== Constructor ==================== */

  constructor(
    address registryAddress,
    uint256 _cooldownTime,
    uint256 _minPriceChangeThreshold,
    uint256 _maxPriceChangeThreshold,
    uint256 _priceChangeThresholdTimeMultiplier
  ) public {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setCooldownTime(_cooldownTime);
    setMinPriceChangeThreshold(_minPriceChangeThreshold);
    setMaxPriceChangeThreshold(_maxPriceChangeThreshold);
    setPriceChangeMultiplier(_priceChangeThresholdTimeMultiplier);
  }

  /* ==================== Restricted Functions ==================== */

  /**
   * @notice Sets the cooldownTime to the specified value.
   * @param newCooldownTime The new cooldownTime value.
   * @dev Should be set to 0 to force a manual reset.
   */
  function setCooldownTime(uint256 newCooldownTime) public onlyOwner {
    cooldownTime = newCooldownTime;
    emit CooldownTimeUpdated(newCooldownTime);
  }

  /**
   * @notice Sets the minPriceChangeThreshold.
   * @param _minPriceChangeThreshold The new minPriceChangeThreshold value.
   */
  function setMinPriceChangeThreshold(uint256 _minPriceChangeThreshold) public onlyOwner {
    minPriceChangeThreshold = FixidityLib.wrap(_minPriceChangeThreshold);
    require(
      minPriceChangeThreshold.lt(FixidityLib.fixed1()),
      "min price change threshold must be less than 1"
    );
    emit MinPriceChangeUpdated(_minPriceChangeThreshold);
  }

  /**
   * @notice Sets the maxPriceChangeThreshold.
   * @param _maxPriceChangeThreshold The new maxPriceChangeThreshold value.
   */
  function setMaxPriceChangeThreshold(uint256 _maxPriceChangeThreshold) public onlyOwner {
    maxPriceChangeThreshold = FixidityLib.wrap(_maxPriceChangeThreshold);
    require(
      maxPriceChangeThreshold.lt(FixidityLib.fixed1()),
      "max price change threshold must be less than 1"
    );
    emit MaxPriceChangeUpdated(_maxPriceChangeThreshold);
  }

  /**
   * @notice Sets the priceChangeMiltiplier.
   * @param _priceChangeThresholdTimeMultiplier The new priceChangeThresholdTimeMultiplier value.
   */
  function setPriceChangeMultiplier(uint256 _priceChangeThresholdTimeMultiplier) public onlyOwner {
    require(
      _priceChangeThresholdTimeMultiplier > 0,
      "price change multiplier must be greater than 0"
    );
    priceChangeThresholdTimeMultiplier = FixidityLib.wrap(_priceChangeThresholdTimeMultiplier);
    emit PriceChangeMultiplierUpdated(_priceChangeThresholdTimeMultiplier);
  }

  /**
   * @notice Returns the trading mode.
   */
  function getTradingMode() external view returns (uint256 tradingMode) {
    tradingMode = TRADING_MODE;
  }

  /**
   * @notice Gets the cooldown time for the breaker.
   * @return Returns the time in seconds.
   */
  function getCooldown() external view returns (uint256) {
    return cooldownTime;
  }

  /**
   * @notice  Check if the current median report price change, for an exchange, relative to the last median report is greater
   *          than a calculated threshold. If the change is greater than the threshold the breaker will trip.
   * @param exchange The exchange to be checked.
   * @return triggerBreaker A bool indicating whether or not this breaker should be tripped for the exchange.
   */
  function shouldTrigger(address exchange) public view returns (bool triggerBreaker) {
    ISortedOracles sortedOracles = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    );

    address stableToken = IExchange(exchange).stable();

    (, uint256[] memory reportTimestamps, ) = sortedOracles.getTimestamps(stableToken);
    uint256 lastReportTimestamp = reportTimestamps[0];

    uint256 allowedThreshold = getPriceChangeThreshold(lastReportTimestamp);
    uint256 lastMedian = sortedOracles.lastMedianRate(stableToken);
    (uint256 currentMedian, ) = sortedOracles.medianRate(stableToken);

    // Check if current median is within allowed threshold of last median
    triggerBreaker = !isWithinThreshold(lastMedian, currentMedian, allowedThreshold);
  }

  /**
   * @notice Checks whether or not the conditions have been met for the specifed exchange to be reset.
   * @return resetBreaker A bool indicating whether or not this breaker can be reset for the given exchange.
   */
  function shouldReset(address exchange) external view returns (bool resetBreaker) {
    return !shouldTrigger(exchange);
  }

  /**
   * @notice Gets the allowed median price change threshold.
   * @param lastTimestamp The timestamp of the last oracle report.
   * @return threshold The allowed threshold to be used to determine of the breaker should trip.
   */
  function getPriceChangeThreshold(uint256 lastTimestamp) private view returns (uint256 threshold) {
    if (lastTimestamp == 0) {
      return maxPriceChangeThreshold.unwrap();
    }

    // TODO: Calculate time based multiplier
    // uint256 timeElapsed = ((block.timestamp - lastTimestamp) / 1 minutes); // Minutes since last report
    // uint256 calculatedThreshold = minPriceChangeThreshold.unwrap() *
    //   (BabylonianMath.sqrt((priceChangeThresholdTimeMultiplier.unwrap() * timeElapsed)) +
    //     (1 * 10**24));

    uint256 calculatedThreshold;

    if (calculatedThreshold == 0) {
      return maxPriceChangeThreshold.unwrap();
    }

    return OzMath.min(maxPriceChangeThreshold.unwrap(), calculatedThreshold);
  }

  /**
   * @notice Checks if the specified current median rate is within the allowed threshold.
   * @param lastRate The last median rate.
   * @param currentRate The current median rate.
   * @param allowedThreshold The allowed threshold to be used to determine of the breaker should trip.
   * @return Returns a bool indicating whether or not the current rate is within the given threshold.
   */
  function isWithinThreshold(uint256 lastRate, uint256 currentRate, uint256 allowedThreshold)
    private
    pure
    returns (bool)
  {
    uint256 maxPercent = (1 * 10**24) + allowedThreshold;
    uint256 maxValue = (lastRate * maxPercent) / 10**24;

    uint256 minPercent = (1 * 10**24) - allowedThreshold;
    uint256 minValue = (lastRate * minPercent) / 10**24;

    return (currentRate >= minValue && currentRate <= maxValue);
  }
}

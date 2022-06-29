pragma solidity 0.5.13;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { IBreaker } from "./interfaces/IBreaker.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";

import { UsingRegistry } from "../common/UsingRegistry.sol";
import { FixidityLib } from "../common/FixidityLib.sol";

/**
 * @title   Median Delta Breaker
 * @notice  Breaker contract that will trigger when the current oracle median price change
 *          relative to the last is greater than a calculated threshold. If this
 *          breaker is triggered for an exchange it should be set to no trading mode.
 */
contract MedianDeltaBreaker is IBreaker, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /**
   * @notice Emitted after the minPriceChangeThreshold is updated.
   * @param newMinPriceChangeThreshold The new minPriceChangeThreshold.
   */
  event MinPriceChangeUpdated(uint256 newMinPriceChangeThreshold);

  /**
   * @notice Emitted after the maxPriceChangeThreshold is updated.
   * @param newMaxPriceChangeThreshold The new maxPriceChangeThreshold.
   */
  event MaxPriceChangeUpdated(uint256 newMaxPriceChangeThreshold);

  /**
   * @notice Emitted after the priceChangeMultiplier is updated.
   * @param newPriceChangeMultiplier The new priceChangeMultiplier.
   */
  event PriceChangeMultiplierUpdated(uint256 newPriceChangeMultiplier);

  /**
   * @notice The trading mode that should be used when this breaker is triggered.
   * @dev 0 for no trading.
   */
  uint256 public constant TRADING_MODE = 0;

  /**
   * @notice The amount of time that must pass before the breaker can be reset for an exchange.
   */
  uint256 public cooldownTime;

  /**
   * @notice The min threshold for the median price change.
   * @dev Multiplied by 10^24
   */
  FixidityLib.Fraction public minPriceChangeThreshold;

  /**
   * @notice The max threshold for the median price change.
   * @dev Multiplied by 10^24
   */
  FixidityLib.Fraction public maxPriceChangeThreshold;

  /**
   * @notice Determines how quickly the calculated price change threshold scales in respect to time that has elapsed since the last report.
   * @dev Multiplied by 10^24
   */
  FixidityLib.Fraction public priceChangeThresholdTimeMultiplier;

  constructor(
    uint256 _cooldownTime,
    uint256 _minPriceChangeThreshold,
    uint256 _maxPriceChangeThreshold,
    uint256 _priceChangeThresholdTimeMultiplier
  ) public {
    _transferOwnership(msg.sender);
    setCooldownTime(_cooldownTime);
    setMinPriceChangeThreshold(_minPriceChangeThreshold);
    setMaxPriceChangeThreshold(_maxPriceChangeThreshold);
    setPriceChangeMultiplier(_priceChangeThresholdTimeMultiplier);
  }

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
  function getTradingMode() public view returns (uint256 tradingMode) {
    tradingMode = TRADING_MODE;
  }

  // TODO

  function shouldTrigger(address exchange) external view returns (bool triggerBreaker) {}

  function shouldReset(address exchange) external view returns (bool resetBreaker) {}

  function getPriceChangeThreshold() private view returns (uint256 threshold) {}
}

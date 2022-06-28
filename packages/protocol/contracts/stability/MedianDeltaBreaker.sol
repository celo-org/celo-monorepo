pragma solidity 0.5.13;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { IBreaker } from "./interfaces/IBreaker.sol";

import { UsingRegistry } from "../common/UsingRegistry.sol";

/**
 * @title   Median Delta Breaker
 * @notice  Breaker contract that will trigger when the current oracle report price change
 *          relative to the last report price is greater than a calculated threshold. If this 
 *          breaker is triggered for an exchange it should be set to no trading mode.  
 */
contract MedianDeltaBreaker is IBreaker, UsingRegistry {
  /**
     * @notice The trading mode that should be used when this breaker is triggered.
     * @dev 0 for no trading.
     */
  uint256 public constant TRADING_MODE = 0;

  /**
     * @notice The amount of time that must pass before the breaker can be reset for an exchange.
     */
  uint256 public cooldownTime;

  constructor(uint256 _cooldownTime) public {
    _transferOwnership(msg.sender);
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
     * @notice Returns the trading mode.
     */
  function getTradingMode() public view returns (uint256 tradingMode) {
    tradingMode = TRADING_MODE;
  }

}

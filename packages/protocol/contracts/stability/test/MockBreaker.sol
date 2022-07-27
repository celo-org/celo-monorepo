// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.5.13;

contract MockBreaker {
  uint256 public cooldown;
  bool public trigger;
  bool public reset;

  constructor(uint256 _cooldown, bool _trigger, bool _reset) public {
    cooldown = _cooldown;
    trigger = _trigger;
    reset = _reset;
  }

  function getCooldown() external view returns (uint256) {
    return cooldown;
  }

  function setCooldown(uint256) external {}

  function shouldTrigger(address) external view returns (bool) {
    return trigger;
  }

  function setTrigger(bool) external {}

  function shouldReset(address) external view returns (bool) {
    return reset;
  }

  function setReset(bool) external {}
}

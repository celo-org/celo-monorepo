// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.5.13;

import { IBreaker } from "contracts/stability/interfaces/IBreaker.sol";

contract FakeBreaker is IBreaker {
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

  function setCooldown(uint256 _cooldown) external {
    cooldown = _cooldown;
  }

  function shouldTrigger(address exchange) external view returns (bool) {
    return trigger;
  }

  function setTrigger(bool _trigger) external {
    trigger = _trigger;
  }

  function shouldReset(address exchange) external view returns (bool) {
    return reset;
  }

  function setReset(bool _reset) external {
    reset = _reset;
  }
}

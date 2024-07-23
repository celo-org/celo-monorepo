// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

import "./UsingRegistry.sol";

contract Freezable is UsingRegistry {
  // onlyWhenNotFrozen functions can only be called when `frozen` is false, otherwise they will
  // revert.
  modifier onlyWhenNotFrozen() {
    require(!getFreezer().isFrozen(address(this)), "can't call when contract is frozen");
    _;
  }
}

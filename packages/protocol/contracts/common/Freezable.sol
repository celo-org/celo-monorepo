pragma solidity ^0.5.3;

import "./UsingRegistry.sol";

contract Freezable is UsingRegistry {
  // onlyWhenNotFrozen functions can only be called when `frozen` is false, otherwise they will
  // revert.
  modifier onlyWhenNotFrozen() {
    require(!getFreezer().isFrozen(address(this)), "can't call when contract is frozen");
    _;
  }
}

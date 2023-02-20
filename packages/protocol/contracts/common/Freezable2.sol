pragma solidity ^0.5.13;

import "./UsingRegistryV2.sol";

// Implementation of Freezable using UsingRegistryV2
contract Freezable2 is UsingRegistryV2 {
  // onlyWhenNotFrozen functions can only be called when `frozen` is false, otherwise they will
  // revert.
  modifier onlyWhenNotFrozen() {
    require(!getFreezer().isFrozen(address(this)), "can't call when contract is frozen");
    _;
  }
}

pragma solidity ^0.5.3;

interface IFreezer {
  function isFrozen(address) external view returns (bool);
}

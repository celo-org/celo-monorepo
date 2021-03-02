pragma solidity ^0.5.13;

interface IFreezer {
  function isFrozen(address) external view returns (bool);
}

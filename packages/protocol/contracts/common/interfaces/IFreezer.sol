pragma solidity ^0.5.3;

interface IFreezer {
  function initialize() external;
  function isFrozen(address) external returns (bool);
}

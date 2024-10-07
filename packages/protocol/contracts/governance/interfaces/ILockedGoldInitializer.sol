pragma solidity >=0.5.13 <0.9;

interface ILockedGoldInitializer {
  function initialize(address registryAddress, uint256 _unlockingPeriod) external;
}

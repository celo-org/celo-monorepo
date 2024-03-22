pragma solidity >=0.5.13 <0.9.0;

interface IDoubleSigningSlasherInitializer {
  function initialize(address registryAddress, uint256 _penalty, uint256 _reward) external;
}

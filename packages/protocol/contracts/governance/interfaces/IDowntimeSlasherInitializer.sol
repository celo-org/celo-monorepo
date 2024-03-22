pragma solidity >=0.5.13 <0.9.0;

interface IDowntimeSlasherInitializer {
  function initialize(
    address registryAddress,
    uint256 _penalty,
    uint256 _reward,
    uint256 _slashableDowntime
  ) external;
}

pragma solidity >=0.5.13 <0.9;

interface IRandomInitializer {
  function initialize(uint256 _randomnessBlockRetentionWindow) external;
}

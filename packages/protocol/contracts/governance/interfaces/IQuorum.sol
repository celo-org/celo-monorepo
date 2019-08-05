pragma solidity ^0.5.8;


interface IQuorum {
  function setParticipationFloor(int256) external;
  function setUpdateCoefficient(int256) external;
  function setCriticalBaselineLevel(int256) external;
  function adjustedSupport(uint256, uint256, uint256, uint256) external view returns (int256);
  function participationBaseline() external view returns (int256);
  function updateParticipationBaseline(int256) external;
}

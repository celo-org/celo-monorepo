pragma solidity ^0.5.13;

interface IGovernance {
  function isVoting(address) external view returns (bool);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);
}

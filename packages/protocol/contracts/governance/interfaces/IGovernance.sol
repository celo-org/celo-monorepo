pragma solidity ^0.5.13;

interface IGovernance {
  function isVoting(address) external view returns (bool);
}

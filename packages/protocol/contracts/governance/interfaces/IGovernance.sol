pragma solidity ^0.5.3;

interface IGovernance {
  function isVoting(address) external view returns (bool);
}

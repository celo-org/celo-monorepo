pragma solidity ^0.5.8;


interface IQuorum {
  function quorumBaseline() external view returns (int256);
  function updateQuorumBaseline(int256) external;
}

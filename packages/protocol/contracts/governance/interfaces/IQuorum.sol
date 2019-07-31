pragma solidity ^0.5.8;


interface IQuorum {
  function adjustedSupport(uint256, uint256, uint256, uint256) external view returns (int256);
  function quorumBaseline() external view returns (int256);
  function updateQuorumBaseline(int256) external;
}

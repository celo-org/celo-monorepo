pragma solidity ^0.5.8;


interface IQuorum {
  function getQuorumBaseline() external view returns (uint256, uint256);
  function threshold(
    uint256,
    uint256,
    uint256,
    uint256,
    uint256,
    uint256
  ) external view returns (uint256, uint256);
  function updateQuorumBaseline(uint256, uint256) external;
}

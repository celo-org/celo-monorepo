pragma solidity ^0.5.3;

interface IRandom {

  function revealAndCommit(bytes32, bytes32, address) external;
  function getBlockRandomness(uint256) external view returns (bytes32);

}

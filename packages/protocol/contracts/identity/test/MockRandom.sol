pragma solidity ^0.5.13;

import "../Random.sol";

contract MockRandom is Random(true) {
  mapping(uint256 => bytes32) private history;

  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    history[blockNumber] = randomness;
  }
  function getBlockRandomness(uint256 blockNumber) external view returns (bytes32) {
    require(history[blockNumber] != 0x0, "No randomness found");
    return history[blockNumber];
  }
}

pragma solidity ^0.5.3;

import "../Random.sol";

contract TestRandom is Random {
  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    addRandomness(blockNumber, randomness);
  }
  function getTestRandomness(uint256 blockNumber, uint256 cur) external view returns (bytes32) {
    return _getBlockRandomness(blockNumber, cur);
  }
}


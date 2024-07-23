// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../Random.sol";

contract RandomTest is Random(true) {
  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    addRandomness(blockNumber, randomness);
  }

  function testRevealAndCommit(
    bytes32 randomness,
    bytes32 newCommitment,
    address proposer
  ) external {
    _revealAndCommit(randomness, newCommitment, proposer);
  }

  function getTestRandomness(uint256 blockNumber, uint256 cur) external view returns (bytes32) {
    return _getBlockRandomness(blockNumber, cur);
  }
}

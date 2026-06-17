// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/identity/Random.sol";

// Deployable 0.8 helpers for the migrated Random contract, used by the 0.5 tests
// via deployCodeTo. These live in a plain .sol file (not .t.sol) so forge does
// NOT treat their test*-prefixed helper methods as test cases.

// Forces forge to compile the 0.8 Random so it can be deployed via deployCodeTo.
contract RandomCompile is Random(true) {}

// 0.8 mock for Random matching the behaviour of the 0.5 MockRandom: overrides
// getBlockRandomness with an in-storage map.
contract MockRandom08 is Random(true) {
  mapping(uint256 => bytes32) private _mockHistory;

  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    _mockHistory[blockNumber] = randomness;
  }

  function getBlockRandomness(uint256 blockNumber) external view override returns (bytes32) {
    require(_mockHistory[blockNumber] != 0x0, "No randomness found");
    return _mockHistory[blockNumber];
  }
}

// 0.8 test-helper exposing Random internals, matching the 0.5 RandomTest.
contract RandomTest08 is Random(true) {
  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    addRandomness(blockNumber, randomness);
  }

  function revealAndCommitForTest(
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

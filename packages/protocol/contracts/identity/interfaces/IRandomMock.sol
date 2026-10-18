// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Interface for the 0.8 RandomMock08 / RandomTest08 deployed via deployCodeTo.
 * Exposes all methods the 0.5 unit tests call on the mock, including mock-specific
 * setters (addTestRandomness, getTestRandomness) and testRevealAndCommit.
 */
interface IRandomMock {
  // --- Random initializer ---
  function initialize(uint256 _randomnessBlockRetentionWindow) external;

  // --- IRandom methods ---
  function revealAndCommit(bytes32 randomness, bytes32 newCommitment, address proposer) external;
  function randomnessBlockRetentionWindow() external view returns (uint256);
  function random() external view returns (bytes32);
  function getBlockRandomness(uint256 blockNumber) external view returns (bytes32);

  // --- Random public methods ---
  function setRandomnessBlockRetentionWindow(uint256 value) external;
  function computeCommitment(bytes32 randomness) external pure returns (bytes32);

  // --- MockRandom08 methods ---
  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external;

  // --- RandomTest08 methods ---
  function revealAndCommitForTest(
    bytes32 randomness,
    bytes32 newCommitment,
    address proposer
  ) external;
  function getTestRandomness(uint256 blockNumber, uint256 cur) external view returns (bytes32);
  function commitments(address addr) external view returns (bytes32);
}

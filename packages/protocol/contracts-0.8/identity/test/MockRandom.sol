// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../Random.sol";

contract MockRandom is Random(true) {
  mapping(uint256 => bytes32) private history;

  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    history[blockNumber] = randomness;
  }
  function getBlockRandomness(uint256 blockNumber) external view override returns (bytes32) {
    require(history[blockNumber] != 0x0, "No randomness found");
    return history[blockNumber];
  }
}

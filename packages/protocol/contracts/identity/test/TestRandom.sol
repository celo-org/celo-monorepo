pragma solidity ^0.5.3;

import "../Random.sol";

contract TestRandom is Random {
  function testRandomness(uint bn, bytes32 randomness) external {
    addRandomness(bn, randomness);
  }
  function getTestRandomness(uint bn, uint cur) external view returns (bytes32) {
    return _getBlockRandomness(bn, cur);
  }
}


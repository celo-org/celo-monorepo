pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../Random.sol";

contract MockRandom is Random {
  uint256 public randomnessBlockRetentionWindow = 256;

  mapping (uint256 => bytes32) private history;
  uint256 private historyFirst;
  uint256 private historySize;

  function addTestRandomness(uint256 blockNumber, bytes32 randomness) external {
    history[blockNumber] = randomness;
  }
  function getBlockRandomness(uint256 blockNumber) external view returns (bytes32) {
    require(history[blockNumber] != 0x0, "No randomness found");
    return history[blockNumber];
  }
}
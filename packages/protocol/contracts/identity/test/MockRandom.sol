pragma solidity ^0.5.8;

import "../interfaces/IRandom.sol";

/**
 * @title Returns a fixed value to test 'random' things
 */
contract MockRandom is IRandom {

  bytes32 public _r;

  function revealAndCommit(
    bytes32 randomness,
    bytes32 newCommitment,
    address proposer
  ) external {
    _r = randomness;
  }
  
  function random() external view returns (bytes32) {
    return _r;
  }
}

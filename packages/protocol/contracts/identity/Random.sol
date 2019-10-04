pragma solidity ^0.5.3;

import "./interfaces/IRandom.sol";


/**
 * @title Provides randomness for verifier selection
 */
contract Random is IRandom {

  /* Stores most recent commitment per address */
  mapping(address => bytes32) public commitments;

  bytes32 public _random;

  uint256 constant HISTORY_LENGTH = 256;

  bytes32[] private history;

  function initialize() external {
    history.length = HISTORY_LENGTH;
  }

  /**
   * @notice Implements step of the randomness protocol.
   * @param randomness Bytes that will be added to the entropy pool.
   * @param newCommitment The hash of randomness that will be revealed in the future.
   * @param proposer Address of the block proposer.
   * @dev If the Random contract is pointed to by the Registry, the first transaction in a block
   * should be a special transaction to address 0x0 with 64 bytes of data - the concatenated
   * `randomness` and `newCommitment`. Before running regular transactions, this function should be
   * called.
   */
  function revealAndCommit(
    bytes32 randomness,
    bytes32 newCommitment,
    address proposer
  ) external {
    require(msg.sender == address(0));

    // ensure revealed randomness matches previous commitment
    if (commitments[proposer] != 0) {
      require(randomness != 0);
      bytes32 expectedCommitment = computeCommitment(randomness);
      require(expectedCommitment == commitments[proposer]);
    } else {
      require(randomness == 0);
    }

    // add entropy
    _random = keccak256(abi.encodePacked(_random, randomness));
    history[block.number % HISTORY_LENGTH] = _random;

    commitments[proposer] = newCommitment;
  }

  function computeCommitment(bytes32 randomness) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(randomness));
  }

  function random() external view returns (bytes32) {
    return _random;
  }

  function getBlockRandomness(uint256 bn) external view returns (bytes32) {
    require(bn <= block.number, "Cannot query randomness of future blocks");
    require(bn > block.number - HISTORY_LENGTH, "Cannot query randomness of old blocks");
    return history[bn % HISTORY_LENGTH];
  }
}

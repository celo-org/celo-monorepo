pragma solidity ^0.5.3;

import "./interfaces/IRandom.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/Initializable.sol";

/**
 * @title Provides randomness for verifier selection
 */
contract Random is IRandom, Ownable, Initializable {

  using SafeMath for uint256;

  /* Stores most recent commitment per address */
  mapping(address => bytes32) public commitments;

  uint256 public randomnessBlockRetentionWindow = 256;

  mapping (uint256 => bytes32) private history;
  uint256 private historyFirst;
  uint256 private historySize;

  event RandomnessBlockRetentionWindowSet(uint256 value);

  function initialize(uint256 _randomnessBlockRetentionWindow) external initializer {
    _transferOwnership(msg.sender);
    require(_randomnessBlockRetentionWindow > 0, "randomnessBlockRetetionWindow cannot be zero");
    randomnessBlockRetentionWindow = _randomnessBlockRetentionWindow;
  }

  /**
   * @notice Sets the number of old random blocks whose randomness values can be queried.
   * @param value Number of old random blocks whose randomness values can be queried.
   */
  function setRandomnessBlockRetentionWindow(uint256 value) external onlyOwner {
    require(value > 0, "randomnessBlockRetetionWindow cannot be zero");
    randomnessBlockRetentionWindow = value;
    emit RandomnessBlockRetentionWindowSet(value);
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
    require(msg.sender == address(0), "only VM can call");
    _revealAndCommit(randomness, newCommitment, proposer);
  }

  function _revealAndCommit(
    bytes32 randomness,
    bytes32 newCommitment,
    address proposer
  ) internal {
    // ensure revealed randomness matches previous commitment
    if (commitments[proposer] != 0) {
      require(randomness != 0, "randomness cannot be zero if there is a previous commitment");
      bytes32 expectedCommitment = computeCommitment(randomness);
      require(
        expectedCommitment == commitments[proposer],
        "commitment didn't match the posted randomness"
      );
    } else {
      require(randomness == 0, "randomness should be zero if there is no previous commitment");
    }

    // add entropy
    addRandomness(block.number, keccak256(abi.encodePacked(history[block.number-1], randomness)));

    commitments[proposer] = newCommitment;
  }

  function addRandomness(uint blockNumber, bytes32 randomness) internal {
    history[blockNumber] = randomness;
    if (historySize == 0) {
      historyFirst = block.number;
      historySize = 1;
    } else if (historySize > randomnessBlockRetentionWindow) {
      delete history[historyFirst];
      delete history[historyFirst+1];
      historyFirst += 2;
      historySize--;
    } else if (historySize == randomnessBlockRetentionWindow) {
      delete history[historyFirst];
      historyFirst++;
    } else /* historySize < randomnessBlockRetentionWindow) */ {
      historySize++;
    }
  }

  function computeCommitment(bytes32 randomness) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(randomness));
  }

  function random() external view returns (bytes32) {
    return _getBlockRandomness(block.number, block.number);
  }

  function _random() external view returns (bytes32) {
    return _getBlockRandomness(block.number, block.number);
  }

  /**
   * @notice Get randomness values of previous blocks.
   * @param blockNumber The number of block whose randomness value we want to know.
   */
  function getBlockRandomness(uint256 blockNumber) external view returns (bytes32) {
    return _getBlockRandomness(blockNumber, block.number);
  }

  function _getBlockRandomness(uint256 blockNumber, uint256 cur) internal view returns (bytes32) {
    require(blockNumber <= cur, "Cannot query randomness of future blocks");
    require(
      blockNumber > cur.sub(historySize) &&
      (randomnessBlockRetentionWindow >= cur ||
      blockNumber > cur.sub(randomnessBlockRetentionWindow)),
      "Cannot query randomness older than the stored history");
    return history[blockNumber];
  }
}

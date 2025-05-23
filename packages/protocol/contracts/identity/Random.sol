pragma solidity ^0.5.13;

import "./interfaces/IRandom.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/CalledByVm.sol";
import "../common/Initializable.sol";
import "../common/UsingPrecompiles.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

/**
 * @title Provides randomness for verifier selection
 */
contract Random is
  IRandom,
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingPrecompiles,
  CalledByVm
{
  using SafeMath for uint256;

  /* Stores most recent commitment per address */
  mapping(address => bytes32) private deprecated_commitments;

  uint256 private deprecated_randomnessBlockRetentionWindow;

  mapping(uint256 => bytes32) private history;
  uint256 private historyFirst;
  uint256 private historySize;
  uint256 private lastEpochBlock;

  event RandomnessBlockRetentionWindowSet(uint256 value);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _randomnessBlockRetentionWindow Number of old random blocks whose randomness
   * values can be queried.
   */
  function initialize(uint256 _randomnessBlockRetentionWindow) external initializer {
    _transferOwnership(msg.sender);
    setRandomnessBlockRetentionWindow(_randomnessBlockRetentionWindow);
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
  ) external onlyL1 onlyVm {
    _revealAndCommit(randomness, newCommitment, proposer);
  }

  /**
   * @notice Querying the current randomness value.
   * @return Returns the current randomness value.
   * @dev Only available on L1.
   */
  function random() external view onlyL1 returns (bytes32) {
    return _getBlockRandomness(block.number, block.number);
  }

  /**
   * @notice Returns the most recent commitment by a validator.
   * @param addr Address of the validator.
   * @return The validator's most recent commitment.
   * @dev The Random system will be deprecated once Celo becomes an L2.
   */
  function commitments(address addr) external view onlyL1 returns (bytes32) {
    return deprecated_commitments[addr];
  }

  function randomnessBlockRetentionWindow() external view onlyL1 returns (uint256) {
    return deprecated_randomnessBlockRetentionWindow;
  }

  /**
   * @notice Get randomness values of previous blocks.
   * @param blockNumber The number of block whose randomness value we want to know.
   * @return The associated randomness value.
   * @dev Only available on L1.
   */
  function getBlockRandomness(uint256 blockNumber) external view onlyL1 returns (bytes32) {
    return _getBlockRandomness(blockNumber, block.number);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 2, 0);
  }

  /**
   * @notice Sets the number of old random blocks whose randomness values can be queried.
   * @param value Number of old random blocks whose randomness values can be queried.
   * @dev Only available on L1.
   */
  function setRandomnessBlockRetentionWindow(uint256 value) public onlyL1 onlyOwner {
    require(value > 0, "randomnessBlockRetetionWindow cannot be zero");
    deprecated_randomnessBlockRetentionWindow = value;
    emit RandomnessBlockRetentionWindowSet(value);
  }

  /**
   * @notice Compute the commitment hash for a given randomness value.
   * @param randomness The value for which the commitment hash is computed.
   * @return Commitment parameter.
   */
  function computeCommitment(bytes32 randomness) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(randomness));
  }

  /**
   * @notice Implements step of the randomness protocol.
   * @param randomness Bytes that will be added to the entropy pool.
   * @param newCommitment The hash of randomness that will be revealed in the future.
   * @param proposer Address of the block proposer.
   * @dev Only available on L1.
   */
  function _revealAndCommit(
    bytes32 randomness,
    bytes32 newCommitment,
    address proposer
  ) internal onlyL1 {
    require(newCommitment != computeCommitment(0), "cannot commit zero randomness");

    // ensure revealed randomness matches previous commitment
    if (deprecated_commitments[proposer] != 0) {
      require(randomness != 0, "randomness cannot be zero if there is a previous commitment");
      bytes32 expectedCommitment = computeCommitment(randomness);
      require(
        expectedCommitment == deprecated_commitments[proposer],
        "commitment didn't match the posted randomness"
      );
    } else {
      require(randomness == 0, "randomness should be zero if there is no previous commitment");
    }

    // add entropy
    uint256 blockNumber = block.number == 0 ? 0 : block.number.sub(1);
    addRandomness(block.number, keccak256(abi.encodePacked(history[blockNumber], randomness)));

    deprecated_commitments[proposer] = newCommitment;
  }

  /**
   * @notice Add a value to the randomness history.
   * @param blockNumber Current block number.
   * @param randomness The new randomness added to history.
   * @dev The calls to this function should be made so that on the next call, blockNumber will
   * be the previous one, incremented by one.
   * @dev Only available on L1.
   */
  function addRandomness(uint256 blockNumber, bytes32 randomness) internal onlyL1 {
    history[blockNumber] = randomness;
    if (blockNumber % getEpochSize() == 0) {
      if (lastEpochBlock < historyFirst) {
        delete history[lastEpochBlock];
      }
      lastEpochBlock = blockNumber;
    } else {
      if (historySize == 0) {
        historyFirst = blockNumber;
        historySize = 1;
      } else if (historySize > deprecated_randomnessBlockRetentionWindow) {
        deleteHistoryIfNotLastEpochBlock(historyFirst);
        deleteHistoryIfNotLastEpochBlock(historyFirst.add(1));
        historyFirst = historyFirst.add(2);
        historySize = historySize.sub(1);
      } else if (historySize == deprecated_randomnessBlockRetentionWindow) {
        deleteHistoryIfNotLastEpochBlock(historyFirst);
        historyFirst = historyFirst.add(1);
      } else {
        // historySize < deprecated_randomnessBlockRetentionWindow
        historySize = historySize.add(1);
      }
    }
  }

  function deleteHistoryIfNotLastEpochBlock(uint256 blockNumber) internal {
    if (blockNumber != lastEpochBlock) {
      delete history[blockNumber];
    }
  }

  /**
   * @notice Get randomness values of previous blocks.
   * @param blockNumber The number of block whose randomness value we want to know.
   * @param cur Number of the current block.
   * @return The associated randomness value.
   * @dev Only available on L1.
   */
  function _getBlockRandomness(
    uint256 blockNumber,
    uint256 cur
  ) internal view onlyL1 returns (bytes32) {
    require(blockNumber <= cur, "Cannot query randomness of future blocks");
    require(
      blockNumber == lastEpochBlock ||
        (blockNumber > cur.sub(historySize) &&
          (deprecated_randomnessBlockRetentionWindow >= cur ||
            blockNumber > cur.sub(deprecated_randomnessBlockRetentionWindow))),
      "Cannot query randomness older than the stored history"
    );
    return history[blockNumber];
  }
}

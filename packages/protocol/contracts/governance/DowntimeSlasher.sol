pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

contract DowntimeSlasher is ICeloVersionedContract, SlasherUtil {
  using SafeMath for uint256;

  // Maps validator address -> end block of the latest interval for which it has been slashed.
  mapping(address => uint256) public lastSlashedBlock;

  // Maps user address -> startBlock -> endBlock -> signature bitmap for that interval.
  // Note that startBlock and endBlock must always be in the same epoch.
  mapping(address => mapping(uint256 => mapping(uint256 => bytes32))) public bitmaps;

  uint256 public slashableDowntime;

  event SlashableDowntimeSet(uint256 interval);
  event DowntimeSlashPerformed(
    address indexed validator,
    uint256 indexed startBlock,
    uint256 indexed endBlock
  );
  event BitmapSetForInterval(uint256 indexed startBlock, uint256 indexed endBlock, bytes32 bitmap);

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (2, 0, 0, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _penalty Penalty for the slashed validator.
   * @param _reward Reward that the observer gets.
   * @param _slashableDowntime Slashable downtime in blocks.
   */
  function initialize(
    address registryAddress,
    uint256 _penalty,
    uint256 _reward,
    uint256 _slashableDowntime
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setSlashingIncentives(_penalty, _reward);
    setSlashableDowntime(_slashableDowntime);
  }

  /**
   * @notice Sets the slashable downtime.
   * @param interval Slashable downtime in blocks.
   */
  function setSlashableDowntime(uint256 interval) public onlyOwner {
    require(interval != 0, "slashable downtime cannot be zero");
    slashableDowntime = interval;
    emit SlashableDowntimeSet(interval);
  }

  /**
   * @notice Calculates and returns the signature bitmap for the specified interval.
   * This bitmap will contain a one for any validator that signed at least one block in that
   * interval, and zero otherwise.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @return The signature uptime bitmap for the specified interval.
   * @dev startBlock and endBlock must be in the same epoch.
   * @dev The getParentSealBitmap precompile requires that startBlock must be within 4 epochs of 
   * the current block.
   */
  function getBitmapForInterval(uint256 startBlock, uint256 endBlock)
    public
    view
    returns (bytes32)
  {
    require(endBlock >= startBlock, "endBlock must be greater or equal than startBlock");
    // The signature bitmap for block N is stored in block N+1.
    // The latest block is `block.number - 1`, which stores the signature bitmap for
    // `block.number - 2`.
    uint256 lastBlockWithSignatureBitmap = block.number.sub(2);
    require(
      endBlock <= lastBlockWithSignatureBitmap,
      "the signature bitmap for endBlock is not yet available"
    );
    uint256 epochSize = getEpochSize();
    require(
      block.number.sub(startBlock) < epochSize.mul(4),
      "startBlock must be within 4 epochs of the current head"
    );
    require(
      epochNumberOfBlock(startBlock, epochSize) == epochNumberOfBlock(endBlock, epochSize),
      "startBlock and endBlock must be in the same epoch"
    );

    bytes32 bitmap;
    for (uint256 blockNumber = startBlock; blockNumber <= endBlock; blockNumber.add(1)) {
      // The canonical signatures for block N are stored in the parent seal bitmap for block N+1.
      bitmap |= getParentSealBitmap(blockNumber.add(1));
    }

    return bitmap;
  }

  /**
   * @notice Calculates and sets the signature bitmap for the specified interval.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @return The signature bitmap for the specified interval.
   * @dev startBlock and endBlock must be in the same epoch.
   */
  function setBitmapForInterval(uint256 startBlock, uint256 endBlock) public returns (bytes32) {
    require(!isBitmapSetForInterval(startBlock, endBlock), "bitmap already set");

    bytes32 bitmap = getBitmapForInterval(startBlock, endBlock);
    bitmaps[msg.sender][startBlock][endBlock] = bitmap;

    emit BitmapSetForInterval(startBlock, endBlock, bitmap);

    return bitmap;
  }

  /**
   * @notice Returns true if the validator did not sign any blocks in the specified interval.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @param signerIndex Index of the signer within the validator set.
   * @return True if the validator did not sign any blocks in the specified interval.
   * @dev Both startBlock and endBlock should be part of the same epoch.
   */
  function wasDownForInterval(uint256 startBlock, uint256 endBlock, uint256 signerIndex)
    public
    view
    returns (bool)
  {
    require(signerIndex < numberValidatorsInSet(startBlock), "bad validator index at start block");
    require(
      isBitmapSetForInterval(startBlock, endBlock),
      "bitmap for specified interval not yet set"
    );

    return (bitmaps[msg.sender][startBlock][endBlock] & bytes32(1 << signerIndex)) == 0;
  }

  /**
   * @notice Returns true if the bitmap has been set for the specified interval.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @return True if the bitmap has been set for the specified interval.
   */
  function isBitmapSetForInterval(uint256 startBlock, uint256 endBlock) public view returns (bool) {
    // It's impossible to have all the validators down in an interval.
    return bitmaps[msg.sender][startBlock][endBlock] != 0;
  }

  /**
   * @notice Returns true if a validator has been down for the specified overlapping or adjacent
   * intervals.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   * @param signerIndices Indices of the signer within the validator set for every epoch change.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function wasDownForIntervals(
    uint256[] memory startBlocks,
    uint256[] memory endBlocks,
    uint256[] memory signerIndices
  ) public view returns (bool) {
    require(startBlocks.length > 0, "requires at least one interval");
    require(
      startBlocks.length == endBlocks.length,
      "startBlocks and endBlocks must have the same length"
    );
    require(signerIndices.length > 0, "requires at least one signerIndex");

    uint256 epochSize = getEpochSize();
    uint256 signerIndicesIndex = 0;
    for (uint256 i = 0; i < startBlocks.length; i = i.add(1)) {
      if (i > 0) {
        require(
          startBlocks[i.sub(1)] < startBlocks[i],
          "each interval must start after the start of the previous interval"
        );
        require(
          startBlocks[i] <= endBlocks[i.sub(1)].add(1),
          "each interval must start at most one block after the end of the previous interval"
        );
        require(
          endBlocks[i.sub(1)] < endBlocks[i],
          "each interval must end after the end of the previous interval"
        );
        // The signer index of a particular validator may change from epoch to epoch.
        // Because the intervals for which bitmaps are calculated in this contract do not span
        // epochs, and because intervals processed by this function are guaranteed to be
        // overlapping or contiguous, whenever we cross epoch boundaries we are guaranteed to
        // process an interval that starts with the first block of that epoch.
        if (startBlocks[i].mod(epochSize) == 1) {
          require(
            getValidatorAccountFromSignerIndex(
              signerIndices[signerIndicesIndex],
              startBlocks[i].sub(1)
            ) ==
              getValidatorAccountFromSignerIndex(
                signerIndices[signerIndicesIndex.add(1)],
                startBlocks[i]
              ),
            "indices do not point to the same validator"
          );
          signerIndicesIndex = signerIndicesIndex.add(1);
        }
      }
      if (!wasDownForInterval(startBlocks[i], endBlocks[i], signerIndices[signerIndicesIndex])) {
        return false;
      }
    }

    return true;
  }

  /**
   * @notice Slashes a validator that did not sign any blocks for at least `slashableDowntime`.
   * @param startBlocks A list of interval start blocks for which signature bitmaps have already
   * been set.
   * @param endBlocks A list of interval end blocks for which signature bitmaps have already
   * been set.
   * @param signerIndices The index of the provided validator for each epoch over which the
   * provided intervals span.
   * @param groupMembershipHistoryIndex Group membership index from where
   * the group should be found (For start block).
   * @param validatorElectionLessers Lesser pointers for validator slashing.
   * @param validatorElectionGreaters Greater pointers for validator slashing.
   * @param validatorElectionIndices Vote indices for validator slashing.
   * @param groupElectionLessers Lesser pointers for group slashing.
   * @param groupElectionGreaters Greater pointers for group slashing.
   * @param groupElectionIndices Vote indices for group slashing.
   * @dev startBlocks[0] will be use as the startBlock of the slashableDowntime.
   */
  function slash(
    uint256[] memory startBlocks,
    uint256[] memory endBlocks,
    uint256[] memory signerIndices,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public {
    uint256 startBlock = startBlocks[0];
    uint256 endBlock = endBlocks[endBlocks.length.sub(1)];
    require(
      endBlock.sub(startBlock).add(1) >= slashableDowntime,
      "the provided intervals must span slashableDowntime blocks"
    );
    address validator = getValidatorAccountFromSignerIndex(signerIndices[0], startBlock);
    require(
      startBlock > lastSlashedBlock[validator],
      "cannot slash validator for downtime for which they may already have been slashed"
    );
    require(wasDownForIntervals(startBlocks, endBlocks, signerIndices), "not down");
    lastSlashedBlock[validator] = endBlock;
    performSlashing(
      validator,
      msg.sender,
      startBlock,
      groupMembershipHistoryIndex,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    emit DowntimeSlashPerformed(validator, startBlock, endBlock);
  }

  /**
   * @notice Returns the validator's address of the signer for a specific block number.
   * @param signerIndex Index of the signer within the validator set for a specific epoch.
   * @param blockNumber Block number where the validator was elected.
   * @return Validator's address.
   */
  function getValidatorAccountFromSignerIndex(uint256 signerIndex, uint256 blockNumber)
    internal
    view
    returns (address)
  {
    return getAccounts().signerToAccount(validatorSignerAddressFromSet(signerIndex, blockNumber));
  }
}

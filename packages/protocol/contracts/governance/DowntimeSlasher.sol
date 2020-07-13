pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

/// @dev Version: 2.0.0.0
contract DowntimeSlasher is SlasherUtil {
  using SafeMath for uint256;

  // Maps validator address -> last block of the interval for which it has been slashed.
  mapping(address => uint256) lastSlashedBlock;

  // Maps validator -> startBlock -> endBlock -> signature bitmap for that interval.
  // Note that startBlock and endBlock must always be in the same epoch.
  mapping(address => mapping(uint256 => mapping(uint256 => bytes32))) private bitmaps;

  uint256 public slashableDowntime;

  event SlashableDowntimeSet(uint256 interval);
  event DowntimeSlashPerformed(address indexed validator, uint256 indexed startBlock);
  event BitmapSetForInterval(uint256 indexed startBlock, uint256 indexed endblock, bytes32 bitmap);

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
    require(interval < getEpochSize(), "slashable downtime must be smaller than epoch size");
    slashableDowntime = interval;
    emit SlashableDowntimeSet(interval);
  }

  /**
   * @notice Calculates and returns the signature bitmap for the specified interval.
   * Similar to the parentSealBitmap of every block (where you have which validators were
   * able to sign the previous block), this bitmap shows for that specific interval which
   * validators signed at least one block
   * @param startBlock First block of the downtime interval.
   * @param endBlock Last block of the downtime interval.
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
    // The sealBitmap for the block N is stored in the block N+1
    // (block.number - 1) is the currentBlock, and because we don't have the sealBitmap for
    // the currentBlock, we should check against (currentBlock - 1).
    uint256 lastBlockWithParentSealBitmap = block.number.sub(2);
    require(
      endBlock <= lastBlockWithParentSealBitmap,
      "endBlock's parentSealBitmap is not yet available"
    );
    uint256 epochSize = getEpochSize();
    require(
      lastBlockWithParentSealBitmap.sub(startBlock) <= epochSize.mul(4),
      "startBlock must be within 4 epochs of the current head"
    );
    require(
      epochNumberOfBlock(startBlock, epochSize) == epochNumberOfBlock(endBlock, epochSize),
      "startBlock and endBlock must be in the same epoch"
    );

    bytes32 bitmap;
    for (uint256 n = startBlock; n <= endBlock; n++) {
      // The canonical signatures for block N are stored in the parent seal bitmap for block N+1.
      bitmap |= getParentSealBitmap(n.add(1));
    }

    return bitmap;
  }

  /**
   * @notice Calculates and sets the signature bitmap for the specified interval.
   * @param startBlock First block of the downtime interval.
   * @param endBlock Last block of the downtime interval.
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
   * @notice Check if a validator appears down in the bitmap for the interval of blocks.
   * Both startBlock and endBlock should be part of the same epoch.
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @param signerIndex Index of the signer within the validator set.
   * @return True if the validator does not appear in the bitmap of the interval.
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
   * @notice Shows if the user already called setBitmapForInterval for
   * the specific interval.
   * @param startBlock First block of a calculated downtime interval.
   * @param endBlock Last block of the calculated downtime interval.
   * @return True if the user already called setBitmapForInterval for
   * the specific interval.
   */
  function isBitmapSetForInterval(uint256 startBlock, uint256 endBlock) public view returns (bool) {
    // It's impossible to have all the validators down in a interval.
    return bitmaps[msg.sender][startBlock][endBlock] != 0;
  }

  /**
   * @notice Returns true if a validator has been down for the specified overlapping or adjacent
   * intervals.
   * @param startBlocks startBlocks of the specified intervals.
   * @param endBlocks endBlocks of the specified intervals.
   * @param signerIndices Indices of the signers within the validator set for every epoch change.
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
          "each interval must start after the previous interval's start"
        );
        require(
          startBlocks[i] <= endBlocks[i.sub(1)].add(1),
          "each interval must start at least one block after previous interval's end"
        );
        require(
          endBlocks[i.sub(1)] < endBlocks[i],
          "each interval must end after the previous interval"
        );
        // The signer index of a particular validator may change from epoch to epoch.
        // Because the intervals for which bitmaps are calculated in this contract do not span
        // epochs, and because intervals processed by this function are guaranteed to be
        // overlapping or contiguous, whenever we cross epoch boundaries we are guaranteed to
        // process an interval that starts with the first block of that epoch.
        if (startBlocks[i].sub(1).mod(epochSize) == 0) {
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
   * @notice Add to the validator a new lastSlashedBlock if the validator was not already slashed
   * in the same epoch of the startBlock and if the blocks to slash are newer than the last one
   */
  function addValidatorSlash(address validator, uint256 startBlock, uint256 endBlock) internal {
    uint256 validatorLastSlashedBlock = lastSlashedBlock[validator];

    require(validatorLastSlashedBlock < startBlock, "validator has a newer slash");

    if (validatorLastSlashedBlock > 0) {
      uint256 startEpoch = getEpochNumberOfBlock(startBlock);
      uint256 lastSlashedEpoch = getEpochNumberOfBlock(validatorLastSlashedBlock);

      require(lastSlashedEpoch != startEpoch, "already slashed in that epoch");
    }

    lastSlashedBlock[validator] = endBlock;
  }

  /**
   * @notice Requires that `wasDownForIntervals` returns true and that the account corresponding
   * to `signer` has not already been slashed for the same startBlocks[0] epoch, or a newer block.
   * If so, fetches the `account` associated with `signer` and the group that
   * `signer` was a member of during the corresponding epoch.
   * Then, calls `LockedGold.slash` on both the validator and group accounts.
   * Calls `Validators.removeSlashedMember` to remove the validator from its
   * current group if it is a member of one.
   * Finally, stores that (account, epochNumber) has been slashed.
   * @param startBlocks List of blocks that starts a previously validated interval.
   * StartBlocks[0] will be use as the startBlock of the slashableDowntime.
   * @param endBlocks List of blocks that ends a previously validated interval.
   * @param signerIndices Validator indices for every epoch revised.
   * @param groupMembershipHistoryIndex Group membership index from where
   * the group should be found (For start block).
   * @param validatorElectionLessers Lesser pointers for validator slashing.
   * @param validatorElectionGreaters Greater pointers for validator slashing.
   * @param validatorElectionIndices Vote indices for validator slashing.
   * @param groupElectionLessers Lesser pointers for group slashing.
   * @param groupElectionGreaters Greater pointers for group slashing.
   * @param groupElectionIndices Vote indices for group slashing.
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
    require(startBlocks.length > 0, "requires at least one interval");
    require(signerIndices.length > 0, "requires at least one signerIndex");
    address validator = getValidatorAccountFromSignerIndex(signerIndices[0], startBlocks[0]);
    uint256 endBlock = startBlocks[0].add(slashableDowntime).sub(1);
    addValidatorSlash(validator, startBlocks[0], endBlock);
    require(
      endBlock <= endBlocks[endBlocks.length.sub(1)],
      "the intervals are not covering the slashableDowntime window"
    );
    require(wasDownForIntervals(startBlocks, endBlocks, signerIndices), "not down");
    performSlashing(
      validator,
      msg.sender,
      startBlocks[0],
      groupMembershipHistoryIndex,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    emit DowntimeSlashPerformed(validator, startBlocks[0]);
  }

  function getValidatorAccountFromSignerIndex(uint256 signerIndex, uint256 blockNumber)
    internal
    view
    returns (address)
  {
    return getAccounts().signerToAccount(validatorSignerAddressFromSet(signerIndex, blockNumber));
  }
}

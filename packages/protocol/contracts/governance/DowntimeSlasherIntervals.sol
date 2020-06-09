pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DowntimeSlasherIntervals is SlasherUtil {
  using SafeMath for uint256;

  // Maps validator address -> epoch number -> a list of block intervals for which the validator has been slashed.
  mapping(address => mapping(uint256 => uint256[2])) slashedIntervals;

  // Maps startBlock -> endBlock -> signature bitmap for that interval.
  // Note that startBlock and endBlock must always be in the same epoch.
  mapping(address => mapping(uint256 => mapping(uint256 => uint256))) private bitmaps;

  uint256 public slashableDowntime;

  event SlashableDowntimeSet(uint256 interval);
  event DowntimeSlashPerformed(address indexed validator, uint256 indexed startBlock);
  event BitmapSetForInterval(
    address indexed user,
    uint256 indexed startBlock,
    uint256 indexed endblock
  );

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _penalty Penalty for the slashed signer.
   * @param _reward Reward that the observer gets.
   * @param _slashableDowntime Slashable downtime in blocks.
   * epoch of the StartBlock
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
   * @notice Sets the slashable downtime
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
   * @param startBlock First block of the downtime interval.
   * @param endBlock Last block of the downtime interval.
   * @return The signature bitmap for the specified interval.
   * @dev startBlock and endBlock must be in the same epoch.
   * @dev The getParentSealBitmap precompile requires that startBlock must be within 4 epochs of 
   * the current block.
   */
  function getBitmapForInterval(uint256 startBlock, uint256 endBlock)
    public
    view
    returns (uint256)
  {
    uint256 epochSize = getEpochSize();
    // The sealBitmap for the block N is stored in the block N+1
    // (block.number - 1) is the currentBlock, and because we don't have the sealBitmap for
    // the currentBlock, we should check against (currentBlock - 1)
    uint256 lastBlockWithParentSeal = block.number.sub(2);
    require(endBlock >= startBlock, "endBlock must be bigger or equal than startBlock");
    require(
      endBlock <= lastBlockWithParentSeal,
      "endBlock must be smaller than the currentBlock - 1 (Requiere the parentSealBitmap)"
    );
    require(
      lastBlockWithParentSeal.sub(startBlock) <= epochSize.mul(4),
      "startBlock must be within 4 epochs of the current head."
    );
    require(
      epochNumberOfBlock(startBlock, epochSize) == epochNumberOfBlock(endBlock, epochSize),
      "startBlock and endBlock must be in the same epoch"
    );

    uint256 bitmap;
    // The canonical signatures for block N are stored in the parent seal bitmap for block N+1
    for (uint256 n = startBlock; n <= endBlock; n++) {
      bitmap |= uint256(getParentSealBitmap(n.add(1)));
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
  function setBitmapForInterval(uint256 startBlock, uint256 endBlock) public returns (uint256) {
    require(!bitmapSetForInterval(startBlock, endBlock), "bitmap already set");

    uint256 bitmap = getBitmapForInterval(startBlock, endBlock);
    bitmaps[msg.sender][startBlock][endBlock] = bitmap;

    emit BitmapSetForInterval(msg.sender, startBlock, endBlock);

    return bitmap;
  }

  /**
   * @notice Test if a validator has been down for an specific interval of blocks.
   * If the user already has called the method "setBitmapForInterval", for
   * the same interval (startBlock, endBlock), it will use that bitmap
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the interval.
   * @param signerIndex Index of the signer within the validator set.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function wasDownForInterval(uint256 startBlock, uint256 endBlock, uint256 signerIndex)
    public
    view
    returns (bool)
  {
    require(signerIndex < numberValidatorsInSet(startBlock), "bad validator index at start block");
    require(bitmapSetForInterval(startBlock, endBlock), "the bitmap must be set before");

    return (bitmaps[msg.sender][startBlock][endBlock] & (1 << signerIndex)) == 0;
  }

  /**
   * @notice Shows if the user already called the setBitmapForInterval for
   * the specific interval
   * @param startBlock First block of a calculated downtime interval.
   * @param endBlock Last block of the calculated downtime interval.
   * @return True if the user already called the setBitmapForInterval for
   * the specific interval
   */
  function bitmapSetForInterval(uint256 startBlock, uint256 endBlock) public view returns (bool) {
    // It's impossible to have all the validators down in a interval
    return bitmaps[msg.sender][startBlock][endBlock] != 0;
  }

  /**
   * @notice Test if a validator has been down for an specific chain of intervals.
   * Requires to:
   *   - previously called 'setBitmapForInterval' for every pair
   * (startBlocks(i), endBlocks(i))
   *   - startBlocks(0) is the startBlock of the slashableDowntime
   *   - startBlock(i) < startBlock(i+1)
   *   - endBlocks(i) is included in the interval [startBlocks(i+1) - 1, endBlocks(i+1))
   * @param startBlocks List of blocks that starts a previously validated interval.
   * startBlocks[0] will be use as the startBlock of the slashableDowntime
   * @param endBlocks List of blocks that ends a previously validated interval.
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
          "every startBlock must be bigger than the last one"
        );
        require(
          endBlocks[i.sub(1)] >= startBlocks[i].sub(1) && endBlocks[i.sub(1)] < endBlocks[i],
          "at least one endBlock is not in the boundaries of the next interval"
        );
        // is first block of Epoch
        if (startBlocks[i].sub(1).mod(epochSize) == 0) {
          require(
            getValidatorFromSigner(signerIndices[signerIndicesIndex], startBlocks[i].sub(1)) ==
              getValidatorFromSigner(signerIndices[signerIndicesIndex.add(1)], startBlocks[i]),
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
   * @notice Returns the end block for the interval required for slashing.
   */
  function getEndBlockForSlashing(uint256 startBlock) internal view returns (uint256) {
    return startBlock.add(slashableDowntime).sub(1);
  }

  /**
   * @notice Add to the validator a new slashedInterval if the validator was not already
   * slashed in the same epoch of the startBlock or by a previous interval that contains al 
   * least a block of the new interval
   */
  function addNewSlashIntervalToValidator(address validator, uint256 startBlock, uint256 endBlock)
    internal
  {
    uint256 startEpoch = getEpochNumberOfBlock(startBlock);
    uint256 endEpoch = getEpochNumberOfBlock(endBlock);

    uint256[2] memory blockInterval = slashedIntervals[validator][startEpoch];
    require(blockInterval[0] == 0 && blockInterval[1] == 0, "already slashed in that epoch");

    // Check possible crossing epoch slash from the last epoch
    blockInterval = slashedIntervals[validator][startEpoch.sub(1)];
    require(blockInterval[1] < startBlock, "slash shares blocks with another slash");

    // Check possible crossing epoch slash from the epoch of the endEpoch
    if (startEpoch != endEpoch) {
      blockInterval = slashedIntervals[validator][endEpoch];
      require(
        blockInterval[0] == 0 || endBlock < blockInterval[0],
        "slash shares blocks with another slash"
      );
    }

    slashedIntervals[validator][startEpoch] = [startBlock, endBlock];
  }

  /**
   * @notice Requires that `wasDownForIntervals` returns true and that the account corresponding
   * to `signer` has not already been slashed for the same startBlocks[0] epoch, or share blocks
   * with slashes of other epochs
   * If so, fetches the `account` associated with `signer` and the group that
   * `signer` was a member of during the corresponding epoch.
   * Then, calls `LockedGold.slash` on both the validator and group accounts.
   * Calls `Validators.removeSlashedMember` to remove the validator from its
   * current group if it is a member of one.
   * Finally, stores that (account, epochNumber) has been slashed.
   * @param startBlocks List of blocks that starts a previously validated interval.
   * startBlocks[0] will be use as the startBlock of the slashableDowntime
   * @param endBlocks List of blocks that ends a previously validated interval.
   * @param signerIndices Validator indices for every epoch revised.
   * @param groupMembershipHistoryIndex Group membership index from where
   * the group should be found. (For start block)
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
    address validator = getValidatorFromSigner(signerIndices[0], startBlocks[0]);
    uint256 endBlock = startBlocks[0].add(slashableDowntime).sub(1);
    addNewSlashIntervalToValidator(validator, startBlocks[0], endBlock);
    require(wasDownForIntervals(startBlocks, endBlocks, signerIndices), "not down");
    require(
      endBlock <= endBlocks[endBlocks.length.sub(1)],
      "the intervals are not covering the slashableDowntime window"
    );
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

  function getValidatorFromSigner(uint256 signerIndex, uint256 blockNumber)
    internal
    view
    returns (address)
  {
    return getAccounts().signerToAccount(validatorSignerAddressFromSet(signerIndex, blockNumber));
  }
}

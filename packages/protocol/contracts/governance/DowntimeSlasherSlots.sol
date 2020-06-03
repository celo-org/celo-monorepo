pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DowntimeSlasherSlots is SlasherUtil {
  using SafeMath for uint256;

  // Intervals previously slashed
  struct SlashedInterval {
    // startBlock of the slashed interval
    uint256 startBlock;
    // endBlock of the slashed interval. Although this could be calculated, as the downtime interval
    // could be changed, we store the calculated end to avoid future errors if the interval changes.
    uint256 endBlock;
  }

  // Accumulated ParentSealBitmap of every validator
  struct ValidatedSlot {
    // uint256 endBlock;
    // Accumulated ParentSealBitmap of the Slot
    // The array will have 2 elements if the slot shares two epochs
    uint256[2] validatorsUpAccumulator;
  }

  // For each address, associate each epoch with the last block that was slashed on that epoch
  mapping(address => mapping(uint256 => SlashedInterval[])) lastSlashedBlock;

  // For each user a map of StartBlock to a map of EndBlock to an array of accumulated ParentSealBitmap for the Slot
  // The Accumulated ParentSealBitmap array will have 2 elements (the last different than zero) if and
  // only if the slot shares two epochs
  mapping(address => mapping(uint256 => mapping(uint256 => uint256[2]))) private userValidatedSlotProofs;

  uint256 public slashableDowntime;
  uint256 public slotSize;
  bool public oncePerEpoch;

  event SlashableDowntimeSet(uint256 interval);
  event OncePerEpochSet(bool oncePerEpoch);
  event DowntimeSlashPerformed(address indexed validator, uint256 indexed startBlock);
  event SlotValidationPerformed(
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
   * @param _oncePerEpoch If true, the validator will only be slashed once per 
   * epoch of the StartBlock
   */
  function initialize(
    address registryAddress,
    uint256 _penalty,
    uint256 _reward,
    uint256 _slashableDowntime,
    bool _oncePerEpoch
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setSlashingIncentives(_penalty, _reward);
    setSlashableDowntime(_slashableDowntime);
    setOncePerEpoch(_oncePerEpoch);
  }

  /**
   * @notice Sets the slashable downtime
   * @param interval Slashable downtime in blocks.
   */
  function setSlashableDowntime(uint256 interval) public onlyOwner {
    require(interval != 0, "Slashable downtime cannot be zero");
    require(interval < getEpochSize(), "Slashable downtime must be smaller than epoch size");
    slashableDowntime = interval;
    emit SlashableDowntimeSet(interval);
  }

  /**
   * @notice Enables/Disables the possibility of multiple slashes in the same epoch, taking in
   * count that every slashable window, won't share any block, and the epoch is the one of the 
   * StartBlock.
   * Example: the SlashableDowntime is set to 10 hours. A validator was down all the epoch (24hs)
   * the validator could be slashed for the first 10 hours and the last 10 hours of the epoch.
   * @param _oncePerEpoch Slot size in which the downtime validation will be divided.
   */
  function setOncePerEpoch(bool _oncePerEpoch) public onlyOwner {
    oncePerEpoch = _oncePerEpoch;
    emit OncePerEpochSet(_oncePerEpoch);
  }

  /**
   * @notice Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Slot (startBlock, endBlock) for all the signers.
   * If in the middle of the Slot, it changes the Epoch, will
   * calculate one accumulator for the interval [startBlock, epochEndBlock] and 
   * the other for the interval [nextEpochStartBlock, endBlock]
   * @param startBlock First block of the downtime slot.
   * @param endBlock Last block of the downtime slot.
   * @return up bitmaps accumulators for every signer in the Slot. If in the middle of the Slot
   * the epoch change occurs, the first element will have the accumulator of the first epoch, and
   * the second element, the accumulator of the other epoch.
   * Otherwise, the second element will be zero.
   * @dev Due to getParentSealBitmap, startBlock and the whole slot must be within 4 epochs of the
   * current head.
   */
  function calculateSlotUpBitmapAccumulators(uint256 startBlock, uint256 endBlock)
    public
    view
    returns (uint256[2] memory)
  {
    uint256 sz = getEpochSize();
    // currentBlock - 1
    uint256 lastBlockWithParentSeal = block.number.sub(2);
    require(
      endBlock.sub(startBlock) <= slashableDowntime,
      "Range between block must be smaller or equal than the slashable downtime"
    );
    // @Dev comment
    require(
      endBlock <= lastBlockWithParentSeal,
      "end block must be smaller than current block - 1 (Requiere the ParentSealBitmap)"
    );
    // @Dev comment
    require(
      lastBlockWithParentSeal.sub(startBlock) <= sz.mul(4),
      "startBlock must be within 4 epochs of the current head."
    );

    // Epoch 1 starts in the block 1
    uint256 lastBlockOfStartEpoch = epochNumberOfBlock(startBlock, sz).mul(sz);
    assert(lastBlockOfStartEpoch >= startBlock);
    if (endBlock < lastBlockOfStartEpoch) {
      lastBlockOfStartEpoch = endBlock;
    }

    // SafeMath is not used in the following loops to save gas required for conditional checks.
    // Overflow safety is guaranteed by previous checks on the values of the loop parameters.
    uint256[2] memory accumulator;
    // 1) We want to check signers for the block,
    // so we get the parent seal bitmap for the next block
    // 2) To save gas, instead of iterating between n and lastBlockOfStartEpoch
    // and retrieving getParentSealBitmap(n+1), we shift 1 block to use n as the parent
    for (uint256 n = startBlock + 1; n <= (lastBlockOfStartEpoch + 1); n++) {
      accumulator[0] |= uint256(getParentSealBitmap(n));
    }

    // Same comments as the last 'for', but for the second epoch
    for (uint256 n = lastBlockOfStartEpoch + 2; n <= (endBlock + 1); n++) {
      accumulator[1] |= uint256(getParentSealBitmap(n));
    }
    return accumulator;
  }

  /**
   * @notice Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Slot (startBlock, endBlock) and SAVE it to have a proof that this was already calculated.
   * If in the middle of the Slot, it changes the Epoch, will calculate one accumulator for the
   * interval [startBlock, epochEndBlock] and the other for 
   * the interval [nextEpochStartBlock, endBlock]
   * If the Slot was calculated before, won't calculate anything and will return the last proof
   * @param startBlock First block of the downtime slot.
   * @param endBlock Last block of the downtime slot.
   * @return up bitmaps accumulators for every signer in the Slot. If in the middle of the Slot
   * the epoch change occurs, the first element will have the accumulator of the first epoch, and
   * the second element, the accumulator of the other epoch.
   * Otherwise, the second element will be zero.
   */
  function generateProofOfSlotValidation(uint256 startBlock, uint256 endBlock)
    public
    returns (uint256[2] memory)
  {
    if (slotAlreadyCalculated(startBlock, endBlock)) {
      return userValidatedSlotProofs[msg.sender][startBlock][endBlock];
    }
    uint256[2] memory accumulators = calculateSlotUpBitmapAccumulators(startBlock, endBlock);
    userValidatedSlotProofs[msg.sender][startBlock][endBlock] = accumulators;

    emit SlotValidationPerformed(msg.sender, startBlock, endBlock);

    return accumulators;
  }

  /**
   * @notice Test if a validator has been down for an specific slot of blocks.
   * If the user already has called the method "generateProofOfSlotValidation", for
   * the same Slot (startBlock, endBlock), it will use those accumulators
   * @param startBlock First block of the downtime.
   * @param endBlock Last block of the downtime slot.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function isDownForSlot(
    uint256 startBlock,
    uint256 endBlock,
    uint256 startSignerIndex,
    uint256 endSignerIndex
  ) public view returns (bool) {
    require(
      startSignerIndex < numberValidatorsInSet(startBlock),
      "Bad validator index at start block"
    );
    // Ensure that the start and end validator signer indices are valid.
    require(endSignerIndex < numberValidatorsInSet(endBlock), "Bad validator index at end block");
    address startSigner = validatorSignerAddressFromSet(startSignerIndex, startBlock);
    address endSigner = validatorSignerAddressFromSet(endSignerIndex, endBlock);
    IAccounts accounts = getAccounts();
    require(
      accounts.signerToAccount(startSigner) == accounts.signerToAccount(endSigner),
      "Signers do not match"
    );

    if (!slotAlreadyCalculated(startBlock, endBlock)) {
      uint256[2] memory accumulatedBitmaps = calculateSlotUpBitmapAccumulators(
        startBlock,
        endBlock
      );
      return isDownUsingUpAccumulatedBitmaps(startSignerIndex, endSignerIndex, accumulatedBitmaps);
    }

    return isDownUsingCalculatedSlot(startBlock, endBlock, startSignerIndex, endSignerIndex);
  }

  /**
   * @notice Shows if the user already called the generateProofOfSlotValidation for
   * the specific slot
   * @param startBlock First block of a calculated downtime Slot.
   * @param endBlock Last block of the calculated downtime Slot.
   * @return True if the user already called the generateProofOfSlotValidation for
   * the specific slot
   */
  function slotAlreadyCalculated(uint256 startBlock, uint256 endBlock) public view returns (bool) {
    uint256[2] memory validatorsUpAccumulator = userValidatedSlotProofs[msg
      .sender][startBlock][endBlock];
    // It's impossible to have all the validators down in a slot
    return validatorsUpAccumulator[0] != 0 || validatorsUpAccumulator[1] != 0;
  }

  /**
   * @notice Validast is the signer was down for the specific Slot
   */
  function isDownUsingCalculatedSlot(
    uint256 startBlock,
    uint256 endBlock,
    uint256 startSignerIndex,
    uint256 endSignerIndex
  ) internal view returns (bool) {
    uint256[2] memory validatorsUpAccumulator = userValidatedSlotProofs[msg
      .sender][startBlock][endBlock];
    return
      isDownUsingUpAccumulatedBitmaps(startSignerIndex, endSignerIndex, validatorsUpAccumulator);
  }

  /**
   * @notice Validates if the signerIndexes are down in both up bitmaps accumulators
   */
  function isDownUsingUpAccumulatedBitmaps(
    uint256 startSignerIndex,
    uint256 endSignerIndex,
    uint256[2] memory upAccumulatedBitmaps
  ) internal view returns (bool) {
    return
      (upAccumulatedBitmaps[0] & (1 << startSignerIndex) == 0) &&
      (upAccumulatedBitmaps[1] & (1 << endSignerIndex) == 0);
  }

  /**
   * @notice Test if a validator has been down for an specific chain of slots.
   * Requires to:
   *   - previously called 'generateProofOfSlotValidation' for every pair
   * (startSlots(i), endSlots(i))
   *   - startBlock is included in the inital slot interval [startSlots(0), endSlots(0)]
   *   - endSlots(i) is included in the interval [startSlots(i+1) - 1, endSlots(i+1)]
   *   - (startBlock, startBlock+SlashableDowntime) be covered by (startSlots(0), endSlots(n))
   * @param startBlock First block of a calculated downtime Slot.
   * Last block will be computed from this.
   * @param startSlots List of blocks that starts a previously validated slot.
   * @param endSlots List of blocks that ends a previously validated slot.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function isDown(
    uint256 startBlock,
    uint256[] memory startSlots,
    uint256[] memory endSlots,
    uint256 startSignerIndex,
    uint256 endSignerIndex
  ) public view returns (bool) {
    require(startBlock > 0, "StartBlock should be bigger than 0");
    require(startSlots.length > 0, "Requires at least one slot");
    require(
      startSlots.length == endSlots.length,
      "StartSlots and EndSlots must have the same length"
    );
    uint256 endBlock = getEndBlockForSlashing(startBlock);
    uint256 sz = getEpochSize();
    uint256 epochChangeBlock = epochNumberOfBlock(startBlock, sz).mul(sz).add(1);
    uint256 indexActualEpoch = startSignerIndex;
    uint256 lastEndSlot = startBlock.sub(1);
    for (uint256 i = 0; i < startSlots.length; i += 1) {
      require(slotAlreadyCalculated(startSlots[i], endSlots[i]), "Invalid slot");
      require(
        lastEndSlot >= startSlots[i].sub(1) && lastEndSlot <= endSlots[i],
        "StartBlock or at least one endSlot is not in te boundaries of the next slot"
      );
      if (startSlots[i] >= epochChangeBlock) {
        indexActualEpoch = endSignerIndex;
      }
      if (
        !isDownUsingCalculatedSlot(startSlots[i], endSlots[i], indexActualEpoch, endSignerIndex)
      ) {
        return false;
      }
      lastEndSlot = endSlots[i];
      // Could be covered with less slots
      if (lastEndSlot >= endBlock) {
        return true;
      }
    }

    require(lastEndSlot >= endBlock, "The slots are not covering the SlashableDowntime window");

    return true;
  }

  /**
   * @notice Returns the end block for the interval required for slashing.
   */
  function getEndBlockForSlashing(uint256 startBlock) internal view returns (uint256) {
    return startBlock.add(slashableDowntime).sub(1);
  }

  /**
   * @notice Add to the validator a new SlashedInterval if the validator was not already
   * slashed by a previous interval that contains al least a block of the new interval.
   * If the oncePerEpoch flag is set, won't allow two slashes in the same epoch for the same
   * validator 
   */
  function addNewSlashIntervalToValidator(address validator, uint256 startBlock) internal {
    uint256 endBlock = getEndBlockForSlashing(startBlock);
    uint256 startEpoch = getEpochNumberOfBlock(startBlock);
    uint256 endEpoch = getEpochNumberOfBlock(endBlock);

    SlashedInterval[] storage intervals = lastSlashedBlock[validator][startEpoch];
    // The oncePerEpoch=true validation
    require(!oncePerEpoch || intervals.length < 1, "Already slashed in that epoch");

    for (uint256 i = 0; i < intervals.length; i = i.add(1)) {
      require(
        intervals[i].endBlock < startBlock || intervals[i].startBlock > endBlock,
        "Slash shares blocks with another slash"
      );
    }

    if (startEpoch != endEpoch) {
      intervals = lastSlashedBlock[validator][endEpoch];
      for (uint256 i = 0; i < intervals.length; i = i.add(1)) {
        require(
          intervals[i].endBlock < startBlock || intervals[i].startBlock > endBlock,
          "Slash shares blocks with another slash"
        );
      }
    }
    lastSlashedBlock[validator][startEpoch].push(
      SlashedInterval({ startBlock: startBlock, endBlock: endBlock })
    );
  }

  /**
   * @notice Requires that `isDown` returns true and that the account corresponding to
   * `signer` has not already been slashed for downtime for a previous interval of
   * blocks that includes at least one block of the new downtime interval.
   * If so, fetches the `account` associated with `signer` and the group that
   * `signer` was a member of during the corresponding epoch.
   * Then, calls `LockedGold.slash` on both the validator and group accounts.
   * Calls `Validators.removeSlashedMember` to remove the validator from its
   * current group if it is a member of one.
   * Finally, stores that (account, epochNumber) has been slashed.
   * Requires to:
   *   - previously called 'generateProofOfSlotValidation' for every pair
   * (startSlots(i), endSlots(i))
   *   - startBlock is included in the inital slot interval [startSlots(0), endSlots(0)]
   *   - endSlots(i) is included in the interval [startSlots(i+1) - 1, endSlots(i+1)]
   *   - (startBlock, startBlock+SlashableDowntime) be covered by (startSlots(0), endSlots(n))
   * @param startBlock First block of the downtime.
   * @param startSlots List of blocks that starts a previously validated slot.
   * @param endSlots List of blocks that ends a previously validated slot.
   * @param startSignerIndex Validator index at the first block.
   * @param endSignerIndex Validator index at the last block.
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
    uint256 startBlock,
    uint256[] memory startSlots,
    uint256[] memory endSlots,
    uint256 startSignerIndex,
    uint256 endSignerIndex,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public {
    address validator = getValidatorFromSigner(startSignerIndex, startBlock);
    addNewSlashIntervalToValidator(validator, startBlock);
    require(isDown(startBlock, startSlots, endSlots, startSignerIndex, endSignerIndex), "Not down");
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
    emit DowntimeSlashPerformed(validator, startBlock);
  }

  function getValidatorFromSigner(uint256 startSignerIndex, uint256 startBlock)
    internal
    view
    returns (address)
  {
    return
      getAccounts().signerToAccount(validatorSignerAddressFromSet(startSignerIndex, startBlock));
  }
}

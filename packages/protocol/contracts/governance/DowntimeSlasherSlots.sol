pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DowntimeSlasherSlots is SlasherUtil {
  using SafeMath for uint256;

  // For each address, associate each epoch with the last block that was slashed on that epoch
  mapping(address => mapping(uint256 => uint256)) lastSlashedBlock;

  // For each user, map of StartBlock to Accumulated ParentSealBitmap (the array will have 2 elements if the slot shares two epochs)
  mapping(address => mapping(uint256 => uint256[2])) private userValidatedSlots;

  uint256 public slashableDowntime;
  uint256 public slotSize;

  uint256 constant MAX_SLOT_SIZE = 4320; // 4 hours (1 block/5seg)

  event SlashableDowntimeSet(uint256 interval);
  event SlashableDowntimeSlotSizeSet(uint256 interval);
  event DowntimeSlashPerformed(address indexed validator, uint256 indexed startBlock);

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _penalty Penalty for the slashed signer.
   * @param _reward Reward that the observer gets.
   * @param _slashableDowntime Slashable downtime in blocks.
   * @param _slotSize Slot size that will be used to calculate the downtime.
   */
  function initialize(
    address registryAddress,
    uint256 _penalty,
    uint256 _reward,
    uint256 _slashableDowntime,
    uint256 _slotSize
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setSlashingIncentives(_penalty, _reward);
    setSlashableDowntime(_slashableDowntime);
    setSlashableDowntimeSlotSize(_slotSize);
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

  function setSlashableDowntimeSlotSize(uint256 _slotSize) public onlyOwner {
    require(_slotSize != 0, "Slot size cannot be zero");
    require(
      _slotSize <= MAX_SLOT_SIZE,
      "Slot size must be smaller than MAX_SLOT_SIZE, otherwise could lead to gas issues"
    );
    require(_slotSize < getEpochSize(), "Slot size must be smaller than epoch size");

    slotSize = _slotSize;
    emit SlashableDowntimeSlotSizeSet(_slotSize);
  }

  /**
   * @dev Due to getParentSealBitmap, startBlock and the whole slot must be within 4 epochs of the current head.
   */
  function calculateSlotDowns(uint256 startBlock, uint256 endBlock) internal {
    uint256 sz = getEpochSize();
    uint256 currentBlock = block.number.sub(1);
    // @Dev comment
    require(
      currentBlock - startBlock <= sz.mul(4),
      "startBlock must be within 4 epochs of the current head."
    );

    // Epoch 1 starts in the block 1
    uint256 lastBlockOfStartEpoch = epochNumberOfBlock(startBlock, sz).mul(sz).sub(1);
    assert(lastBlockOfStartEpoch >= startBlock);
    if (endBlock < lastBlockOfStartEpoch) {
      lastBlockOfStartEpoch = endBlock;
    }

    // SafeMath is not used in the following loops to save gas required for conditional checks.
    // Overflow safety is guaranteed by previous checks on the values of the loop parameters.
    uint256 accumulator;
    // 1) We want to check signers for the block,
    // so we get the parent seal bitmap for the next block
    // 2) To save gas, instead of iterating between n and lastBlockOfStartEpoch
    // and retrieving getParentSealBitmap(n+1), we shift 1 block to use n as the parent
    for (uint256 n = startBlock + 1; n <= (lastBlockOfStartEpoch + 1); n++) {
      accumulator |= uint256(getParentSealBitmap(n));
    }
    userValidatedSlots[startBlock][0] = accumulator;

    accumulator = 0;
    // Same comments as the last 'for'
    for (uint256 n = lastBlockOfStartEpoch + 2; n <= (endBlock + 1); n++) {
      accumulator |= uint256(getParentSealBitmap(n));
    }
    userValidatedSlots[startBlock][1] = accumulator;
  }

  /**
   * @notice Test if a validator has been down for an specific slot of blocks.
   * @param startBlock First block of the downtime. Last block will be computed from this.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function isDownForSlot(uint256 startBlock, uint256 startSignerIndex, uint256 endSignerIndex)
    public
    returns (bool)
  {
    require(startBlock > 0, "startBlock must be bigger than zero");
    uint256 currentBlock = block.number.sub(1);
    uint256 endBlock = getEndBlockOfSlot(startBlock);
    // Determine the dividing line between the start epoch and the end epoch.
    require(endBlock < currentBlock, "end block must be smaller than current block");
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

    if (!slotAlreadyCalculated(startBlock)) {
      calculateSlotDowns(startBlock, endBlock);
    }

    return isDownUsingCalculatedSlot(startBlock, startSignerIndex, endSignerIndex);
  }

  function slotAlreadyCalculated(uint256 startBlock) internal view returns (bool) {
    // It's impossible to have all the validators down in a slot
    return
      userValidatedSlots[msg.sender][startBlock][0] || serValidatedSlots[msg.sender][startBlock][1];
  }

  function isDownUsingCalculatedSlot(
    uint256 startBlock,
    uint256 startSignerIndex,
    uint256 endSignerIndex
  ) internal view returns (bool) {
    return
      !((userValidatedSlots[msg.sender][startBlock][0] & (1 << startSignerIndex) != 0) ||
        (userValidatedSlots[msg.sender][startBlock][1] & (1 << endSignerIndex) != 0));
  }

  function isDown(uint256 startBlock, uint256 startSignerIndex, uint256 endSignerIndex)
    public
    returns (bool)
  {
    uint256 endBlock = getEndBlockForSlashing(startBlock);
    for (uint256 n = startBlock; n < endBlock; n = n.add(slotSize)) {
      require(slotAlreadyCalculated(n), "Slots missing to be calculated");
      if (!isDownUsingCalculatedSlot(n, startSignerIndex, endSignerIndex)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @notice Returns the end block for the interval.
   */
  function getEndBlockForSlashing(uint256 startBlock) internal view returns (uint256) {
    return startBlock.add(slashableDowntime).sub(1);
  }

  /**
   * @notice Returns the end block for the slot.
   */
  function getEndBlockOfSlot(uint256 startBlock) internal view returns (uint256) {
    return startBlock.add(slotSize).sub(1);
  }

  function checkIfAlreadySlashed(address validator, uint256 startBlock) internal {
    uint256 endBlock = getEndBlockForSlashing(startBlock);
    uint256 startEpoch = getEpochNumberOfBlock(startBlock);
    uint256 endEpoch = getEpochNumberOfBlock(endBlock);
    require(lastSlashedBlock[validator][startEpoch] < startBlock, "Already slashed");
    require(lastSlashedBlock[validator][endEpoch] < startBlock, "Already slashed");
    lastSlashedBlock[validator][startEpoch] = endBlock;
    lastSlashedBlock[validator][endEpoch] = endBlock;
  }

  /**
   * @notice Requires that `isDown` returns true and that the account corresponding to
   * `signer` has not already been slashed for downtime for the epoch
   * corresponding to `startBlock`.
   * If so, fetches the `account` associated with `signer` and the group that
   * `signer` was a member of during the corresponding epoch.
   * Then, calls `LockedGold.slash` on both the validator and group accounts.
   * Calls `Validators.removeSlashedMember` to remove the validator from its
   * current group if it is a member of one.
   * Finally, stores that (account, epochNumber) has been slashed.
   * @param startBlock First block of the downtime.
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
    address validator = getAccounts().signerToAccount(
      validatorSignerAddressFromSet(startSignerIndex, startBlock)
    );
    checkIfAlreadySlashed(validator, startBlock);
    require(isDown(startBlock, startSignerIndex, endSignerIndex), "Not down");
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
}

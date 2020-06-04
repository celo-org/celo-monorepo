pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DowntimeSlasherIntervals is SlasherUtil {
  using SafeMath for uint256;

  // Intervals previously slashed
  struct SlashedInterval {
    // startBlock of the slashed interval
    uint256 startBlock;
    // endBlock of the slashed interval. Although this could be calculated, as the downtime interval
    // could be changed, we store the calculated end to avoid future errors if the interval changes.
    uint256 endBlock;
  }

  // For each address, associate each epoch with the last block that was slashed on that epoch
  mapping(address => mapping(uint256 => SlashedInterval[])) epochSlashedIntervals;

  // For each user a map of StartBlock to a map of EndBlock to an accumulated ParentSealBitmap for the Interval
  mapping(address => mapping(uint256 => mapping(uint256 => uint256))) private userIntervalValidationProof;

  uint256 public slashableDowntime;
  bool public oncePerEpoch;

  event SlashableDowntimeSet(uint256 interval);
  event OncePerEpochSet(bool oncePerEpoch);
  event DowntimeSlashPerformed(address indexed validator, uint256 indexed startBlock);
  event ProofOfIntervalValidationPerformed(
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
   * @param _oncePerEpoch Flag to toggle multiple slashes in the same epoch
   */
  function setOncePerEpoch(bool _oncePerEpoch) public onlyOwner {
    oncePerEpoch = _oncePerEpoch;
    emit OncePerEpochSet(_oncePerEpoch);
  }

  /**
   * @notice Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Interval (startBlock, endBlock) for all the signers.
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the downtime Interval.
   * @param endBlock Last block of the downtime Interval.
   * @return up bitmap accumulator for every signer in the Interval.
   * @dev Due to getParentSealBitmap, startBlock and the whole Interval must be within 4 epochs 
   * of the current head.
   */
  function getBitmapForInterval(uint256 startBlock, uint256 endBlock)
    public
    view
    returns (uint256)
  {
    uint256 epochSize = getEpochSize();
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
      lastBlockWithParentSeal.sub(startBlock) <= epochSize.mul(4),
      "startBlock must be within 4 epochs of the current head."
    );
    require(
      epochNumberOfBlock(startBlock, epochSize) == epochNumberOfBlock(endBlock, epochSize),
      "StartBlock and endBlock should be part of the same interval"
    );

    // SafeMath is not used in the following loops to save gas required for conditional checks.
    // Overflow safety is guaranteed by previous checks on the values of the loop parameters.
    uint256 accumulator;
    // 1) We want to check signers for the block,
    // so we get the parent seal bitmap for the next block
    // 2) To save gas, instead of iterating between n and lastBlockOfStartEpoch
    // and retrieving getParentSealBitmap(n+1), we shift 1 block to use n as the parent
    for (uint256 n = startBlock + 1; n <= (endBlock + 1); n++) {
      accumulator |= uint256(getParentSealBitmap(n));
    }

    return accumulator;
  }

  /**
   * @notice Function that will calculate the accumulated (OR) of the up bitmap for an especific
   * Interval (startBlock, endBlock) and SAVE it to have a proof that this was already calculated.
   * If the Interval was calculated before, won't calculate anything and will return the last proof
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the downtime Interval.
   * @param endBlock Last block of the downtime Interval.
   * @return up bitmap accumulator for every signer in the Interval.
   */
  function generateProofOfIntervalValidation(uint256 startBlock, uint256 endBlock)
    public
    returns (uint256)
  {
    if (intervalProofAlreadyCalculated(startBlock, endBlock)) {
      return userIntervalValidationProof[msg.sender][startBlock][endBlock];
    }
    uint256 accumulator = getBitmapForInterval(startBlock, endBlock);
    userIntervalValidationProof[msg.sender][startBlock][endBlock] = accumulator;

    emit ProofOfIntervalValidationPerformed(msg.sender, startBlock, endBlock);

    return accumulator;
  }

  /**
   * @notice Test if a validator has been down for an specific interval of blocks.
   * If the user already has called the method "generateProofOfIntervalValidation", for
   * the same Interval (startBlock, endBlock), it will use those accumulators
   * Both startBlock and endBlock should be part of the same epoch
   * @param startBlock First block of the interval.
   * @param endBlock Last block of the Interval.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function wasDownForInterval(uint256 startBlock, uint256 endBlock, uint256 startSignerIndex)
    public
    view
    returns (bool)
  {
    require(
      startSignerIndex < numberValidatorsInSet(startBlock),
      "Bad validator index at start block"
    );

    if (!intervalProofAlreadyCalculated(startBlock, endBlock)) {
      uint256 accumulatedBitmap = getBitmapForInterval(startBlock, endBlock);
      return wasDownUsingIntervalBitmap(startSignerIndex, accumulatedBitmap);
    }

    return wasDownUsingIntervalProof(startBlock, endBlock, startSignerIndex);
  }

  /**
   * @notice Shows if the user already called the generateProofOfIntervalValidation for
   * the specific Interval
   * @param startBlock First block of a calculated downtime Interval.
   * @param endBlock Last block of the calculated downtime Interval.
   * @return True if the user already called the generateProofOfIntervalValidation for
   * the specific Interval
   */
  function intervalProofAlreadyCalculated(uint256 startBlock, uint256 endBlock)
    public
    view
    returns (bool)
  {
    // It's impossible to have all the validators down in a Interval
    return userIntervalValidationProof[msg.sender][startBlock][endBlock] != 0;
  }

  /**
   * @notice Validates if the signer was down for the specific Interval
   */
  function wasDownUsingIntervalProof(uint256 startBlock, uint256 endBlock, uint256 signerIndex)
    internal
    view
    returns (bool)
  {
    uint256 intervalBitmap = userIntervalValidationProof[msg.sender][startBlock][endBlock];
    return wasDownUsingIntervalBitmap(signerIndex, intervalBitmap);
  }

  /**
   * @notice Validates if the signerIndexes are down in both up interval bitmaps
   */
  function wasDownUsingIntervalBitmap(uint256 signerIndex, uint256 intervalBitmap)
    internal
    pure
    returns (bool)
  {
    return (intervalBitmap & (1 << signerIndex) == 0);
  }

  /**
   * @notice Test if a validator has been down for an specific chain of Intervals.
   * Requires to:
   *   - previously called 'generateProofOfIntervalValidation' for every pair
   * (startIntervals(i), endIntervals(i))
   *   - startIntervals(0) is the startBlock of the SlashableDowntime
   *   - endIntervals(i) is included in the interval [startIntervals(i+1) - 1, endIntervals(i+1)]
   *   - [startBlock, startBlock+SlashableDowntime-1] be covered by
   * [startIntervals(0), endIntervals(n)]
   * @param startIntervals List of blocks that starts a previously validated Interval.
   * startIntervals[0] will be use as the startBlock of the SlashableDowntime
   * @param endIntervals List of blocks that ends a previously validated Interval.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   */
  function wasDownForIntervals(
    uint256[] memory startIntervals,
    uint256[] memory endIntervals,
    uint256 startSignerIndex,
    uint256 endSignerIndex
  ) public view returns (bool) {
    require(startIntervals.length > 0, "Requires at least one Interval");
    require(startIntervals[0] > 0, "startIntervals[0] should be bigger than 0");
    require(
      startIntervals.length == endIntervals.length,
      "StartIntervals and EndIntervals must have the same length"
    );
    uint256 endBlock = getEndBlockForSlashing(startIntervals[0]);
    uint256 epochSize = getEpochSize();
    uint256 epochChangeBlock = epochNumberOfBlock(startIntervals[0], epochSize).mul(epochSize).add(
      1
    );
    uint256 signerIndex = startSignerIndex;
    uint256 lastIntervalEnd = startIntervals[0];
    for (uint256 i = 0; i < startIntervals.length; i += 1) {
      require(
        intervalProofAlreadyCalculated(startIntervals[i], endIntervals[i]),
        "Interval has not been calculated"
      );
      require(
        lastIntervalEnd >= startIntervals[i].sub(1) && lastIntervalEnd <= endIntervals[i],
        "At least one endInterval is not in te boundaries of the next Interval"
      );
      if (startIntervals[i] >= epochChangeBlock) {
        signerIndex = endSignerIndex;
      }
      if (!wasDownUsingIntervalProof(startIntervals[i], endIntervals[i], signerIndex)) {
        return false;
      }
      lastIntervalEnd = endIntervals[i];
      // Could be covered with less intervals
      if (lastIntervalEnd >= endBlock) {
        return true;
      }
    }

    require(
      lastIntervalEnd >= endBlock,
      "The Intervals are not covering the SlashableDowntime window"
    );

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

    SlashedInterval[] storage intervals = epochSlashedIntervals[validator][startEpoch];
    // The oncePerEpoch=true validation
    require(!oncePerEpoch || intervals.length < 1, "Already slashed in that epoch");

    for (uint256 i = 0; i < intervals.length; i = i.add(1)) {
      require(
        intervals[i].endBlock < startBlock || intervals[i].startBlock > endBlock,
        "Slash shares blocks with another slash"
      );
    }

    if (startEpoch != endEpoch) {
      intervals = epochSlashedIntervals[validator][endEpoch];
      for (uint256 i = 0; i < intervals.length; i = i.add(1)) {
        require(
          intervals[i].endBlock < startBlock || intervals[i].startBlock > endBlock,
          "Slash shares blocks with another slash"
        );
      }
    }
    epochSlashedIntervals[validator][startEpoch].push(
      SlashedInterval({ startBlock: startBlock, endBlock: endBlock })
    );
  }

  /**
   * @notice Requires that `wasDownForIntervals` returns true and that the account corresponding
   * to `signer` has not already been slashed for downtime for a previous interval of
   * blocks that includes at least one block of the new downtime interval.
   * If so, fetches the `account` associated with `signer` and the group that
   * `signer` was a member of during the corresponding epoch.
   * Then, calls `LockedGold.slash` on both the validator and group accounts.
   * Calls `Validators.removeSlashedMember` to remove the validator from its
   * current group if it is a member of one.
   * Finally, stores that (account, epochNumber) has been slashed.
   * Requires to:
   *   - previously called 'generateProofOfIntervalValidation' for every pair
   * (startIntervals(i), endIntervals(i))
   *   - startIntervals(0) is the startBlock of the SlashableDowntime
   *   - endIntervals(i) is included in the interval [startIntervals(i+1) - 1, endIntervals(i+1)]
   *   - [startBlock, startBlock+SlashableDowntime-1] be covered by
   * [startIntervals(0), endIntervals(n)]
   * @param startIntervals List of blocks that starts a previously validated Interval.
   * startIntervals[0] will be use as the startBlock of the SlashableDowntime
   * @param endIntervals List of blocks that ends a previously validated Interval.
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
    uint256[] memory startIntervals,
    uint256[] memory endIntervals,
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
    require(startIntervals.length > 0, "Requires at least one Interval");
    require(startIntervals[0] > 0, "startIntervals[0] should be bigger than 0");
    address validator = getValidatorFromSigner(startSignerIndex, startIntervals[0]);
    addNewSlashIntervalToValidator(validator, startIntervals[0]);
    require(
      wasDownForIntervals(startIntervals, endIntervals, startSignerIndex, endSignerIndex),
      "Not down"
    );
    performSlashing(
      validator,
      msg.sender,
      startIntervals[0],
      groupMembershipHistoryIndex,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    emit DowntimeSlashPerformed(validator, startIntervals[0]);
  }

  function getValidatorFromSigner(uint256 signerIndex, uint256 blockNumber)
    internal
    view
    returns (address)
  {
    return getAccounts().signerToAccount(validatorSignerAddressFromSet(signerIndex, blockNumber));
  }
}

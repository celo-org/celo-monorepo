pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DowntimeSlasher is SlasherUtil {
  using SafeMath for uint256;

  // For each address, associate each epoch with the last block that was slashed on that epoch
  mapping(address => mapping(uint256 => uint256)) lastSlashedBlock;
  uint256 public slashableDowntime;

  event SlashableDowntimeSet(uint256 interval);
  event DowntimeSlashPerformed(address indexed validator, uint256 indexed startBlock);

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _penalty Penalty for the slashed signer.
   * @param _reward Reward that the observer gets.
   * @param  _slashableDowntime Slashable downtime in blocks.
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
    require(interval != 0, "Slashable downtime cannot be zero");
    require(interval < getEpochSize(), "Slashable downtime must be smaller than epoch size");
    slashableDowntime = interval;
    emit SlashableDowntimeSet(interval);
  }

  /**
   * @notice Test if a validator has been down.
   * @param startBlock First block of the downtime. Last block will be computed from this.
   * @param startSignerIndex Index of the signer within the validator set as of the start block.
   * @param endSignerIndex Index of the signer within the validator set as of the end block.
   * @return True if the validator signature does not appear in any block within the window.
   * @dev Due to getParentSealBitmap, startBlock must be within 4 epochs of the current head.
   */
  function isDown(uint256 startBlock, uint256 startSignerIndex, uint256 endSignerIndex)
    public
    view
    returns (bool)
  {
    uint256 endBlock = getEndBlock(startBlock);
    require(endBlock < block.number.sub(1), "end block must be smaller than current block");
    require(
      startSignerIndex < numberValidatorsInSet(startBlock),
      "Bad validator index at start block"
    );
    require(endSignerIndex < numberValidatorsInSet(endBlock), "Bad validator index at end block");
    address startSigner = validatorSignerAddressFromSet(startSignerIndex, startBlock);
    address endSigner = validatorSignerAddressFromSet(endSignerIndex, endBlock);
    IAccounts accounts = getAccounts();
    require(
      accounts.signerToAccount(startSigner) == accounts.signerToAccount(endSigner),
      "Signers do not match"
    );
    uint256 sz = getEpochSize();
    uint256 startEpoch = epochNumberOfBlock(startBlock, sz);
    for (uint256 n = startBlock; n <= endBlock; n = n.add(1)) {
      uint256 signerIndex = epochNumberOfBlock(n, sz) == startEpoch
        ? startSignerIndex
        : endSignerIndex;
      // We want to check signers for block n,
      // so we get the parent seal bitmap for the next block
      if (uint256(getParentSealBitmap(n.add(1))) & (1 << signerIndex) != 0) return false;
    }
    return true;
  }

  /**
   * @notice Returns the end block for the interval.
   */
  function getEndBlock(uint256 startBlock) internal view returns (uint256) {
    return startBlock.add(slashableDowntime).sub(1);
  }

  function checkIfAlreadySlashed(address validator, uint256 startBlock) internal {
    uint256 endBlock = getEndBlock(startBlock);
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

pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DowntimeSlasher is SlasherUtil {
  using SafeMath for uint256;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  SlashingIncentives public slashingIncentives;

  // For each address, associate each epoch with the last block that was slashed on that epoch
  mapping(address => mapping(uint256 => uint256)) isSlashed;
  uint256 public slashableDowntime;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);
  event SlashableDowntimeSet(uint256 interval);

  /**
   * @notice Initializer
   * @param registryAddress Sets the registry address. Useful for testing.
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
   * @notice Sets slashing incentives.
   * @param penalty Penalty for the slashed signer.
   * @param reward Reward that the observer gets.
   */
  function setSlashingIncentives(uint256 penalty, uint256 reward) public onlyOwner {
    require(penalty > reward, "Penalty has to be larger than reward");
    slashingIncentives.penalty = penalty;
    slashingIncentives.reward = reward;
    emit SlashingIncentivesSet(penalty, reward);
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
   */
  function isDown(
    address account,
    uint256 startBlock,
    uint256 startSignerIndex,
    uint256 endSignerIndex
  ) internal view returns (bool) {
    uint256 endBlock = getEndBlock(startBlock);
    require(endBlock < block.number, "end block must be smaller than current block");
    require(
      startSignerIndex < numberValidatorsInSet(startBlock),
      "Bad validator index at start block"
    );
    require(endSignerIndex < numberValidatorsInSet(endBlock), "Bad validator index at end block");
    address startSigner = validatorSignerAddressFromSet(startSignerIndex, startBlock);
    address endSigner = validatorSignerAddressFromSet(endSignerIndex, endBlock);
    require(account == getAccounts().signerToAccount(startSigner), "Wrong start index");
    require(account == getAccounts().signerToAccount(endSigner), "Wrong end index");
    uint256 startEpoch = getEpochNumberOfBlock(startBlock);
    for (uint256 n = startBlock; n <= endBlock; n++) {
      uint256 signerIndex = getEpochNumberOfBlock(n) == startEpoch
        ? startSignerIndex
        : endSignerIndex;
      if (uint256(getParentSealBitmap(n)) & (1 << signerIndex) != 0) return false;
    }
    return true;
  }

  /**
   * @notice Returns the end block for the interval.
   */
  function getEndBlock(uint256 startBlock) internal view returns (uint256) {
    return startBlock + slashableDowntime - 1;
  }

  function checkIfAlreadySlashed(address validator, uint256 startBlock) internal {
    uint256 endBlock = getEndBlock(startBlock);
    uint256 startEpoch = getEpochNumberOfBlock(startBlock);
    uint256 endEpoch = getEpochNumberOfBlock(endBlock);
    require(isSlashed[validator][startEpoch] < startBlock, "Already slashed");
    require(isSlashed[validator][endEpoch] < endBlock, "Already slashed");
    isSlashed[validator][startEpoch] = endBlock + 1;
    isSlashed[validator][endEpoch] = endBlock + 1;
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
   * @param validator The validator to be slashed.
   * @param startBlock First block of the downtime.
   * @param signerIndex0 Validator index at the first block.
   * @param signerIndex1 Validator index at the last block.
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
    address validator,
    uint256 startBlock,
    uint256 signerIndex0,
    uint256 signerIndex1,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public {
    require(isDown(validator, startBlock, signerIndex0, signerIndex1), "Wasn't down");
    checkIfAlreadySlashed(validator, startBlock);
    getLockedGold().slash(
      validator,
      slashingIncentives.penalty,
      msg.sender,
      slashingIncentives.reward,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    address group = groupMembershipAtBlock(validator, startBlock, groupMembershipHistoryIndex);
    if (group == address(0)) return; // Should never be true
    getLockedGold().slash(
      group,
      slashingIncentives.penalty,
      msg.sender,
      slashingIncentives.reward,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    getValidators().forceDeaffiliateIfValidator(validator);
    getValidators().halveSlashingMultiplier(group);
  }

}

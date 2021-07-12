pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

contract SlasherUtil is Ownable, Initializable, UsingRegistry, UsingPrecompiles {
  using SafeMath for uint256;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  SlashingIncentives public slashingIncentives;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

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
   * @notice Returns the group to be slashed.
   * @param validator Validator that was slashed.
   * @param blockNumber Block number associated with slashing.
   * @param groupMembershipHistoryIndex Index used for history lookup.
   * @return Group to be slashed.
   */
  function groupMembershipAtBlock(
    address validator,
    uint256 blockNumber,
    uint256 groupMembershipHistoryIndex
  ) public view returns (address) {
    uint256 epoch = getEpochNumberOfBlock(blockNumber);
    require(epoch != 0, "Cannot slash on epoch 0");
    // Use `epoch-1` because the elections were on that epoch
    return
      getValidators().groupMembershipInEpoch(validator, epoch.sub(1), groupMembershipHistoryIndex);
  }

  function performSlashing(
    address validator,
    address recipient,
    uint256 startBlock,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) internal {
    ILockedGold lockedGold = getLockedGold();
    lockedGold.slash(
      validator,
      slashingIncentives.penalty,
      recipient,
      slashingIncentives.reward,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    address group = groupMembershipAtBlock(validator, startBlock, groupMembershipHistoryIndex);
    assert(group != address(0));
    lockedGold.slash(
      group,
      slashingIncentives.penalty,
      recipient,
      slashingIncentives.reward,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    IValidators validators = getValidators();
    validators.forceDeaffiliateIfValidator(validator);
    validators.halveSlashingMultiplier(group);
  }

}

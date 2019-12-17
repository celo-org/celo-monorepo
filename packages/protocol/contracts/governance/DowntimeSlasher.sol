pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

contract DowntimeSlasher is Ownable, Initializable, UsingRegistry, UsingPrecompiles {
  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  SlashingIncentives public slashingIncentives;
  mapping(bytes32 => bool) isSlashed;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);

  function initialize(address registryAddress, uint256 _penalty, uint256 _reward)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    _setSlashingIncentives(_penalty, _reward);
  }

  // Require that `reward` is less than `penalty`.
  function setSlashingIncentives(uint256 penalty, uint256 reward) external onlyOwner {
    _setSlashingIncentives(penalty, reward);
  }

  // Require that `reward` is less than `penalty`.
  function _setSlashingIncentives(uint256 penalty, uint256 reward) internal {
    require(penalty > reward, "Penalty has to be larger than reward");
    slashingIncentives.penalty = penalty;
    slashingIncentives.reward = reward;
    emit SlashingIncentivesSet(penalty, reward);
  }

  uint256 public slashableDowntime;

  function setSlashableDowntime(uint256 interval) external onlyOwner {
    require(
      slashableDowntime < getEpochSize(),
      "Slashable downtime must be smaller than epoch size"
    );
    slashableDowntime = interval;
  }

  function getEpoch(uint256 blockNumber) internal view returns (uint256) {
    return blockNumber / getEpochSize();
  }

  function isDown(
    address account,
    uint256 startSignerIndex,
    uint256 endSignerIndex,
    uint256 endBlock
  ) internal view returns (bool) {
    require(endBlock < block.number, "end block must be smaller than current block");
    uint256 startBlock = endBlock - slashableDowntime;
    address startSigner = validatorSignerAddress(startSignerIndex, startBlock);
    address endSigner = validatorSignerAddress(endSignerIndex, endBlock);
    require(account == getAccounts().signerToAccount(startSigner), "Wrong start index");
    require(account == getAccounts().signerToAccount(endSigner), "Wrong end index");
    uint256 startEpoch = getEpoch(startBlock);
    // uint256 endEpoch = getEpoch(endBlock);
    for (uint256 n = startBlock; n <= endBlock; n++) {
      uint256 signerIndex = getEpoch(n) == startEpoch ? startSignerIndex : endSignerIndex;
      if (uint256(getParentSealBitmap(n)) & (1 << signerIndex) != 0) return false;
    }
    return true;
  }

  // Requires that `eval` returns true and that the account corresponding to
  // `signer` has not already been slashed for downtime for the epoch
  // corresponding to `startBlock`.
  // If so, fetches the `account` associated with `signer` and the group that
  // `signer` was a member of during the corresponding epoch.
  // Then, calls `LockedGold.slash` on both the validator and group accounts.
  // Calls `Validators.removeSlashedMember` to remove the validator from its
  // current group if it is a member of one.
  // Finally, stores that (account, epochNumber) has been slashed.
  function slash(
    address validator,
    uint256 endBlock,
    uint256 signerIndex0,
    uint256 signerIndex1,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public returns (bool) {
    _slash(
      validator,
      endBlock,
      signerIndex0,
      signerIndex1,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    _slashGroup(
      validator,
      endBlock,
      groupMembershipHistoryIndex,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    return true;
  }

  function _slash(
    address validator,
    uint256 endBlock,
    uint256 signerIndex0,
    uint256 signerIndex1,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices
  ) internal returns (bool) {
    require(isDown(validator, signerIndex0, signerIndex1, endBlock), "Wasn't down");
    uint256 epoch = getEpoch(endBlock);
    require(!isSlashed[keccak256(abi.encodePacked(validator, epoch))], "Already slashed");
    isSlashed[keccak256(abi.encodePacked(validator, epoch))] = true;
    getLockedGold().slash(
      validator,
      slashingIncentives.penalty,
      msg.sender,
      slashingIncentives.reward,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    getValidators().forceDeaffiliateIfValidator(validator);
  }

  function _slashGroup(
    address validator,
    uint256 blockNumber,
    uint256 groupMembershipHistoryIndex,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) internal {
    address group = getValidators().groupMembershipAtBlock(
      validator,
      blockNumber / getEpochSize(),
      groupMembershipHistoryIndex
    );
    if (group == address(0)) return;
    getLockedGold().slash(
      group,
      slashingIncentives.penalty,
      msg.sender,
      slashingIncentives.reward,
      groupElectionLessers,
      groupElectionGreaters,
      groupElectionIndices
    );
    getValidators().halveSlashingMultiplier(group);
  }

}

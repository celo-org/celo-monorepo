pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

contract DoubleSigningSlasher is Ownable, Initializable, UsingRegistry, UsingPrecompiles {
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

  // Given two RLP encoded blocks, calls into a precompile that requires that
  // the two block hashes are different, have the same height, have a
  // quorum of signatures, and that `signer` was part of the quorum.
  // Returns the block number of the provided blocks.
  function eval(address signer, bytes memory blockA, bytes memory blockB)
    internal
    returns (uint256 blockNumber)
  {}

  // Requires that `eval` returns true and that this evidence has not
  // already been used to slash `signer`.
  // If so, fetches the `account` associated with `signer` and the group that
  // `signer` was a member of during the corresponding epoch.
  // Then, calls `LockedGold.slash` on both the validator and group accounts.
  // Calls `Validators.removeSlashedMember` to remove the validator from its
  // current group if it is a member of one.
  // Finally, stores that hash(signer, blockNumber) has been slashed.
  function slash(
    address signer,
    bytes memory blockA,
    bytes memory blockB,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) internal returns (bool) {
    uint256 blockNumber = eval(signer, blockA, blockB);
    require(blockNumber > 0, "No double signing detected");
    address validator = getAccounts().signerToAccount(signer);
    require(!isSlashed[keccak256(abi.encodePacked(validator, blockNumber))], "Already slashed");
    getLockedGold().slash(
      validator,
      slashingIncentives.penalty,
      msg.sender,
      slashingIncentives.reward,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    getValidators().removeSlashedMember(validator);

    address group = getValidators().groupMembershipAtBlock(
      validator,
      blockNumber / getEpochSize(),
      groupMembershipHistoryIndex
    );
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
    isSlashed[keccak256(abi.encodePacked(validator, blockNumber))] = true;
  }
}

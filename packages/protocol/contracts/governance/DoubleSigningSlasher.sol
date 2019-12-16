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
  function eval(
    address signer,
    uint256 index,
    uint256 blockNumber,
    bytes memory blockA,
    bytes memory blockB
  ) internal {
    require(keccak256(blockA) != keccak256(blockB), "Block headers have to be different");
    uint256 epoch = blockNumber / getEpochSize();
    bytes32 hashA = getParentHashFromHeader(blockA);
    bytes32 hashB = getParentHashFromHeader(blockB);
    require(
      hashA == hashB && blockhash(blockNumber - 1) == hashA,
      "Both parent hashes have to equal block at that number"
    );
    require(signer == getEpochSigner(epoch, index), "Wasn't a signer with given index");
    bytes32 mapA = getVerifiedSealBitmap(blockA);
    bytes32 mapB = getVerifiedSealBitmap(blockB);
    require(uint256(mapA) & (1 << index) != 0, "Didn't sign first block");
    require(uint256(mapB) & (1 << index) != 0, "Didn't sign second block");
  }

  // Requires that `eval` returns true and that this evidence has not
  // already been used to slash `signer`.
  // If so, fetches the `account` associated with `signer` and the group that
  // `signer` was a member of during the corresponding epoch.
  // Then, calls `LockedGold.slash` on both the validator and group accounts.
  // Calls `Validators.removeSlashedMember` to remove the validator from its
  // current group if it is a member of one.
  // Finally, stores that hash(signer, blockNumber) has been slashed.
  function _slash(
    address signer,
    uint256 index,
    uint256 blockNumber,
    bytes memory blockA,
    bytes memory blockB,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices
  ) internal returns (bool) {
    eval(signer, index, blockNumber, blockA, blockB);
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
    getValidators().forceDeaffiliateIfValidator(validator);
  }

  function _slashGroup(
    address signer,
    uint256 blockNumber,
    uint256 groupMembershipHistoryIndex,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) internal {
    address validator = getAccounts().signerToAccount(signer);
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

  function slash(
    address signer,
    uint256 index,
    uint256 blockNumber,
    bytes memory blockA,
    bytes memory blockB,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public returns (bool) {
    _slash(
      signer,
      index,
      blockNumber,
      blockA,
      blockB,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    /*
    _slashGroup(
      signer, blockNumber, groupMembershipHistoryIndex,
      groupElectionLessers, groupElectionGreaters, groupElectionIndices
    );*/
    return true;
  }

}

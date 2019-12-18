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

  function countSetBits(uint256 v) internal pure returns (uint256) {
    uint256 res = 0;
    uint256 acc = v;
    for (uint256 i = 0; i < 256; i++) {
      if (acc & 1 == 1) res++;
      acc = acc >> 1;
    }
    return res;
  }

  /**
   * @notice Given two RLP encoded blocks, calls into a precompile that requires that
   * the two block hashes are different, have the same height, have a
   * quorum of signatures, and that `signer` was part of the quorum.
   * @return Block number.
   */
  function eval(address signer, uint256 index, bytes memory blockA, bytes memory blockB)
    internal
    returns (uint256)
  {
    require(keccak256(blockA) != keccak256(blockB), "Block headers have to be different");
    uint256 blockNumber = getBlockNumberFromHeader(blockA);
    require(
      blockNumber == getBlockNumberFromHeader(blockB),
      "Block headers are from different height"
    );
    uint256 epoch = blockNumber / getEpochSize();
    require(index < numberValidators(blockNumber), "Bad validator index");
    require(signer == getEpochSigner(epoch, index), "Wasn't a signer with given index");
    uint256 mapA = uint256(getVerifiedSealBitmap(blockA));
    uint256 mapB = uint256(getVerifiedSealBitmap(blockB));
    require(mapA & (1 << index) != 0, "Didn't sign first block");
    require(mapB & (1 << index) != 0, "Didn't sign second block");
    require(
      countSetBits(mapA) >= (2 * numberValidators(blockNumber)) / 3,
      "Not enough signers in the first block"
    );
    require(
      countSetBits(mapB) >= (2 * numberValidators(blockNumber)) / 3,
      "Not enough signers in the second block"
    );
    return blockNumber;
  }

  function _slash(
    address signer,
    uint256 index,
    bytes memory blockA,
    bytes memory blockB,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices
  ) internal returns (uint256) {
    uint256 blockNumber = eval(signer, index, blockA, blockB);
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
    return blockNumber;
  }

  function _slashGroup(
    address signer,
    uint256 blockNumber,
    uint256 groupMembershipHistoryIndex,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) internal returns (address) {
    address validator = getAccounts().signerToAccount(signer);
    require(validator != address(0), "Validator not found");
    address group = getValidators().groupMembershipAtBlock(
      validator,
      blockNumber,
      groupMembershipHistoryIndex
    );
    getValidators().forceDeaffiliateIfValidator(validator);
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

  /**
   * @notice Requires that `eval` returns true and that this evidence has not
   * already been used to slash `signer`.
   * If so, fetches the `account` associated with `signer` and the group that
   * `signer` was a member of during the corresponding epoch.
   * Then, calls `LockedGold.slash` on both the validator and group accounts.
   * Calls `Validators.removeSlashedMember` to remove the validator from its
   * current group if it is a member of one.
   * Finally, stores that hash(signer, blockNumber) has been slashed.
   */
  function slash(
    address signer,
    uint256 index,
    bytes memory blockA,
    bytes memory blockB,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public returns (address) {
    uint256 blockNumber = _slash(
      signer,
      index,
      blockA,
      blockB,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    return
      _slashGroup(
        signer,
        blockNumber,
        groupMembershipHistoryIndex,
        groupElectionLessers,
        groupElectionGreaters,
        groupElectionIndices
      );
  }

}

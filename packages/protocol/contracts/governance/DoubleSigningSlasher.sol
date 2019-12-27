pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";

contract DoubleSigningSlasher is SlasherUtil {
  using SafeMath for uint256;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  SlashingIncentives public slashingIncentives;

  // For each signer address, check if a block header has already been slashed
  mapping(address => mapping(bytes32 => bool)) isSlashed;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);

  /**
   * @notice Initializer
   * @param registryAddress Sets the registry address. Useful for testing.
   * @param _penalty Penalty for the slashed signer.
   * @param _reward Reward that the observer gets.
   */
  function initialize(address registryAddress, uint256 _penalty, uint256 _reward)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setSlashingIncentives(_penalty, _reward);
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
   * @notice Counts the number of set bits (Hamming weight).
   * @param v Bitmap.
   * @return Number of set bits.
   */
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
   * @notice Returns the minimum number of required signers for a given block number.
   */
  function minQuorumSize(uint256 blockNumber) internal view returns (uint256) {
    return (2 * numberValidatorsInSet(blockNumber) + 2) / 3;
  }

  /**
   * @notice Given two RLP encoded blocks, calls into precompiles to require that
   * the two block hashes are different, have the same height, have a
   * quorum of signatures, and that `signer` was part of the quorum.
   * @param signer The signer to be slashed.
   * @param index Validator index at the block.
   * @param blockA First double signed block.
   * @param blockB Second double signed block.
   * @return Block number where double signing occured. Throws if no double signing is detected.
   */
  function checkForDoubleSigning(
    address signer,
    uint256 index,
    bytes memory blockA,
    bytes memory blockB
  ) public view returns (uint256) {
    require(hashHeader(blockA) != hashHeader(blockB), "Block hashes have to be different");
    uint256 blockNumber = getBlockNumberFromHeader(blockA);
    require(
      blockNumber == getBlockNumberFromHeader(blockB),
      "Block headers are from different height"
    );
    require(index < numberValidatorsInSet(blockNumber), "Bad validator index");
    require(
      signer == validatorSignerAddressFromSet(index, blockNumber),
      "Wasn't a signer with given index"
    );
    uint256 mapA = uint256(getVerifiedSealBitmapFromHeader(blockA));
    uint256 mapB = uint256(getVerifiedSealBitmapFromHeader(blockB));
    require(mapA & (1 << index) != 0, "Didn't sign first block");
    require(mapB & (1 << index) != 0, "Didn't sign second block");
    require(
      countSetBits(mapA) >= minQuorumSize(blockNumber),
      "Not enough signers in the first block"
    );
    require(
      countSetBits(mapB) >= minQuorumSize(blockNumber),
      "Not enough signers in the second block"
    );
    return blockNumber;
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
   * @param signer The signer to be slashed.
   * @param index Validator index at the block.
   * @param headerA First double signed block.
   * @param headerB Second double signed block.
   * @param groupMembershipHistoryIndex Group membership index from where the group should be found.
   * @param validatorElectionLessers Lesser pointers for validator slashing.
   * @param validatorElectionGreaters Greater pointers for validator slashing.
   * @param validatorElectionIndices Vote indices for validator slashing.
   * @param groupElectionLessers Lesser pointers for group slashing.
   * @param groupElectionGreaters Greater pointers for group slashing.
   * @param groupElectionIndices Vote indices for group slashing.
   */
  function slash(
    address signer,
    uint256 index,
    bytes memory headerA,
    bytes memory headerB,
    uint256 groupMembershipHistoryIndex,
    address[] memory validatorElectionLessers,
    address[] memory validatorElectionGreaters,
    uint256[] memory validatorElectionIndices,
    address[] memory groupElectionLessers,
    address[] memory groupElectionGreaters,
    uint256[] memory groupElectionIndices
  ) public {
    require(!isSlashed[signer][hashHeader(headerA)], "Already slashed");
    require(!isSlashed[signer][hashHeader(headerB)], "Already slashed");
    uint256 blockNumber = checkForDoubleSigning(signer, index, headerA, headerB);
    isSlashed[signer][hashHeader(headerA)] = true;
    isSlashed[signer][hashHeader(headerB)] = true;
    address validator = getAccounts().signerToAccount(signer);
    getLockedGold().slash(
      validator,
      slashingIncentives.penalty,
      msg.sender,
      slashingIncentives.reward,
      validatorElectionLessers,
      validatorElectionGreaters,
      validatorElectionIndices
    );
    address group = groupMembershipAtBlock(validator, blockNumber, groupMembershipHistoryIndex);
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
  }

}

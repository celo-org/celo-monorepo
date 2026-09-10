// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/utils/math/SafeMath.sol";
import "@celo-contracts/governance/interfaces/IValidators.sol";

/**
 * @title A mock Validators for 0.8 tests.
 */
contract MockValidators08 is IValidators {
  using SafeMath for uint256;

  mapping(address => bool) public isValidator;
  mapping(address => bool) public isValidatorGroup;
  mapping(address => uint256) private numGroupMembers;
  mapping(address => uint256) private lockedGoldRequirements;
  mapping(address => bool) private doesNotMeetAccountLockedGoldRequirements;
  mapping(address => address[]) private members;
  mapping(address => address) private affiliations;
  mapping(address => uint256) private commissions;
  uint256 private numRegisteredValidators;
  mapping(address => uint256) private epochRewards;
  uint256 public mintedStable;

  function updateEcdsaPublicKey(address, address, bytes calldata) external returns (bool) {
    return true;
  }

  function setValidator(address account) external {
    isValidator[account] = true;
  }

  function setValidatorGroup(address group) external {
    isValidatorGroup[group] = true;
  }

  function setIsValidatorGroup(address group, bool value) external {
    isValidatorGroup[group] = value;
  }

  function affiliate(address group) external returns (bool) {
    affiliations[msg.sender] = group;
    return true;
  }

  function setDoesNotMeetAccountLockedGoldRequirements(address account) external {
    doesNotMeetAccountLockedGoldRequirements[account] = true;
  }

  function setNumRegisteredValidators(uint256 value) external {
    numRegisteredValidators = value;
  }

  function setMembers(address group, address[] calldata _members) external {
    members[group] = _members;
    for (uint256 i = 0; i < _members.length; i++) {
      affiliations[_members[i]] = group;
    }
  }

  function setCommission(address group, uint256 commission) external {
    commissions[group] = commission;
  }

  function setAccountLockedGoldRequirement(address account, uint256 value) external {
    lockedGoldRequirements[account] = value;
  }

  function getAccountLockedGoldRequirement(address account) external view returns (uint256) {
    return lockedGoldRequirements[account];
  }

  function meetsAccountLockedGoldRequirements(address account) external view returns (bool) {
    return !doesNotMeetAccountLockedGoldRequirements[account];
  }

  function getTopGroupValidators(
    address group,
    uint256 n
  ) external view returns (address[] memory) {
    address[] memory groupMembers = members[group];
    uint256 size = n < groupMembers.length ? n : groupMembers.length;
    address[] memory validators = new address[](size);
    for (uint256 i = 0; i < size; i++) {
      validators[i] = groupMembers[i];
    }
    return validators;
  }

  function getTopGroupValidatorsAccounts(
    address group,
    uint256 n
  ) external view returns (address[] memory) {
    address[] memory groupMembers = members[group];
    uint256 size = n < groupMembers.length ? n : groupMembers.length;
    address[] memory validatorAccounts = new address[](size);
    for (uint256 i = 0; i < size; i++) {
      validatorAccounts[i] = groupMembers[i];
    }
    return validatorAccounts;
  }

  function getGroupsNumMembers(address[] calldata groups) external view returns (uint256[] memory) {
    uint256[] memory numMembers = new uint256[](groups.length);
    for (uint256 i = 0; i < groups.length; i++) {
      numMembers[i] = members[groups[i]].length;
    }
    return numMembers;
  }

  function numRegisteredValidatorsGetter() external view returns (uint256) {
    return numRegisteredValidators;
  }

  function getNumRegisteredValidators() external view returns (uint256) {
    return numRegisteredValidators;
  }

  function getGroupNumMembers(address group) external view returns (uint256) {
    return members[group].length;
  }

  function getGroupMembers(address group) external view returns (address[] memory) {
    return members[group];
  }

  function halveSlashingMultiplier(address) external {}

  function forceMemberRemoval(address, address) external {}

  function getMembershipInLastEpochFromSigner(address signer) external view returns (address) {
    return affiliations[signer];
  }

  function getMembershipInLastEpoch(address validator) external view returns (address) {
    return affiliations[validator];
  }

  function getEpochRewards(
    address group,
    uint256,
    uint256[] calldata
  ) external view returns (uint256[] memory) {
    address[] memory groupMembers = members[group];
    uint256[] memory rewards = new uint256[](groupMembers.length);
    for (uint256 i = 0; i < groupMembers.length; i++) {
      rewards[i] = epochRewards[groupMembers[i]];
    }
    return rewards;
  }

  function computeEpochReward(address account, uint256, uint256) external view returns (uint256) {
    return epochRewards[account];
  }

  function setEpochRewards(address account, uint256 reward) external {
    epochRewards[account] = reward;
  }

  function mintStableToEpochManager(uint256 amount) external {
    mintedStable = mintedStable.add(amount);
  }

  function isValidatorGroupMethod(address account) external view returns (bool) {
    return isValidatorGroup[account];
  }

  function reorderMember(address, address, address) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function maxGroupSize() external pure returns (uint256) {
    revert("Method not implemented in mock");
  }

  function getValidatorLockedGoldRequirements() external pure returns (uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function getRegisteredValidators() external pure returns (address[] memory) {
    revert("Method not implemented in mock");
  }

  function getRegisteredValidatorGroups() external pure returns (address[] memory) {
    revert("Method not implemented in mock");
  }

  function getMembershipHistoryLength() external pure returns (uint256) {
    revert("Method not implemented in mock");
  }

  function addMember(address) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function deaffiliate() external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function deregisterValidator(uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function deregisterValidatorGroup(uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function getCommissionUpdateDelay() external pure returns (uint256) {
    revert("Method not implemented in mock");
  }

  function getGroupLockedGoldRequirements() external pure returns (uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function getMembershipHistory(
    address
  ) external pure returns (uint256[] memory, address[] memory, uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function getValidator(
    address
  ) external pure returns (bytes memory, bytes memory, address, uint256, address) {
    revert("Method not implemented in mock");
  }

  function addFirstMember(address, address, address) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function forceDeaffiliateIfValidator(address) external pure {
    revert("Method not implemented in mock");
  }

  function getValidatorsGroup(address) external pure returns (address) {
    revert("Method not implemented in mock");
  }

  function getValidatorGroup(
    address
  )
    external
    pure
    returns (address[] memory, uint256, uint256, uint256, uint256[] memory, uint256, uint256)
  {
    revert("Method not implemented in mock");
  }

  function getValidatorGroupSlashingMultiplier(address) external pure returns (uint256) {
    revert("Method not implemented in mock");
  }

  function getVoterRewardCommission(address) external pure returns (uint256, uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function maxVoterRewardCommission() external pure returns (uint256) {
    revert("Method not implemented in mock");
  }

  function maxVoterRewardCommissionLastReducedBlock() external pure returns (uint256) {
    revert("Method not implemented in mock");
  }

  function groupMembershipInEpoch(address, uint256, uint256) external pure returns (address) {
    revert("Method not implemented in mock");
  }

  function registerValidatorNoBls(bytes calldata) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function setCommissionUpdateDelay(uint256) external pure {
    revert("Method not implemented in mock");
  }

  function setMaxVoterRewardCommission(uint256) external pure {
    revert("Method not implemented in mock");
  }

  function updateVoterRewardCommission() external pure {
    revert("Method not implemented in mock");
  }

  function setNextVoterRewardCommissionUpdate(uint256) external pure {
    revert("Method not implemented in mock");
  }

  function registerValidator(bytes calldata) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function registerValidatorGroup(uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function removeMember(address) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function updateCommission() external pure {
    revert("Method not implemented in mock");
  }

  function setNextCommissionUpdate(uint256) external pure {
    revert("Method not implemented in mock");
  }

  function resetSlashingMultiplier() external pure {
    revert("Method not implemented in mock");
  }

  function setMaxGroupSize(uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function setMembershipHistoryLength(uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function setGroupLockedGoldRequirements(uint256, uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function setValidatorLockedGoldRequirements(uint256, uint256) external pure returns (bool) {
    revert("Method not implemented in mock");
  }

  function setSlashingMultiplierResetPeriod(uint256) external pure {
    revert("Method not implemented in mock");
  }
}

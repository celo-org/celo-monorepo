// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/governance/interfaces/IValidators.sol";

/**
 * @title Minimal MockValidators for GovernanceSlasher tests.
 * Emits HavelSlashingMultiplierHalved / ValidatorDeaffiliatedCalled so tests
 * can verify GovernanceSlasher calls the right validator methods.
 */
contract MockValidators08Slasher is IValidators {
  event HavelSlashingMultiplierHalved(address validator);
  event ValidatorDeaffiliatedCalled(address validator);

  mapping(address => address) private affiliations;

  function affiliate(address group) external returns (bool) {
    affiliations[msg.sender] = group;
    return true;
  }

  function halveSlashingMultiplier(address validator) external {
    emit HavelSlashingMultiplierHalved(validator);
  }

  function forceDeaffiliateIfValidator(address validator) external {
    emit ValidatorDeaffiliatedCalled(validator);
  }

  function getMembershipInLastEpoch(address validator) external view returns (address) {
    return affiliations[validator];
  }

  function getMembershipInLastEpochFromSigner(address signer) external view returns (address) {
    return affiliations[signer];
  }

  // ---- IValidators stubs (view/pure) ----

  function registerValidator(bytes calldata) external pure returns (bool) { revert("stub"); }
  function registerValidatorNoBls(bytes calldata) external pure returns (bool) { revert("stub"); }
  function deregisterValidator(uint256) external pure returns (bool) { revert("stub"); }
  function deaffiliate() external pure returns (bool) { revert("stub"); }
  function registerValidatorGroup(uint256) external pure returns (bool) { revert("stub"); }
  function deregisterValidatorGroup(uint256) external pure returns (bool) { revert("stub"); }
  function addMember(address) external pure returns (bool) { revert("stub"); }
  function addFirstMember(address, address, address) external pure returns (bool) { revert("stub"); }
  function removeMember(address) external pure returns (bool) { revert("stub"); }
  function reorderMember(address, address, address) external pure returns (bool) { revert("stub"); }
  function updateCommission() external pure { revert("stub"); }
  function setNextCommissionUpdate(uint256) external pure { revert("stub"); }
  function updateVoterRewardCommission() external pure { revert("stub"); }
  function setNextVoterRewardCommissionUpdate(uint256) external pure { revert("stub"); }
  function resetSlashingMultiplier() external pure { revert("stub"); }
  function setCommissionUpdateDelay(uint256) external pure { revert("stub"); }
  function setMaxVoterRewardCommission(uint256) external pure { revert("stub"); }
  function setMaxGroupSize(uint256) external pure returns (bool) { revert("stub"); }
  function setMembershipHistoryLength(uint256) external pure returns (bool) { revert("stub"); }
  function setGroupLockedGoldRequirements(uint256, uint256) external pure returns (bool) { revert("stub"); }
  function setValidatorLockedGoldRequirements(uint256, uint256) external pure returns (bool) { revert("stub"); }
  function setSlashingMultiplierResetPeriod(uint256) external pure { revert("stub"); }
  function updateEcdsaPublicKey(address, address, bytes calldata) external pure returns (bool) { revert("stub"); }
  function mintStableToEpochManager(uint256) external pure { revert("stub"); }
  function maxGroupSize() external pure returns (uint256) { revert("stub"); }
  function getCommissionUpdateDelay() external pure returns (uint256) { revert("stub"); }
  function getVoterRewardCommission(address) external pure returns (uint256, uint256, uint256) { revert("stub"); }
  function maxVoterRewardCommission() external pure returns (uint256) { revert("stub"); }
  function maxVoterRewardCommissionLastReducedBlock() external pure returns (uint256) { revert("stub"); }
  function getMembershipHistory(address) external pure returns (uint256[] memory, address[] memory, uint256, uint256) { revert("stub"); }
  function getAccountLockedGoldRequirement(address) external pure returns (uint256) { revert("stub"); }
  function meetsAccountLockedGoldRequirements(address) external pure returns (bool) { revert("stub"); }
  function getValidator(address) external pure returns (bytes memory, bytes memory, address, uint256, address) { revert("stub"); }
  function getValidatorsGroup(address) external pure returns (address) { revert("stub"); }
  function getValidatorGroup(address) external pure returns (address[] memory, uint256, uint256, uint256, uint256[] memory, uint256, uint256) { revert("stub"); }
  function getGroupNumMembers(address) external pure returns (uint256) { revert("stub"); }
  function getTopGroupValidators(address, uint256) external pure returns (address[] memory) { revert("stub"); }
  function getTopGroupValidatorsAccounts(address, uint256) external pure returns (address[] memory) { revert("stub"); }
  function getGroupsNumMembers(address[] calldata) external pure returns (uint256[] memory) { revert("stub"); }
  function getNumRegisteredValidators() external pure returns (uint256) { revert("stub"); }
  function groupMembershipInEpoch(address, uint256, uint256) external pure returns (address) { revert("stub"); }
  function getValidatorLockedGoldRequirements() external pure returns (uint256, uint256) { revert("stub"); }
  function getGroupLockedGoldRequirements() external pure returns (uint256, uint256) { revert("stub"); }
  function getRegisteredValidators() external pure returns (address[] memory) { revert("stub"); }
  function getRegisteredValidatorGroups() external pure returns (address[] memory) { revert("stub"); }
  function isValidatorGroup(address) external pure returns (bool) { revert("stub"); }
  function isValidator(address) external pure returns (bool) { revert("stub"); }
  function getValidatorGroupSlashingMultiplier(address) external pure returns (uint256) { revert("stub"); }
  function computeEpochReward(address, uint256, uint256) external pure returns (uint256) { revert("stub"); }
  function getMembershipHistoryLength() external pure returns (uint256) { revert("stub"); }
  function getGroupMembers(address) external pure returns (address[] memory) { revert("stub"); }
  function getEpochRewards(address, uint256, uint256[] calldata) external pure returns (uint256[] memory) { revert("stub"); }
}

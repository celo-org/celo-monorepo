// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../../../contracts/governance/interfaces/IValidators.sol";
import "../../../contracts/common/FixidityLib.sol";

import "forge-std-8/console2.sol";

/**
 * @title A wrapper around Validators that exposes onlyVm functions for testing.
 */
contract ValidatorsMock08 is IValidators {
  function updateValidatorScoreFromSigner(address signer, uint256 uptime) external {
    console2.log("### update Validator Score From Signer");
  }

  function distributeEpochPaymentsFromSigner(
    address signer,
    uint256 maxPayment
  ) external returns (uint256) {
    console2.log("### distributeEpochPaymentsFromSigner");
    return 0;
    // return _distributeEpochPaymentsFromSigner(signer, maxPayment);
  }

  function registerValidator(
    bytes calldata ecdsaPublicKey,
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external returns (bool) {
    return true;
  }

  function deregisterValidator(uint256 index) external returns (bool) {
    return true;
  }
  function affiliate(address group) external returns (bool) {
    return true;
  }
  function deaffiliate() external returns (bool) {
    return true;
  }
  function updateBlsPublicKey(
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external returns (bool) {
    return true;
  }
  function registerValidatorGroup(uint256 commission) external returns (bool) {
    return true;
  }
  function deregisterValidatorGroup(uint256 index) external returns (bool) {
    return true;
  }
  function addMember(address validator) external returns (bool) {
    return true;
  }
  function addFirstMember(
    address validator,
    address lesser,
    address greater
  ) external returns (bool) {
    return true;
  }
  function removeMember(address validator) external returns (bool) {
    return true;
  }
  function reorderMember(
    address validator,
    address lesserMember,
    address greaterMember
  ) external returns (bool) {
    return true;
  }
  function updateCommission() external {}
  function setNextCommissionUpdate(uint256 commission) external {}
  function resetSlashingMultiplier() external {}

  // only owner
  function setCommissionUpdateDelay(uint256 delay) external {}
  function setMaxGroupSize(uint256 size) external returns (bool) {
    return true;
  }
  function setMembershipHistoryLength(uint256 length) external returns (bool) {
    return true;
  }
  function setValidatorScoreParameters(
    uint256 exponent,
    uint256 adjustmentSpeed
  ) external returns (bool) {
    return true;
  }
  function setGroupLockedGoldRequirements(uint256 value, uint256 duration) external returns (bool) {
    return true;
  }
  function setValidatorLockedGoldRequirements(
    uint256 value,
    uint256 duration
  ) external returns (bool) {
    return true;
  }
  function setSlashingMultiplierResetPeriod(uint256 value) external {}

  // only registered contract
  function updateEcdsaPublicKey(
    address account,
    address signer,
    bytes calldata ecdsaPublicKey
  ) external returns (bool) {
    return true;
  }
  function updatePublicKeys(
    address account,
    address signer,
    bytes calldata ecdsaPublicKey,
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external returns (bool) {
    return true;
  }

  // only slasher
  function forceDeaffiliateIfValidator(address validatorAccount) external {}
  function halveSlashingMultiplier(address account) external {}

  // view functions
  function getCommissionUpdateDelay() external view returns (uint256) {
    return 0;
  }
  function getValidatorScoreParameters() external view returns (uint256, uint256) {
    return (0, 0);
  }

  function getMembershipHistory(
    address account
  ) external view returns (uint256[] memory, address[] memory, uint256, uint256) {
    return (new uint256[](0), new address[](0), 0, 0);
  }
  function calculateEpochScore(uint256 uptime) external view returns (uint256) {
    return 0;
  }

  function calculateGroupEpochScore(uint256[] calldata uptimes) external view returns (uint256) {
    return 0;
  }

  function getAccountLockedGoldRequirement(address account) external view returns (uint256) {
    return 0;
  }

  function meetsAccountLockedGoldRequirements(address account) external view returns (bool) {
    return true;
  }
  function getValidatorBlsPublicKeyFromSigner(address singer) external view returns (bytes memory) {
    return "0x";
  }
  function getValidator(
    address account
  ) external view returns (bytes memory, bytes memory, address, uint256, address) {
    return ("0x", "0x", address(0), 0, address(0));
  }
   function getValidatorsGroup(
    address account
  )
    external
    view
    returns (
      address affiliation
  ) {
    affiliation = address(0);
  }
  function getValidatorGroup(
    address account
  )
    external
    view
    returns (address[] memory, uint256, uint256, uint256, uint256[] memory, uint256, uint256)
  {
    return (new address[](0), 0, 0, 0, new uint256[](0), 0, 0);
  }
  function getGroupNumMembers(address account) external view returns (uint256) {
    return 0;
  }

  function getTopGroupValidators(
    address account,
    uint256 n
  ) external view returns (address[] memory) {
    return new address[](0);
  }
  function getGroupsNumMembers(
    address[] calldata accounts
  ) external view returns (uint256[] memory) {
    return new uint256[](0);
  }
  function getNumRegisteredValidators() external view returns (uint256) {
    return 0;
  }

  function groupMembershipInEpoch(
    address account,
    uint256 epochNumber,
    uint256 index
  ) external view returns (address) {
    return address(0);
  }

  function getValidatorLockedGoldRequirements() external view returns (uint256, uint256) {
    return (0, 0);
  }
  function getGroupLockedGoldRequirements() external view returns (uint256, uint256) {
    return (0, 0);
  }
  function getRegisteredValidators() external view returns (address[] memory) {
    return new address[](0);
  }
  function getRegisteredValidatorGroups() external view returns (address[] memory) {
    return new address[](0);
  }
  function isValidatorGroup(address account) external view returns (bool) {
    return true;
  }
  function isValidator(address account) external view returns (bool) {
    return true;
  }
  function getValidatorGroupSlashingMultiplier(address account) external view returns (uint256) {
    return 0;
  }

  function getMembershipInLastEpoch(address account) external view returns (address) {
    return address(0);
  }
  function getMembershipInLastEpochFromSigner(address signer) external view returns (address) {
    return address(0);
  }
  function computeEpochReward(
    address account,
    uint256 score,
    uint256 maxPayment
  ) external view returns (uint256) {
    return 1;
  }
}

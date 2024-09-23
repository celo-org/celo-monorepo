pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../interfaces/IValidators.sol";
import "../../../contracts-0.8/common/IsL2Check.sol";

// Mocks Validators, compatible with 0.5
// For forge tests, can be avoided with calls to deployCodeTo

/**
 * @title Holds a list of addresses of validators
 */
contract MockValidators is IValidators, IsL2Check {
  using SafeMath for uint256;

  uint256 private constant FIXED1_UINT = 1000000000000000000000000;

  mapping(address => bool) public isValidator;
  mapping(address => bool) public isValidatorGroup;
  mapping(address => uint256) private numGroupMembers;
  mapping(address => uint256) private lockedGoldRequirements;
  mapping(address => bool) private doesNotMeetAccountLockedGoldRequirements;
  mapping(address => address[]) private members;
  mapping(address => address) private affiliations;
  mapping(address => uint256) private commissions;
  uint256 private numRegisteredValidators;

  function updateEcdsaPublicKey(address, address, bytes calldata) external returns (bool) {
    allowOnlyL1();
    return true;
  }

  function updatePublicKeys(
    address,
    address,
    bytes calldata,
    bytes calldata,
    bytes calldata
  ) external returns (bool) {
    allowOnlyL1();
    return true;
  }

  function setValidator(address account) external {
    isValidator[account] = true;
  }

  function setValidatorGroup(address group) external {
    isValidatorGroup[group] = true;
  }

  function getValidatorsGroup(address validator) external view returns (address) {
    return affiliations[validator];
  }

  function affiliate(address group) external returns (bool) {
    allowOnlyL1();
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
    for (uint256 i; i < _members.length; i++) {
      affiliations[_members[i]] = group;
    }
  }

  function setCommission(address group, uint256 commission) external {
    commissions[group] = commission;
  }

  function setAccountLockedGoldRequirement(address account, uint256 value) external {
    lockedGoldRequirements[account] = value;
  }

  function halveSlashingMultiplier(address) external {
    allowOnlyL1(); // TODO remove
  }

  function forceDeaffiliateIfValidator(address validator) external {
    allowOnlyL1(); // TODO remove
  }

  function getTopGroupValidators(address group, uint256 n) public view returns (address[] memory) {
    require(n <= members[group].length);
    address[] memory validators = new address[](n);
    for (uint256 i = 0; i < n; i = i.add(1)) {
      validators[i] = members[group][i];
    }
    return validators;
  }

  function getTopGroupValidatorsAccounts(
    address group,
    uint256 n
  ) external view returns (address[] memory) {
    return getTopGroupValidators(group, n);
  }

  function getValidatorGroup(
    address group
  )
    external
    view
    returns (address[] memory, uint256, uint256, uint256, uint256[] memory, uint256, uint256)
  {
    uint256[] memory sizeHistory;
    return (members[group], commissions[group], 0, 0, sizeHistory, 0, 0);
  }

  function getValidatorGroupSlashingMultiplier(address) external view returns (uint256) {
    allowOnlyL1();
    return FIXED1_UINT;
  }

  function meetsAccountLockedGoldRequirements(address account) external view returns (bool) {
    return !doesNotMeetAccountLockedGoldRequirements[account];
  }

  function getNumRegisteredValidators() external view returns (uint256) {
    return numRegisteredValidators;
  }

  function getAccountLockedGoldRequirement(address account) external view returns (uint256) {
    return lockedGoldRequirements[account];
  }

  function calculateGroupEpochScore(uint256[] calldata uptimes) external view returns (uint256) {
    return uptimes[0];
  }

  function getGroupsNumMembers(address[] calldata groups) external view returns (uint256[] memory) {
    uint256[] memory numMembers = new uint256[](groups.length);
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      numMembers[i] = getGroupNumMembers(groups[i]);
    }
    return numMembers;
  }

  function groupMembershipInEpoch(address addr, uint256, uint256) external view returns (address) {
    allowOnlyL1();
    return affiliations[addr];
  }

  function getGroupNumMembers(address group) public view returns (uint256) {
    return members[group].length;
  }

  // Not implemented in mock, added here to support the interface
  // without the interface, missing function erros get hard to debug

  function addFirstMember(address, address, address) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function registerValidatorGroup(uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function registerValidatorNoBls(bytes calldata ecdsaPublicKey) external returns (bool) {
    revert("Method not implemented in mock");
  }
  function removeMember(address) external returns (bool) {
    revert("Method not implemented in mock");
  }
  function setGroupLockedGoldRequirements(uint256, uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }
  function setMembershipHistoryLength(uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }
  function setNextCommissionUpdate(uint256) external {
    revert("Method not implemented in mock");
  }
  function setSlashingMultiplierResetPeriod(uint256) external {
    revert("Method not implemented in mock");
  }

  function updateCommission() external {
    revert("Method not implemented in mock");
  }

  function updateBlsPublicKey(bytes calldata, bytes calldata) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function setValidatorScoreParameters(uint256, uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function setValidatorLockedGoldRequirements(uint256, uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function setMaxGroupSize(uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function setDowntimeGracePeriod(uint256 value) external {
    revert("Method not implemented in mock");
  }

  function setCommissionUpdateDelay(uint256) external {
    revert("Method not implemented in mock");
  }

  function resetSlashingMultiplier() external {
    revert("Method not implemented in mock");
  }

  function reorderMember(address, address, address) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function updateValidatorScoreFromSigner(address, uint256) external {
    revert("Method not implemented in mock");
  }

  function mintStableToEpochManager(uint256 amount) external {
    revert("Method not implemented in mock");
  }

  function maxGroupSize() external view returns (uint256) {
    revert("Method not implemented in mock");
  }

  function getValidatorScoreParameters() external view returns (uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function getValidatorLockedGoldRequirements() external view returns (uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function getValidatorBlsPublicKeyFromSigner(address) external view returns (bytes memory) {
    revert("Method not implemented in mock");
  }

  function getRegisteredValidators() external view returns (address[] memory) {
    revert("Method not implemented in mock");
  }

  function getRegisteredValidatorGroups() external view returns (address[] memory) {
    revert("Method not implemented in mock");
  }

  function getMembershipInLastEpochFromSigner(address) external view returns (address) {
    revert("Method not implemented in mock");
  }

  function getMembershipInLastEpoch(address) external view returns (address) {
    revert("Method not implemented in mock");
  }

  function getMembershipHistoryLength() external view returns (uint256) {
    revert("Method not implemented in mock");
  }

  function addMember(address) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function calculateEpochScore(uint256) external view returns (uint256) {
    revert("Method not implemented in mock");
  }

  function deaffiliate() external returns (bool) {
    revert("Method not implemented in mock");
  }

  function deregisterValidator(uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function deregisterValidatorGroup(uint256) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function distributeEpochPaymentsFromSigner(address, uint256) external returns (uint256) {
    revert("Method not implemented in mock");
  }

  function downtimeGracePeriod() external view returns (uint256) {
    revert("Method not implemented in mock");
  }

  function getCommissionUpdateDelay() external view returns (uint256) {
    revert("Method not implemented in mock");
  }

  function getGroupLockedGoldRequirements() external view returns (uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function computeEpochReward(
    address account,
    uint256 score,
    uint256 maxPayment
  ) external view returns (uint256) {
    revert("Method not implemented in mock");
  }

  function registerValidator(
    bytes calldata,
    bytes calldata,
    bytes calldata
  ) external returns (bool) {
    revert("Method not implemented in mock");
  }

  function getMembershipHistory(
    address
  ) external view returns (uint256[] memory, address[] memory, uint256, uint256) {
    revert("Method not implemented in mock");
  }

  function getValidator(
    address account
  ) external view returns (bytes memory, bytes memory, address, uint256, address) {
    revert("Method not implemented in mock");
  }
}

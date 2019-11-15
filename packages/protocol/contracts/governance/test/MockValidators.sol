pragma solidity ^0.5.3;

import "../interfaces/IValidators.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockValidators is IValidators {
  mapping(address => bool) public isValidator;
  mapping(address => uint256) private numGroupMembers;
  mapping(address => uint256) private lockedGoldRequirements;
  mapping(address => bool) private doesNotMeetAccountLockedGoldRequirements;
  mapping(address => address[]) private members;
  uint256 private numRegisteredValidators;

  function updateEcdsaPublicKey(address, address, bytes calldata) external returns (bool) {
    return true;
  }

  function setValidator(address account) external {
    isValidator[account] = true;
  }

  function setDoesNotMeetAccountLockedGoldRequirements(address account) external {
    doesNotMeetAccountLockedGoldRequirements[account] = true;
  }

  function meetsAccountLockedGoldRequirements(address account) external view returns (bool) {
    return !doesNotMeetAccountLockedGoldRequirements[account];
  }

  function getGroupNumMembers(address group) public view returns (uint256) {
    return members[group].length;
  }

  function setNumRegisteredValidators(uint256 value) external {
    numRegisteredValidators = value;
  }

  function getNumRegisteredValidators() external view returns (uint256) {
    return numRegisteredValidators;
  }

  function setMembers(address group, address[] calldata _members) external {
    members[group] = _members;
  }

  function setAccountLockedGoldRequirement(address account, uint256 value) external {
    lockedGoldRequirements[account] = value;
  }

  function getAccountLockedGoldRequirement(address account) external view returns (uint256) {
    return lockedGoldRequirements[account];
  }

  function getTopGroupValidators(address group, uint256 n)
    external
    view
    returns (address[] memory)
  {
    require(n <= members[group].length);
    address[] memory validators = new address[](n);
    for (uint256 i = 0; i < n; i++) {
      validators[i] = members[group][i];
    }
    return validators;
  }

  function getGroupsNumMembers(address[] calldata groups) external view returns (uint256[] memory) {
    uint256[] memory numMembers = new uint256[](groups.length);
    for (uint256 i = 0; i < groups.length; i++) {
      numMembers[i] = getGroupNumMembers(groups[i]);
    }
    return numMembers;
  }
}

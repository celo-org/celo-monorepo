// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

interface IMockValidators {
  function isValidator(address) external returns (bool);
  function isValidatorGroup(address) external returns (bool);

  function updateEcdsaPublicKey(address, address, bytes calldata) external returns (bool);

  function updatePublicKeys(
    address,
    address,
    bytes calldata,
    bytes calldata,
    bytes calldata
  ) external returns (bool);

  function setValidator(address) external;

  function setValidatorGroup(address group) external;

  function affiliate(address group) external returns (bool);

  function setDoesNotMeetAccountLockedGoldRequirements(address account) external;

  function setNumRegisteredValidators(uint256 value) external;

  function setMembers(address group, address[] calldata _members) external;

  function setCommission(address group, uint256 commission) external;

  function setAccountLockedGoldRequirement(address account, uint256 value) external;

  function halveSlashingMultiplier(address) external;

  function forceDeaffiliateIfValidator(address validator) external;

  function getTopGroupValidators(address group, uint256 n) external view returns (address[] memory);

  function getValidatorGroup(
    address
  )
    external
    view
    returns (address[] memory, uint256, uint256, uint256, uint256[] memory, uint256, uint256);

  function getValidatorGroupSlashingMultiplier(address) external view returns (uint256);

  function meetsAccountLockedGoldRequirements(address account) external view returns (bool);

  function getNumRegisteredValidators() external view returns (uint256);

  function getAccountLockedGoldRequirement(address account) external view returns (uint256);

  function getGroupsNumMembers(address[] calldata groups) external view returns (uint256[] memory);

  function groupMembershipInEpoch(address addr, uint256, uint256) external view returns (address);

  function getGroupNumMembers(address group) external view returns (uint256);

  function setEpochRewards(address account, uint256 reward) external;

  function mintedStable() external view returns (uint256);
}

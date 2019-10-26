pragma solidity ^0.5.3;


interface IValidators {
  function getAccountBalanceRequirement(address) external view returns (uint256);
  function getGroupNumMembers(address) external view returns (uint256);
  function getGroupsNumMembers(address[] calldata) external view returns (uint256[] memory);
  function getNumRegisteredValidators() external view returns (uint256);
  function getTopGroupValidators(address, uint256) external view returns (address[] memory);
}

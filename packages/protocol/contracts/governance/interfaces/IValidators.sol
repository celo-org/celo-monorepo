pragma solidity ^0.5.3;


interface IValidators {
  function electValidators() external view returns (address[] memory);
  function getNumGroupMembers(address) external view returns (uint256);
  function getNumRegisteredValidators() external view returns (uint256);
}

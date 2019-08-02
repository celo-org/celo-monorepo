pragma solidity ^0.5.8;


interface IValidators {
  function isVoting(address) external view returns (bool);
  function isValidating(address) external view returns (bool);
  function getValidators() external view returns (address[] memory);
}

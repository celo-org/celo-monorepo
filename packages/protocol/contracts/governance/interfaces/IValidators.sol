pragma solidity ^0.5.3;


interface IValidators {
  function isVoting(address) external view returns (bool);
  function isValidating(address) external view returns (bool);
  function getValidators() external view returns (address[] memory);
  function validatorAddressFromCurrentSet(uint256 index) external view returns (address);
  function numberValidatorsInCurrentSet() external view returns (uint256);
}

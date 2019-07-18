pragma solidity ^0.5.8;


interface IValidators {

  function initialize() external;
  function addValidator(address) external;
  function removeValidator(address, uint256) external;
  function addPublicKey(address, bytes calldata) external;
  function getValidators() external view returns (address[] memory);
  function getPublicKey(address) external view returns (bytes memory);
}

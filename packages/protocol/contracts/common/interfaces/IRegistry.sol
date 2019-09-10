pragma solidity ^0.5.8;


interface IRegistry {

  function initialize() external;
  function setAddressFor(string calldata, address) external;
  function getAddressForOrDie(bytes32) external view returns (address);
  function getAddressFor(bytes32) external view returns (address);
}

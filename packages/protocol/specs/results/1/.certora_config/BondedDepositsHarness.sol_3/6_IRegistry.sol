pragma solidity ^0.5.8;


interface IRegistry {

  function initialize() external;
  function setAddressFor(string calldata, address) external;
  function getAddressForOrDie(string calldata) external view returns (address);
  function getAddressFor(string calldata) external view returns (address);
}

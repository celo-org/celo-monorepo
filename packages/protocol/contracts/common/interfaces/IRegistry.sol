pragma solidity ^0.5.8;


interface IRegistry {

  function initialize() external;
  function setAddressFor(string calldata, address) external;
  function getAddressForOrDie(string calldata) external view returns (address);
  function getAddressFor(string calldata) external view returns (address);
  
  // SG: Instrumentation
  function isValidating(address) external view returns (bool);
  function getTotalWeight() external view returns (uint256);
  function getVoterFromAccount(address) external view returns (address);
  function getAccountWeight(address) external view returns (uint256);
  function getAccountFromVoter(address voter) external view returns (address);
}

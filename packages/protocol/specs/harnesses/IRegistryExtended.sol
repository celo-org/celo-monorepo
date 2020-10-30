pragma solidity ^0.5.13;

contract IRegistryExtended {
  /* does not extend IRegistry to avoid overriding issues */
  // SG: Instrumentation
  function isValidating(address) external returns (bool);
  function getTotalWeight() external returns (uint256);
  function getVoterFromAccount(address) external returns (address);
  function getAccountWeight(address) external returns (uint256);
  function getAccountFromVoter(address voter) external returns (address);

}

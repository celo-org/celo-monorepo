pragma solidity ^0.5.3;


interface IAccounts {
  function isAccount(address) external view returns (bool);
  function getAccountFromVoter(address) external view returns (address);
  function getAccountFromValidator(address) external view returns (address);
  function getValidatorFromAccount(address) external view returns (address);
  function getAccountFromAttestor(address) external view returns (address);
  function getAttestorFromAccount(address) external view returns (address);
}

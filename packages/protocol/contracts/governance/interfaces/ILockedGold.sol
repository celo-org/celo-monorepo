pragma solidity ^0.5.3;


interface ILockedGold {
  function getAccountFromActiveVoter(address) external view returns (address);
  function getAccountFromActiveValidator(address) external view returns (address);
  function getAccountFromValidator(address) external view returns (address);
  function getValidatorFromAccount(address) external view returns (address);
  function incrementNonvotingAccountBalance(address, uint256) external;
  function decrementNonvotingAccountBalance(address, uint256) external;
  function getAccountTotalLockedGold(address) external view returns (uint256);
  function getTotalLockedGold() external view returns (uint256);
}

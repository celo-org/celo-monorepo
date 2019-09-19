pragma solidity ^0.5.3;


interface ILockedGold {
  function initialize(address, uint256) external;
  function getAccountFromVoter(address) external view returns (address);
  function incrementNonvotingAccountBalance(address, uint256) external;
  function decrementNonvotingAccountBalance(address, uint256) external;
}

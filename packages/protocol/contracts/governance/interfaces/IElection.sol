pragma solidity ^0.5.3;


interface IElection {
  function getTotalVotes() external view returns (uint256);
  function getAccountTotalVotes(address account) external view returns (uint256);
  function markGroupIneligible(address) external;
  function electValidators() external view returns (address[] memory);
}

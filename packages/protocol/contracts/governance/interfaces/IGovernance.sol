pragma solidity ^0.5.13;

interface IGovernance {
  function removeVotesWhenRevokingDelegatedVotes(address account, uint256 maxAmountAllowed)
    external;
  function isVoting(address) external view returns (bool);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);
}

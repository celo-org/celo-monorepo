pragma solidity ^0.5.13;

import "../interfaces/IGovernance.sol";

/**
 * @title A mock Governance for testing.
 */
contract MockGovernance is IGovernance {
  mapping(address => bool) public isVoting;
  mapping(address => uint256) public totalVotes;
  mapping(address => uint256) public removeVotesCalledFor;

  function() external payable {} // solhint-disable no-empty-blocks

  function setVoting(address voter) external {
    isVoting[voter] = true;
  }

  function setTotalVotes(address voter, uint256 votes) external {
    totalVotes[voter] = votes;
  }

  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256) {
    return totalVotes[account];
  }

  function removeVotesWhenRevokingDelegatedVotes(address account, uint256 maxAmountAllowed)
    external
  {
    removeVotesCalledFor[account] = maxAmountAllowed;
  }
}

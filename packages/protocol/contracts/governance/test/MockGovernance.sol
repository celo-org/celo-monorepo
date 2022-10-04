pragma solidity ^0.5.13;

import "../interfaces/IGovernance.sol";

/**
 * @title A mock Governance for testing.
 */
contract MockGovernance is IGovernance {
  mapping(address => bool) public isVoting;
  mapping(address => uint256) public totalVotes;

  function() external payable {} // solhint-disable no-empty-blocks

  function setVoting(address voter) external {
    isVoting[voter] = true;
  }

  function setTotalVotes(address voter, uint256 votes) external {
    totalVotes[voter] = votes;
  }

  function getTotalVotesByAccount(address account) external view returns (uint256) {
    return totalVotes[account];
  }
}

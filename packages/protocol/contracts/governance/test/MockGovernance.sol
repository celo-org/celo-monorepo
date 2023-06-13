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

  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256) {
    return totalVotes[account];
  }

  function votePartially(
    uint256 proposalId,
    uint256 index,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) external returns (bool) {
    return false;
  }

  function getProposal(uint256 proposalId)
    external
    view
    returns (address, uint256, uint256, uint256, string memory, uint256, bool)
  {
    return (address(0), 0, 0, 0, "", 0, false);
  }

  function getReferendumStageDuration() external view returns (uint256) {
    return 0;
  }

  function getAccountNonvotingLockedGold(address account) external view returns (uint256) {
    return 0;
  }
}

pragma solidity ^0.5.8;

import "../Proposals.sol";


contract ProposalsTest {
  using Proposals for Proposals.Proposal;

  Proposals.Proposal private proposal;

  function setNetworkWeight(uint256 networkWeight) external {
    proposal.networkWeight = networkWeight;
  }

  function setVotes(uint256 yes, uint256 no, uint256 abstain) external {
    proposal.votes.yes = yes;
    proposal.votes.no = no;
    proposal.votes.abstain = abstain;
  }

  function getSupportWithQuorumPadding(int256 criticalBaseline) external view returns (int256) {
    return proposal.getSupportWithQuorumPadding(criticalBaseline);
  }
}

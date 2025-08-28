// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

// TODO: Remove and replace with IGovernance.vote after we migrate out of 0.5
interface IGovernanceVote {
  // enum vote
  enum VoteValue {
    None,
    Abstain,
    No,
    Yes
  }

  // voting
  function vote(uint256 proposalId, uint256 index, VoteValue value) external returns (bool);
}

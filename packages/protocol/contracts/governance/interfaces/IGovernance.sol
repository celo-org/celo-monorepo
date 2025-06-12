// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IGovernance {
  // constitution
  function setConstitution(address destination, bytes4 functionId, uint256 threshold) external;
  function getConstitution(address destination, bytes4 functionId) external view returns (uint256);

  // proposal
  function propose(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    string calldata descriptionUrl
  ) external payable returns (uint256);
  function getProposal(
    uint256 proposalId
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool);
  function proposalCount() external view returns (uint256);

  // upvote
  function upvote(uint256 proposalId, uint256 lesser, uint256 greater) external returns (bool);
  function getUpvotes(uint256 proposalId) external view returns (uint256);

  // approve
  function approve(uint256 proposalId, uint256 index) external returns (bool);
  function isApproved(uint256 proposalId) external view returns (bool);

  // voting
  // TODO: Enable once we migrate out of 0.5
  // function vote(
  //   uint256 proposalId,
  //   uint256 index,
  //   Proposals.VoteValue value
  // ) external returns (bool);
  function votePartially(
    uint256 proposalId,
    uint256 index,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) external returns (bool);
  function removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 maxAmountAllowed
  ) external;
  function isVoting(address account) external view returns (bool);
  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);

  // referendum
  function getReferendumStageDuration() external view returns (uint256);

  // execution
  function execute(uint256 proposalId, uint256 index) external returns (bool);
}

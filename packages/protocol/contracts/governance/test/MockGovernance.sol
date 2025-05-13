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

  function setConstitution(address, bytes4, uint256) external {
    revert("not implemented");
  }

  function getConstitution(address, bytes4) external view returns (uint256) {
    revert("not implemented");
  }

  function propose(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    string calldata descriptionUrl
  ) external payable returns (uint256) {
    return 0;
  }

  function getProposal(
    uint256
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool) {
    return (address(0), 0, 0, 0, "", 0, false);
  }

  function proposalCount() external view returns (uint256) {
    return 0;
  }

  function upvote(uint256 proposalId, uint256 lesser, uint256 greater) external returns (bool) {
    return true;
  }

  function getUpvotes(uint256 proposalId) external view returns (uint256) {
    return 0;
  }

  function approve(uint256 proposalId, uint256 index) external returns (bool) {
    return true;
  }

  function isApproved(uint256 proposalId) external view returns (bool) {
    return true;
  }

  function votePartially(uint256, uint256, uint256, uint256, uint256) external returns (bool) {
    return true;
  }

  function removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 maxAmountAllowed
  ) external {
    removeVotesCalledFor[account] = maxAmountAllowed;
  }

  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256) {
    return (0, 0, 0);
  }

  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256) {
    return totalVotes[account];
  }

  function getReferendumStageDuration() external view returns (uint256) {
    return 0;
  }

  function execute(uint256 proposalId, uint256 index) external returns (bool) {
    return true;
  }
}

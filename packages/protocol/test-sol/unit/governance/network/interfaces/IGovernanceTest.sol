// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "@celo-contracts-8/governance/Proposals.sol";

// Standalone superset interface used by the 0.5 Governance tests to interact
// with the 0.8 Governance implementation deployed via deployCodeTo. Solidity 0.5
// interfaces cannot inherit, so every method the tests need is declared here.
// This includes the helper methods exposed by GovernanceMock08 (addValidator,
// setDeprecatedWeight, removeVotesWhenRevokingDelegatedVotesTest). The
// Proposals enum types are pulled from the dual-pragma 0.5 Proposals library,
// whose VoteValue/Stage layout matches the 0.8 library used by the deployed
// implementation.
interface IGovernanceTest {
  function initialize(
    address registryAddress,
    address _approver,
    uint256 _concurrentProposals,
    uint256 _minDeposit,
    uint256 _queueExpiry,
    uint256 _dequeueFrequency,
    uint256 referendumStageDuration,
    uint256 executionStageDuration,
    uint256 participationBaseline,
    uint256 participationFloor,
    uint256 baselineUpdateFactor,
    uint256 baselineQuorumFactor
  ) external;

  // GovernanceMock08 helpers
  function addValidator(address validator) external;
  function setDeprecatedWeight(
    address voterAddress,
    uint256 proposalIndex,
    uint256 weight,
    uint256 proposalId
  ) external;
  function removeVotesWhenRevokingDelegatedVotesTest(
    address account,
    uint256 maxAmountAllowed
  ) external;

  // setters
  function setApprover(address _approver) external;
  function setConcurrentProposals(uint256 _concurrentProposals) external;
  function setMinDeposit(uint256 _minDeposit) external;
  function setQueueExpiry(uint256 _queueExpiry) external;
  function setDequeueFrequency(uint256 _dequeueFrequency) external;
  function setReferendumStageDuration(uint256 referendumStageDuration) external;
  function setExecutionStageDuration(uint256 executionStageDuration) external;
  function setParticipationFloor(uint256 participationFloor) external;
  function setBaselineUpdateFactor(uint256 baselineUpdateFactor) external;
  function setBaselineQuorumFactor(uint256 baselineQuorumFactor) external;
  function setConstitution(address destination, bytes4 functionId, uint256 threshold) external;
  function setSecurityCouncil(address _council) external;
  function setHotfixExecutionTimeWindow(uint256 timeWindow) external;

  // proposals
  function propose(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    string calldata descriptionUrl
  ) external payable returns (uint256);
  function upvote(uint256 proposalId, uint256 lesser, uint256 greater) external returns (bool);
  function revokeUpvote(uint256 lesser, uint256 greater) external returns (bool);
  function approve(uint256 proposalId, uint256 index) external returns (bool);
  function vote(
    uint256 proposalId,
    uint256 index,
    Proposals.VoteValue value
  ) external returns (bool);
  function votePartially(
    uint256 proposalId,
    uint256 index,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) external returns (bool);
  function revokeVotes() external returns (bool);
  function execute(uint256 proposalId, uint256 index) external returns (bool);
  function withdraw() external returns (bool);
  function dequeueProposalsIfReady() external;
  function removeVotesWhenRevokingDelegatedVotes(address account, uint256 newVotingPower) external;

  // hotfixes
  function approveHotfix(bytes32 hash) external;
  function prepareHotfix(bytes32 hash) external;
  function executeHotfix(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    bytes32 salt
  ) external;
  function resetHotFixRecord(bytes32 hash) external;
  function getHotfixHash(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    bytes32 salt
  ) external pure returns (bytes32);
  function getHotfixRecord(bytes32 hash) external view returns (bool, bool, bool, uint256);

  // views
  function owner() external view returns (address);
  function approver() external view returns (address);
  function concurrentProposals() external view returns (uint256);
  function minDeposit() external view returns (uint256);
  function queueExpiry() external view returns (uint256);
  function dequeueFrequency() external view returns (uint256);
  function lastDequeue() external view returns (uint256);
  function proposalCount() external view returns (uint256);
  function securityCouncil() external view returns (address);
  function hotfixExecutionTimeWindow() external view returns (uint256);
  function dequeued(uint256 index) external view returns (uint256);
  function emptyIndices(uint256 index) external view returns (uint256);
  function getReferendumStageDuration() external view returns (uint256);
  function getExecutionStageDuration() external view returns (uint256);
  function getParticipationParameters() external view returns (uint256, uint256, uint256, uint256);
  function getConstitution(address destination, bytes4 functionId) external view returns (uint256);
  function isQueued(uint256 proposalId) external view returns (bool);
  function isProposalPassing(uint256 proposalId) external view returns (bool);
  function isDequeuedProposalExpired(uint256 proposalId) external view returns (bool);
  function isApproved(uint256 proposalId) external view returns (bool);
  function isVoting(address account) external view returns (bool);
  function proposalExists(uint256 proposalId) external view returns (bool);
  function getProposal(
    uint256 proposalId
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool);
  function getProposalTransaction(
    uint256 proposalId,
    uint256 index
  ) external view returns (uint256, address, bytes memory);
  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256);
  function getVoteRecord(
    address account,
    uint256 index
  ) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
  function getQueueLength() external view returns (uint256);
  function getUpvotes(uint256 proposalId) external view returns (uint256);
  function getQueue() external view returns (uint256[] memory, uint256[] memory);
  function getDequeue() external view returns (uint256[] memory);
  function getUpvoteRecord(address account) external view returns (uint256, uint256);
  function getMostRecentReferendumProposal(address account) external view returns (uint256);
  function getProposalStage(uint256 proposalId) external view returns (Proposals.Stage);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);
}

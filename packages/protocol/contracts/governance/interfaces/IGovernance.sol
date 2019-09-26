pragma solidity ^0.5.3;


interface IGovernance {
  function setApprover(address) external;
  function setConcurrentProposals(uint256) external;
  function setMinDeposit(uint256) external;
  function setQueueExpiry(uint256) external;
  function setDequeueFrequency(uint256) external;
  function setApprovalStageDuration(uint256) external;
  function setReferendumStageDuration(uint256) external;
  function setExecutionStageDuration(uint256) external;
  function setParticipationBaseline(uint256) external;
  function setParticipationFloor(uint256) external;
  function setBaselineUpdateFactor(uint256) external;
  function setBaselineQuorumFactor(uint256) external;
  function setConstitution(address, bytes4, uint256) external;

  function propose(
    uint256[] calldata,
    address[] calldata,
    bytes calldata,
    uint256[] calldata
  ) external payable returns (uint256);

  function upvote(uint256, uint256, uint256) external returns (bool);
  function revokeUpvote(uint256, uint256) external returns (bool);
  function approve(uint256, uint256) external returns (bool);
  function execute(uint256, uint256) external returns (bool);
  function withdraw() external returns (bool);
  function dequeueProposalsIfReady() external;
  function getParticipationParameters() external view returns (uint256, uint256, uint256, uint256);
  function getApprovalStageDuration() external view returns (uint256);
  function getReferendumStageDuration() external view returns (uint256);
  function getExecutionStageDuration() external view returns (uint256);
  function getConstitution(address, bytes4) external view returns (uint256);
  function proposalExists(uint256) external view returns (bool);
  function getProposal(uint256) external view returns (address, uint256, uint256, uint256);

  function getProposalTransaction(
    uint256,
    uint256
  ) external view returns (uint256, address, bytes memory);

  function isApproved(uint256) external view returns (bool);
  function getVoteTotals(uint256) external view returns (uint256, uint256, uint256);
  function getVoteRecord(address, uint256) external view returns (uint256, uint256);
  function getQueueLength() external view returns (uint256);
  function getUpvotes(uint256) external view returns (uint256);
  function getQueue() external view returns (uint256[] memory, uint256[] memory);
  function getDequeue() external view returns (uint256[] memory);
  function getUpvotedProposal(address) external view returns (uint256);
  function getMostRecentReferendumProposal(address) external view returns (uint256);
  function isVoting(address) external view returns (bool);
  function isQueued(uint256) external view returns (bool);
  function isProposalPassing(uint256) external view returns (bool);
}

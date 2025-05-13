pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/governance/interfaces/IGovernance.sol";

/**
 * @title A mock Governance for testing.
 */
contract MockGovernance is IGovernance {
  mapping(address => bool) public isVoting;
  mapping(address => uint256) public totalVotes;
  mapping(address => uint256) public removeVotesCalledFor;

  receive() external payable {}

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
  ) external {}

  function setVoting(address voter) external {
    isVoting[voter] = true;
  }

  function setTotalVotes(address voter, uint256 votes) external {
    totalVotes[voter] = votes;
  }

  function setConstitution(address, bytes4, uint256) external pure {
    revert("not implemented");
  }

  function getConstitution(address, bytes4) external pure returns (uint256) {
    revert("not implemented");
  }

  function propose(
    uint256[] calldata,
    address[] calldata,
    bytes calldata,
    uint256[] calldata,
    string calldata
  ) external payable returns (uint256) {
    return 0;
  }

  function getProposal(
    uint256
  ) external pure returns (address, uint256, uint256, uint256, string memory, uint256, bool) {
    return (address(0), 0, 0, 0, "", 0, false);
  }

  function proposalCount() external pure returns (uint256) {
    return 0;
  }

  function upvote(uint256, uint256, uint256) external pure returns (bool) {
    return true;
  }

  function getUpvotes(uint256) external pure returns (uint256) {
    return 0;
  }

  function approve(uint256, uint256) external pure returns (bool) {
    return true;
  }

  function isApproved(uint256) external pure returns (bool) {
    return true;
  }

  function votePartially(uint256, uint256, uint256, uint256, uint256) external pure returns (bool) {
    return true;
  }

  function removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 maxAmountAllowed
  ) external {
    removeVotesCalledFor[account] = maxAmountAllowed;
  }

  function getVoteTotals(uint256) external pure returns (uint256, uint256, uint256) {
    return (0, 0, 0);
  }

  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256) {
    return totalVotes[account];
  }

  function getReferendumStageDuration() external pure returns (uint256) {
    return 0;
  }

  function execute(uint256, uint256) external pure returns (bool) {
    return true;
  }
}

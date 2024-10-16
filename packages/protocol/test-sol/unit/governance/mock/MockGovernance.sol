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

  function removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 maxAmountAllowed
  ) external {
    removeVotesCalledFor[account] = maxAmountAllowed;
  }

  function setConstitution(address, bytes4, uint256) external {
    revert("not implemented");
  }

  function votePartially(uint256, uint256, uint256, uint256, uint256) external returns (bool) {
    return true;
  }

  function getProposal(
    uint256
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool) {
    return (address(0), 0, 0, 0, "", 0, false);
  }

  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256) {
    return totalVotes[account];
  }

  function getReferendumStageDuration() external pure returns (uint256) {
    return 0;
  }
}

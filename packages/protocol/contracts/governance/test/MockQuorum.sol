pragma solidity ^0.5.8;


/**
 * @title A mock Quorum for testing.
 */
contract MockQuorum {

  struct UpdateCall {
    uint256 totalVotes;
    uint256 totalWeight;
  }

  uint256 public updateCallCount;
  UpdateCall public lastUpdateCall;

  function getLastUpdateCall() external view returns (uint256, uint256) {
    return (lastUpdateCall.totalVotes, lastUpdateCall.totalWeight);
  }

  function updateQuorumBaseline(
    uint256 totalVotes,
    uint256 totalWeight
  )
    external
  {
    updateCallCount++;
    lastUpdateCall.totalVotes = totalVotes;
    lastUpdateCall.totalWeight = totalWeight;
  }
}

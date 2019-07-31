pragma solidity ^0.5.8;


/**
 * @title A mock Quorum for testing.
 */
contract MockQuorum {

  uint256 public updateCallCount;
  int256 public lastUpdateCall;
  int256 public adjustedSupportReturn;

  function setAdjustedSupportReturn(int256 returnValue) external {
    adjustedSupportReturn = returnValue;
  }

  function adjustedSupport(
    uint256 /* yes */,
    uint256 /* no */,
    uint256 /* abstain */,
    uint256 /* totalWeight */
  )
    external
    view
    returns (int256)
  {
    return adjustedSupportReturn;
  }

  function updateQuorumBaseline(
    int256 participation
  )
    external
  {
    updateCallCount++;
    lastUpdateCall = participation;
  }
}

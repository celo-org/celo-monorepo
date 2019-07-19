pragma solidity ^0.5.8;


/**
 * @title A mock Quorum for testing.
 */
contract MockQuorum {

  struct UpdateCall {
    uint256 totalVotes;
    uint256 totalWeight;
  }

  struct ThresholdReturn {
    uint256 numerator;
    uint256 denominator;
  }

  uint256 public updateCallCount;
  UpdateCall public lastUpdateCall;
  ThresholdReturn public thresholdReturn;

  function setThresholdReturn(uint256 numerator, uint256 denominator) external {
    thresholdReturn.numerator = numerator;
    thresholdReturn.denominator = denominator;
  }

  function getLastUpdateCall() external view returns (uint256, uint256) {
    return (lastUpdateCall.totalVotes, lastUpdateCall.totalWeight);
  }

  function threshold(
    uint256 /* totalVotes */,
    uint256 /* totalWeight */,
    uint256 /* baseThresholdNumerator */,
    uint256 /* baseThresholdDenominator */,
    uint256 /* kFactorNumerator */,
    uint256 /* kFactorDenominator */
  )
    external
    view
    returns (uint256, uint256)
  {
    return (thresholdReturn.numerator, thresholdReturn.denominator);
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

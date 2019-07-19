pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IQuorum.sol";
import "../common/Initializable.sol";
import "../stability/FractionUtil.sol";


/**
 * @title Maintains a quorum baseline and computes voting thresholds for Governance.
 */
contract Quorum is IQuorum, Ownable, Initializable {

  using SafeMath for uint256;
  using FractionUtil for FractionUtil.Fraction;

  uint256 constant quorumMaxDigits = 30;
  FractionUtil.Fraction private quorumBaseline;
  FractionUtil.Fraction private quorumFloor;

  event QuorumUpdated(
    uint256 quorumNumerator,
    uint256 quorumDenominator
  );

  /**
   * @notice Initializes quorum baseline.
   * @param initialQuorumNumerator The numerator of the initial value of the quorum baseline.
   * @param initialQuorumDenominator The denominator of the initial value of the quorum baseline.
   * @dev Should be called only once.
   */
  function initialize(
    uint256 initialQuorumNumerator,
    uint256 initialQuorumDenominator,
    uint256 quorumFloorNumerator,
    uint256 quorumFloorDenominator
  )
    external
    initializer
  {
    require(initialQuorumDenominator != 0 && quorumFloorDenominator != 0);
    _transferOwnership(msg.sender);
    quorumBaseline = FractionUtil.Fraction(initialQuorumNumerator, initialQuorumDenominator);
    quorumFloor = FractionUtil.Fraction(quorumFloorNumerator, quorumFloorDenominator);
  }

  /**
   * @notice Returns the numerator and denominator of the current quorum baseline.
   */
  function getQuorumBaseline() external view returns (uint256, uint256) {
    return (quorumBaseline.numerator, quorumBaseline.denominator);
  }

  /**
   * @notice Computes the threshold of a proposal exhibiting a given quorum ratio,
   *   defined as the ratio of the proposal's participation to the quorum baseline.
   *   It is paramterized by a base threshold and a sensitivity coefficient.
   * @param totalVotes The total number of votes on the proposal.
   * @param totalWeight The total account weight across the network.
   * @param baseThresholdNumerator The numerator of the base threshold.
   * @param baseThresholdDenominator The denominator of the base threshold.
   * @param kFactorNumerator The numerator of the sensitivity factor.
   * @param kFactorDenominator The denominator of the sensitivity factor.
   */
  function threshold(
    uint256 totalVotes,
    uint256 totalWeight,
    uint256 baseThresholdNumerator,
    uint256 baseThresholdDenominator,
    uint256 kFactorNumerator,
    uint256 kFactorDenominator
  )
    external
    view
    returns (uint256, uint256)
  {
    require(totalWeight > 0 && baseThresholdDenominator > 0 && kFactorDenominator > 0);
    FractionUtil.Fraction memory participation = FractionUtil.Fraction(totalVotes, totalWeight);
    FractionUtil.Fraction memory quorumRatio = participation.div(quorumBaseline);
    FractionUtil.Fraction memory baseThreshold =
      FractionUtil.Fraction(baseThresholdNumerator, baseThresholdDenominator);
    FractionUtil.Fraction memory kFactor =
      FractionUtil.Fraction(kFactorNumerator, kFactorDenominator);
    FractionUtil.Fraction memory half = FractionUtil.Fraction(1, 2);
    FractionUtil.Fraction memory one = FractionUtil.Fraction(1, 1);
    FractionUtil.Fraction memory adjustedThreshold = baseThreshold
      .sub(half)
      .mul(kFactor.add(one))
      .div(kFactor.add(quorumRatio))
      .add(half);
    return (adjustedThreshold.numerator, adjustedThreshold.denominator);
  }

  /**
   * @notice Updates the quorum baseline using the participation ratio
   *   of the latest proposal under referendum.
   * @param totalVotes The total number of votes on the proposal.
   * @param totalWeight The total account weight across the network.
   */
  function updateQuorumBaseline(
    uint256 totalVotes,
    uint256 totalWeight
  )
    external
  {
    FractionUtil.Fraction memory participation = FractionUtil.Fraction(totalVotes, totalWeight);
    quorumBaseline = quorumBaseline.mul(FractionUtil.Fraction(4, 5))
      .add(participation.mul(FractionUtil.Fraction(1, 5)));
    if (quorumBaseline.isLessThan(quorumFloor)) {
      quorumBaseline = quorumFloor;
    }
    quorumBaseline = quorumBaseline.round(quorumMaxDigits);
    emit QuorumUpdated(quorumBaseline.numerator, quorumBaseline.denominator);
  }
}

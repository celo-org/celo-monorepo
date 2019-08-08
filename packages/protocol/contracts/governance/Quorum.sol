pragma solidity ^0.5.8;

import "fixidity/contracts/FixidityLib.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IQuorum.sol";
import "../common/Initializable.sol";


/**
 * @title Maintains a participation baseline and computes proposal support for Governance.
 */
contract Quorum is IQuorum, Ownable, Initializable {
  using FixidityLib for int256;
  using SafeMath for uint256;

  // The average network participation in governance, weighted toward recent proposals.
  int256 public participationBaseline;
  // The lower bound on the participation baseline.
  int256 public participationFloor;
  // The weight of the most recent proposal's participation on the baseline.
  int256 public updateCoefficient;
  // The fraction of the baseline under which the proposal will be padded with "no" votes.
  int256 public criticalBaselineLevel;

  event ParticipationBaselineUpdated(
    int256 participationBaseline
  );

  event ParticipationFloorSet(
    int256 participationFloor
  );

  event UpdateCoefficientSet(
    int256 updateCoefficient
  );

  event CriticalBaselineLevelSet(
    int256 criticalBaselineLevel
  );

  /**
   * @notice Initializes quorum variables.
   * @param _participationBaseline The initial value of the participation baseline.
   * @param _participationFloor The participation floor.
   * @param _updateCoefficient The weight of the new participation
   *   in the baseline update rule.
   * @param _criticalBaselineLevel The proportion of the baseline under which additional
   *   "no" votes will be added.
   * @dev Should be called only once.
   */
  function initialize(
    int256 _participationBaseline,
    int256 _participationFloor,
    int256 _updateCoefficient,
    int256 _criticalBaselineLevel
  )
    external
    initializer
  {
    require(
      _participationFloor >= 0 &&
      _participationFloor <= FixidityLib.fixed1() &&
      _updateCoefficient >= 0 &&
      _updateCoefficient <= FixidityLib.fixed1() &&
      _criticalBaselineLevel > 0 &&
      _criticalBaselineLevel <= FixidityLib.fixed1()
    );
    _transferOwnership(msg.sender);
    participationBaseline = _participationBaseline;
    participationFloor = _participationFloor;
    updateCoefficient = _updateCoefficient;
    criticalBaselineLevel = _criticalBaselineLevel;
  }

  /**
   * @notice Updates the floor of the participation baseline.
   * @param _participationFloor The value at which the baseline is floored.
   */
  function setParticipationFloor(int256 _participationFloor) external onlyOwner {
    require(
      _participationFloor != participationFloor &&
      _participationFloor >= 0 &&
      _participationFloor <= FixidityLib.fixed1()
    );
    participationFloor = _participationFloor;
    emit ParticipationFloorSet(_participationFloor);
  }

  /**
   * @notice Updates the weight of the new participation in the baseline update rule.
   * @param _updateCoefficient The weight of the new participation.
   */
  function setUpdateCoefficient(int256 _updateCoefficient) external onlyOwner {
    require(
      _updateCoefficient != updateCoefficient &&
      _updateCoefficient >= 0 &&
      _updateCoefficient <= FixidityLib.fixed1()
    );
    updateCoefficient = _updateCoefficient;
    emit UpdateCoefficientSet(_updateCoefficient);
  }

  /**
   * @notice Updates the proportion to compute the critical baseline.
   * @param _criticalBaselineLevel The weight of the new participation.
   */
  function setCriticalBaselineLevel(int256 _criticalBaselineLevel) external onlyOwner {
    require(
      _criticalBaselineLevel != criticalBaselineLevel &&
      _criticalBaselineLevel > 0 &&
      _criticalBaselineLevel <= FixidityLib.fixed1()
    );
    criticalBaselineLevel = _criticalBaselineLevel;
    emit CriticalBaselineLevelSet(_criticalBaselineLevel);
  }

  /**
   * @notice Computes the support ratio for a proposal following quorum adjustment.
   *   If the total participation (yes + no + abstain) is less than the critical
   *   baseline, the total participation is increased to this level. The abstaining votes
   *   are removed, leaving the yes and (potentially increased) no votes. The ratio of yes
   *   votes to this value is returned.
   * @param yes The number of yes votes on the proposal.
   * @param no The number of no votes on the proposal.
   * @param abstain The number of abstain votes on the proposal.
   * @param totalWeight The total weight of the network.
   * @return The support ratio following quorum adjustment.
   */
  function adjustedSupport(
    uint256 yes,
    uint256 no,
    uint256 abstain,
    uint256 totalWeight
  )
    external
    view
    returns (int256)
  {
    if (yes == 0) {
      return 0;
    }
    int256 totalWeightFixed = FixidityLib.newFixed(int256(totalWeight));
    int256 yesRatio = FixidityLib.newFixed(int256(yes)).divide(totalWeightFixed);
    int256 abstainRatio = FixidityLib.newFixed(int256(abstain)).divide(totalWeightFixed);
    int256 participation = FixidityLib.newFixed(int256(yes.add(no).add(abstain)))
      .divide(totalWeightFixed);
    int256 criticalBaseline = participationBaseline.multiply(criticalBaselineLevel);
    int256 adjustedYesNoRatio =
      (participation > criticalBaseline ? participation : criticalBaseline).subtract(abstainRatio);
    int256 support = yesRatio.divide(adjustedYesNoRatio);
    return support;
  }

  /**
   * @notice Updates the participation baseline using the participation ratio
   *   of the latest proposal under referendum. The new baseline is computed as
   *   baseline <- updateCoefficient * participation + (1 - updateCoefficient) * baseline
   * @param participation The participation in the latest proposal.
   */
  function updateParticipationBaseline(int256 participation) external onlyOwner {
    participationBaseline =
      participationBaseline.multiply(FixidityLib.fixed1().subtract(updateCoefficient))
      .add(participation.multiply(updateCoefficient));
    if (participationBaseline < participationFloor) {
      participationBaseline = participationFloor;
    }
    emit ParticipationBaselineUpdated(participationBaseline);
  }
}

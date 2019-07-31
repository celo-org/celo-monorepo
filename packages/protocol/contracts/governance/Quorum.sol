pragma solidity ^0.5.8;

import "fixidity/contracts/FixidityLib.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IQuorum.sol";
import "../common/Initializable.sol";


/**
 * @title Maintains a quorum baseline and computes voting thresholds for Governance.
 */
contract Quorum is IQuorum, Ownable, Initializable {
  using FixidityLib for int256;
  using SafeMath for uint256;

  int256 public quorumBaseline;
  int256 public quorumFloor;
  int256 public updateCoefficient;

  event QuorumUpdated(
    int256 quorum
  );

  /**
   * @notice Initializes quorum baseline.
   * @param quorumBaseline_ The initial value of the quorum baseline.
   * @param quorumFloor_ The quorum floor.
   * @param updateCoefficient_ The weight of the new participation
   *   in the quorum baseline update rule.
   * @dev Should be called only once.
   */
  function initialize(
    int256 quorumBaseline_,
    int256 quorumFloor_,
    int256 updateCoefficient_
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    quorumBaseline = quorumBaseline_;
    quorumFloor = quorumFloor_;
    updateCoefficient = updateCoefficient_;
  }

  /**
   * @notice Computes the support ratio for a proposal following quorum adjustment.
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
    if (yes.add(no) == 0) {
      return 0;
    }
    int256 totalWeightFixed = FixidityLib.newFixed(int256(totalWeight));
    int256 yesRatio = FixidityLib.newFixed(int256(yes)).divide(totalWeightFixed);
    int256 abstainRatio = FixidityLib.newFixed(int256(abstain)).divide(totalWeightFixed);
    int256 participation = FixidityLib.newFixed(int256(yes.add(no).add(abstain)))
      .divide(totalWeightFixed);
    int256 adjustedQuorum =
      (participation > quorumBaseline ? participation : quorumBaseline).subtract(abstainRatio);
    int256 support = yesRatio.divide(adjustedQuorum);
    return support;
  }

  /**
   * @notice Updates the quorum baseline using the participation ratio
   *   of the latest proposal under referendum.
   * @param participation The participation in the latest proposal.
   */
  function updateQuorumBaseline(
    int256 participation
  )
    external
  {
    quorumBaseline = quorumBaseline.multiply(FixidityLib.fixed1().subtract(updateCoefficient))
      .add(participation.multiply(updateCoefficient));
    if (quorumBaseline < quorumFloor) {
      quorumBaseline = quorumFloor;
    }
    emit QuorumUpdated(quorumBaseline);
  }
}

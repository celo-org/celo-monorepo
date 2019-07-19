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

pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./ReleaseGoldInstance.sol";
import "./interfaces/IReleaseGoldFactory.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";

contract ReleaseGoldFactory is Initializable, UsingRegistry, IReleaseGoldFactory {
  using SafeMath for uint256;

  // Mapping between beneficiary addresses and associated release schedule contracts.
  mapping(address => address) public releases;

  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  event NewReleaseGoldInstanceCreated(address indexed beneficiary, address atAddress);

  /**
   * @notice Factory function for creating a new release gold contract instance.
   * @param releaseCliffTime Duration (in seconds) after `releaseStartTime` of the golds' cliff.
   * @param numReleasePeriods Number of releasing periods.
   * @param releaseStartTime The time (in Unix time) at which point releasing starts.
   * @param releasePeriod Duration (in seconds) of each release period.
   * @param amountReleasedPerPeriod The released gold amound per period.
   * @param revocable Whether the release schedule is revocable or not.
   * @param beneficiary Address of the beneficiary to whom released tokens are transferred.
   * @param owner Address capable of revoking, setting the liquidity provision
   *              and setting the withdrawal amount.
   * @param subjectToLiquidityProvision If this schedule is subject to a liquidity provision.
   * @param _canValidate If this schedule's gold can be used for validating.
   * @param _canVote If this schedule's gold can be used for voting.
   * @return The address of the newly created release gold instance.
   */
  function createReleaseGoldInstance(
    uint256 releaseCliffTime,
    uint256 numReleasePeriods,
    uint256 releaseStartTime,
    uint256 releasePeriod,
    uint256 amountReleasedPerPeriod,
    bool revocable,
    address payable beneficiary,
    address payable owner,
    bool subjectToLiquidityProvision,
    bool _canValidate,
    bool _canVote
  ) external onlyOwner returns (address) {
    uint256 releaseGoldAmount = numReleasePeriods.mul(amountReleasedPerPeriod);
    require(
      getGoldToken().balanceOf(address(this)) >= releaseGoldAmount,
      "Factory balance is insufficient to create requested release gold contract"
    );

    require(
      releases[beneficiary] == address(0),
      "Only one release gold contract per beneficiary allowed"
    );

    address newReleaseGoldInstance = address(
      new ReleaseGoldInstance(
        releaseCliffTime,
        numReleasePeriods,
        releaseStartTime,
        releasePeriod,
        amountReleasedPerPeriod,
        revocable,
        beneficiary,
        owner,
        subjectToLiquidityProvision,
        _canValidate,
        _canVote,
        address(registry)
      )
    );
    releases[beneficiary] = newReleaseGoldInstance;
    getGoldToken().transfer(newReleaseGoldInstance, releaseGoldAmount);
    emit NewReleaseGoldInstanceCreated(beneficiary, newReleaseGoldInstance);
    return newReleaseGoldInstance;
  }
}

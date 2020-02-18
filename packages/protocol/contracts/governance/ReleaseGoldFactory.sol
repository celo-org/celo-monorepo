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
  mapping(address => ReleaseGoldInstance[]) public releases;

  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  event NewReleaseGoldInstanceCreated(address indexed beneficiary, address atAddress);

  /**
   * @notice Factory function for creating a new release gold contract instance.
   * @param releaseStartTime The time (in Unix time) at which point releasing starts.
   * @param releaseCliffTime Duration (in seconds) after `releaseStartTime` of the golds' cliff.
   * @param numReleasePeriods Number of releasing periods.
   * @param releasePeriod Duration (in seconds) of each release period.
   * @param amountReleasedPerPeriod The released gold amound per period.
   * @param revocable Whether the release schedule is revocable or not.
   * @param beneficiary Address of the beneficiary to whom released tokens are transferred.
   * @param releaseOwner Address capable of revoking, setting the liquidity provision
   *                      and setting the withdrawal amount.
   *                      Null if grant is not subject to these operations.
   * @param refundAddress Address that receives refunded funds if contract is revoked.
   *                       Null if contract is not revocable.
   * @param subjectToLiquidityProvision If this schedule is subject to a liquidity provision.
   * @param initialDistributionPercentage Percentage of total rewards available for distribution.
   *                                      Expressed to 3 significant figures [0, 1000].
   * @param _canValidate If this schedule's gold can be used for validating.
   * @param _canVote If this schedule's gold can be used for voting.
   * @return The address of the newly created release gold instance.
   */
  function createReleaseGoldInstance(
    uint256 releaseStartTime,
    uint256 releaseCliffTime,
    uint256 numReleasePeriods,
    uint256 releasePeriod,
    uint256 amountReleasedPerPeriod,
    bool revocable,
    address payable beneficiary,
    address releaseOwner,
    address payable refundAddress,
    bool subjectToLiquidityProvision,
    uint256 initialDistributionPercentage,
    bool _canValidate,
    bool _canVote
  ) external onlyOwner returns (address) {
    uint256 releaseGoldAmount = numReleasePeriods.mul(amountReleasedPerPeriod);
    require(
      getGoldToken().balanceOf(address(this)) >= releaseGoldAmount,
      "Factory balance is insufficient to create requested release gold contract"
    );

    ReleaseGoldInstance newReleaseGoldInstance = new ReleaseGoldInstance(
      releaseStartTime,
      releaseCliffTime,
      numReleasePeriods,
      releasePeriod,
      amountReleasedPerPeriod,
      revocable,
      beneficiary,
      releaseOwner,
      refundAddress,
      subjectToLiquidityProvision,
      initialDistributionPercentage,
      _canValidate,
      _canVote,
      address(registry)
    );
    releases[beneficiary].push(newReleaseGoldInstance);
    address releaseGoldInstanceAddress = address(newReleaseGoldInstance);
    getGoldToken().transfer(releaseGoldInstanceAddress, releaseGoldAmount);
    emit NewReleaseGoldInstanceCreated(beneficiary, releaseGoldInstanceAddress);
    return releaseGoldInstanceAddress;
  }
}

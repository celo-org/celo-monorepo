pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/CalledByVm.sol";
import "../common/FixidityLib.sol";
import "../common/Freezable.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

/**
 * @title Contract for calculating epoch rewards.
 */
contract EpochRewards is
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  Freezable,
  CalledByVm
{
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold
  uint256 constant GOLD_SUPPLY_CAP = 1000000000 ether; // 1 billion Gold
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;

  // This struct governs how the rewards multiplier should deviate from 1.0 based on the ratio of
  // supply remaining to target supply remaining.
  struct RewardsMultiplierAdjustmentFactors {
    FixidityLib.Fraction underspend;
    FixidityLib.Fraction overspend;
  }

  // This struct governs the multiplier on the target rewards to give out in a given epoch due to
  // potential deviations in the actual Gold total supply from the target total supply.
  // In the case where the actual exceeds the target (i.e. the protocol has "overspent" with
  // respect to epoch rewards and payments) the rewards multiplier will be less than one.
  // In the case where the actual is less than the target (i.e. the protocol has "underspent" with
  // respect to epoch rewards and payments) the rewards multiplier will be greater than one.
  struct RewardsMultiplierParameters {
    RewardsMultiplierAdjustmentFactors adjustmentFactors;
    // The maximum rewards multiplier.
    FixidityLib.Fraction max;
  }

  // This struct governs the target yield awarded to voters in validator elections.
  struct TargetVotingYieldParameters {
    // The target yield awarded to users voting in validator elections.
    FixidityLib.Fraction target;
    // Governs the adjustment of the target yield based on the deviation of the percentage of
    // Gold voting in validator elections from the `targetVotingGoldFraction`.
    FixidityLib.Fraction adjustmentFactor;
    // The maximum target yield awarded to users voting in validator elections.
    FixidityLib.Fraction max;
  }

  uint256 public startTime = 0;
  RewardsMultiplierParameters private rewardsMultiplierParams;
  TargetVotingYieldParameters private targetVotingYieldParams;
  FixidityLib.Fraction private targetVotingGoldFraction;
  FixidityLib.Fraction private communityRewardFraction;
  FixidityLib.Fraction private carbonOffsettingFraction;
  address public carbonOffsettingPartner;
  uint256 public targetValidatorEpochPayment;

  event TargetVotingGoldFractionSet(uint256 fraction);
  event CommunityRewardFractionSet(uint256 fraction);
  event CarbonOffsettingFundSet(address indexed partner, uint256 fraction);
  event TargetValidatorEpochPaymentSet(uint256 payment);
  event TargetVotingYieldParametersSet(uint256 max, uint256 adjustmentFactor);
  event TargetVotingYieldSet(uint256 target);
  event RewardsMultiplierParametersSet(
    uint256 max,
    uint256 underspendAdjustmentFactor,
    uint256 overspendAdjustmentFactor
  );

  event TargetVotingYieldUpdated(uint256 fraction);

  /**
  * @notice Returns the storage, major, minor, and patch version of the contract.
  * @return Storage version of the contract.
  * @return Major version of the contract.
  * @return Minor version of the contract.
  * @return Patch version of the contract.
  */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 0);
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry contract.
   * @param targetVotingYieldInitial The initial relative target block reward for voters.
   * @param targetVotingYieldMax The max relative target block reward for voters.
   * @param targetVotingYieldAdjustmentFactor The target block reward adjustment factor for voters.
   * @param rewardsMultiplierMax The max multiplier on target epoch rewards.
   * @param rewardsMultiplierUnderspendAdjustmentFactor Adjusts the multiplier on target epoch
   *   rewards when the protocol is running behind the target Gold supply.
   * @param rewardsMultiplierOverspendAdjustmentFactor Adjusts the multiplier on target epoch
   *   rewards when the protocol is running ahead of the target Gold supply.
   * @param _targetVotingGoldFraction The percentage of floating Gold voting to target.
   * @param _targetValidatorEpochPayment The target validator epoch payment.
   * @param _communityRewardFraction The percentage of rewards that go the community funds.
   * @param _carbonOffsettingPartner The address of the carbon offsetting partner.
   * @param _carbonOffsettingFraction The percentage of rewards going to carbon offsetting partner.
   * @dev Should be called only once.
   */
  function initialize(
    address registryAddress,
    uint256 targetVotingYieldInitial,
    uint256 targetVotingYieldMax,
    uint256 targetVotingYieldAdjustmentFactor,
    uint256 rewardsMultiplierMax,
    uint256 rewardsMultiplierUnderspendAdjustmentFactor,
    uint256 rewardsMultiplierOverspendAdjustmentFactor,
    uint256 _targetVotingGoldFraction,
    uint256 _targetValidatorEpochPayment,
    uint256 _communityRewardFraction,
    address _carbonOffsettingPartner,
    uint256 _carbonOffsettingFraction
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    startTime = now;
  }
}

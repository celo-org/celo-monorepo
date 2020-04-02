pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/CalledByVm.sol";
import "../common/FixidityLib.sol";
import "../common/Freezable.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

/**
 * @title Contract for calculating epoch rewards.
 */
contract EpochRewards is
  Ownable,
  Initializable,
  UsingPrecompiles,
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
    setTargetVotingYieldParameters(targetVotingYieldMax, targetVotingYieldAdjustmentFactor);
    setRewardsMultiplierParameters(
      rewardsMultiplierMax,
      rewardsMultiplierUnderspendAdjustmentFactor,
      rewardsMultiplierOverspendAdjustmentFactor
    );
    setTargetVotingGoldFraction(_targetVotingGoldFraction);
    setTargetValidatorEpochPayment(_targetValidatorEpochPayment);
    setCommunityRewardFraction(_communityRewardFraction);
    setCarbonOffsettingFund(_carbonOffsettingPartner, _carbonOffsettingFraction);
    setTargetVotingYield(targetVotingYieldInitial);
    startTime = now;
  }

  /**
   * @notice Returns the target voting yield parameters.
   * @return The target, max, and adjustment factor for target voting yield.
   */
  function getTargetVotingYieldParameters() external view returns (uint256, uint256, uint256) {
    TargetVotingYieldParameters storage params = targetVotingYieldParams;
    return (params.target.unwrap(), params.max.unwrap(), params.adjustmentFactor.unwrap());
  }

  /**
   * @notice Returns the rewards multiplier parameters.
   * @return The max multiplier and under/over spend adjustment factors.
   */
  function getRewardsMultiplierParameters() external view returns (uint256, uint256, uint256) {
    RewardsMultiplierParameters storage params = rewardsMultiplierParams;
    return (
      params.max.unwrap(),
      params.adjustmentFactors.underspend.unwrap(),
      params.adjustmentFactors.overspend.unwrap()
    );
  }

  /**
   * @notice Sets the community reward percentage
   * @param value The percentage of the total reward to be sent to the community funds.
   * @return True upon success.
   */
  function setCommunityRewardFraction(uint256 value) public onlyOwner returns (bool) {
    require(value != communityRewardFraction.unwrap() && value < FixidityLib.fixed1().unwrap());
    communityRewardFraction = FixidityLib.wrap(value);
    emit CommunityRewardFractionSet(value);
    return true;
  }

  /**
   * @notice Returns the community reward fraction.
   * @return The percentage of total reward which goes to the community funds.
   */
  function getCommunityRewardFraction() external view returns (uint256) {
    return communityRewardFraction.unwrap();
  }

  /**
   * @notice Sets the carbon offsetting fund.
   * @param partner The address of the carbon offsetting partner.
   * @param value The percentage of the total reward to be sent to the carbon offsetting partner.
   * @return True upon success.
   */
  function setCarbonOffsettingFund(address partner, uint256 value) public onlyOwner returns (bool) {
    require(partner != carbonOffsettingPartner || value != carbonOffsettingFraction.unwrap());
    require(value < FixidityLib.fixed1().unwrap());
    carbonOffsettingPartner = partner;
    carbonOffsettingFraction = FixidityLib.wrap(value);
    emit CarbonOffsettingFundSet(partner, value);
    return true;
  }

  /**
   * @notice Returns the carbon offsetting partner reward fraction.
   * @return The percentage of total reward which goes to the carbon offsetting partner.
   */
  function getCarbonOffsettingFraction() external view returns (uint256) {
    return carbonOffsettingFraction.unwrap();
  }

  /**
   * @notice Sets the target voting Gold fraction.
   * @param value The percentage of floating Gold voting to target.
   * @return True upon success.
   */
  function setTargetVotingGoldFraction(uint256 value) public onlyOwner returns (bool) {
    require(value != targetVotingGoldFraction.unwrap(), "Target voting gold fraction unchanged");
    require(
      value < FixidityLib.fixed1().unwrap(),
      "Target voting gold fraction cannot be larger than 1"
    );
    targetVotingGoldFraction = FixidityLib.wrap(value);
    emit TargetVotingGoldFractionSet(value);
    return true;
  }

  /**
   * @notice Returns the target voting Gold fraction.
   * @return The percentage of floating Gold voting to target.
   */
  function getTargetVotingGoldFraction() external view returns (uint256) {
    return targetVotingGoldFraction.unwrap();
  }

  /**
   * @notice Sets the target per-epoch payment in Celo Dollars for validators.
   * @param value The value in Celo Dollars.
   * @return True upon success.
   */
  function setTargetValidatorEpochPayment(uint256 value) public onlyOwner returns (bool) {
    require(value != targetValidatorEpochPayment, "Target validator epoch payment unchanged");
    targetValidatorEpochPayment = value;
    emit TargetValidatorEpochPaymentSet(value);
    return true;
  }

  /**
   * @notice Sets the rewards multiplier parameters.
   * @param max The max multiplier on target epoch rewards.
   * @param underspendAdjustmentFactor Adjusts the multiplier on target epoch rewards when the
   *   protocol is running behind the target Gold supply.
   * @param overspendAdjustmentFactor Adjusts the multiplier on target epoch rewards when the
   *   protocol is running ahead of the target Gold supply.
   * @return True upon success.
   */
  function setRewardsMultiplierParameters(
    uint256 max,
    uint256 underspendAdjustmentFactor,
    uint256 overspendAdjustmentFactor
  ) public onlyOwner returns (bool) {
    require(
      max != rewardsMultiplierParams.max.unwrap() ||
        overspendAdjustmentFactor != rewardsMultiplierParams.adjustmentFactors.overspend.unwrap() ||
        underspendAdjustmentFactor != rewardsMultiplierParams.adjustmentFactors.underspend.unwrap(),
      "Bad rewards multiplier parameters"
    );
    rewardsMultiplierParams = RewardsMultiplierParameters(
      RewardsMultiplierAdjustmentFactors(
        FixidityLib.wrap(underspendAdjustmentFactor),
        FixidityLib.wrap(overspendAdjustmentFactor)
      ),
      FixidityLib.wrap(max)
    );
    emit RewardsMultiplierParametersSet(max, underspendAdjustmentFactor, overspendAdjustmentFactor);
    return true;
  }

  /**
   * @notice Sets the target voting yield parameters.
   * @param max The max relative target block reward for voters.
   * @param adjustmentFactor The target block reward adjustment factor for voters.
   * @return True upon success.
   */
  function setTargetVotingYieldParameters(uint256 max, uint256 adjustmentFactor)
    public
    onlyOwner
    returns (bool)
  {
    require(
      max != targetVotingYieldParams.max.unwrap() ||
        adjustmentFactor != targetVotingYieldParams.adjustmentFactor.unwrap(),
      "Bad target voting yield parameters"
    );
    targetVotingYieldParams.max = FixidityLib.wrap(max);
    targetVotingYieldParams.adjustmentFactor = FixidityLib.wrap(adjustmentFactor);
    require(
      targetVotingYieldParams.max.lt(FixidityLib.fixed1()),
      "Max target voting yield must be lower than 100%"
    );
    emit TargetVotingYieldParametersSet(max, adjustmentFactor);
    return true;
  }

  /**
   * @notice Sets the target voting yield.  Uses fixed point arithmetic
   * for protection against overflow.
   * @param targetVotingYield The relative target block reward for voters.
   * @return True upon success.
   */
  function setTargetVotingYield(uint256 targetVotingYield) public onlyOwner returns (bool) {
    FixidityLib.Fraction memory target = FixidityLib.wrap(targetVotingYield);
    require(
      target.lte(targetVotingYieldParams.max),
      "Target voting yield must be less than or equal to max"
    );
    targetVotingYieldParams.target = target;
    emit TargetVotingYieldSet(targetVotingYield);
    return true;
  }

  /**
   * @notice Returns the target Gold supply according to the epoch rewards target schedule.
   * @return The target Gold supply according to the epoch rewards target schedule.
   */
  function getTargetGoldTotalSupply() public view returns (uint256) {
    uint256 timeSinceInitialization = now.sub(startTime);
    if (timeSinceInitialization < SECONDS_LINEAR) {
      // Pay out half of all block rewards linearly.
      uint256 linearRewards = GOLD_SUPPLY_CAP.sub(GENESIS_GOLD_SUPPLY).div(2);
      uint256 targetRewards = linearRewards.mul(timeSinceInitialization).div(SECONDS_LINEAR);
      return targetRewards.add(GENESIS_GOLD_SUPPLY);
    } else {
      // TODO(asa): Implement block reward calculation for years 15-30.
      require(false, "Implement block reward calculation for years 15-30");
      return 0;
    }
  }

  /**
   * @notice Returns the rewards multiplier based on the current and target Gold supplies.
   * @param targetGoldSupplyIncrease The target increase in current Gold supply.
   * @return The rewards multiplier based on the current and target Gold supplies.
   */
  function _getRewardsMultiplier(uint256 targetGoldSupplyIncrease)
    internal
    view
    returns (FixidityLib.Fraction memory)
  {
    uint256 targetSupply = getTargetGoldTotalSupply();
    uint256 totalSupply = getGoldToken().totalSupply();
    uint256 remainingSupply = GOLD_SUPPLY_CAP.sub(totalSupply.add(targetGoldSupplyIncrease));
    uint256 targetRemainingSupply = GOLD_SUPPLY_CAP.sub(targetSupply);
    FixidityLib.Fraction memory remainingToTargetRatio = FixidityLib
      .newFixed(remainingSupply)
      .divide(FixidityLib.newFixed(targetRemainingSupply));
    if (remainingToTargetRatio.gt(FixidityLib.fixed1())) {
      FixidityLib.Fraction memory delta = remainingToTargetRatio
        .subtract(FixidityLib.fixed1())
        .multiply(rewardsMultiplierParams.adjustmentFactors.underspend);
      FixidityLib.Fraction memory multiplier = FixidityLib.fixed1().add(delta);
      if (multiplier.lt(rewardsMultiplierParams.max)) {
        return multiplier;
      } else {
        return rewardsMultiplierParams.max;
      }
    } else if (remainingToTargetRatio.lt(FixidityLib.fixed1())) {
      FixidityLib.Fraction memory delta = FixidityLib
        .fixed1()
        .subtract(remainingToTargetRatio)
        .multiply(rewardsMultiplierParams.adjustmentFactors.overspend);
      if (delta.lt(FixidityLib.fixed1())) {
        return FixidityLib.fixed1().subtract(delta);
      } else {
        return FixidityLib.wrap(0);
      }
    } else {
      return FixidityLib.fixed1();
    }
  }

  /**
   * @notice Returns the total target epoch rewards for voters.
   * @return the total target epoch rewards for voters.
   */
  function getTargetVoterRewards() public view returns (uint256) {
    return
      FixidityLib
        .newFixed(getElection().getActiveVotes())
        .multiply(targetVotingYieldParams.target)
        .fromFixed();
  }

  /**
   * @notice Returns the total target epoch payments to validators, converted to Gold.
   * @return The total target epoch payments to validators, converted to Gold.
   */
  function getTargetTotalEpochPaymentsInGold() public view returns (uint256) {
    address stableTokenAddress = registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID);
    (uint256 numerator, uint256 denominator) = getSortedOracles().medianRate(stableTokenAddress);
    return
      numberValidatorsInCurrentSet().mul(targetValidatorEpochPayment).mul(denominator).div(
        numerator
      );
  }

  /**
   * @notice Returns the target gold supply increase used in calculating the rewards multiplier.
   * @return The target increase in gold w/out the rewards multiplier.
   */
  function _getTargetGoldSupplyIncrease() internal view returns (uint256) {
    uint256 targetEpochRewards = getTargetVoterRewards();
    uint256 targetTotalEpochPaymentsInGold = getTargetTotalEpochPaymentsInGold();
    uint256 targetGoldSupplyIncrease = targetEpochRewards.add(targetTotalEpochPaymentsInGold);
    // increase /= (1 - fraction) st the final community reward is fraction * increase
    targetGoldSupplyIncrease = FixidityLib
      .newFixed(targetGoldSupplyIncrease)
      .divide(
      FixidityLib.newFixed(1).subtract(communityRewardFraction).subtract(carbonOffsettingFraction)
    )
      .fromFixed();
    return targetGoldSupplyIncrease;
  }

  /**
   * @notice Returns the rewards multiplier based on the current and target Gold supplies.
   * @return The rewards multiplier based on the current and target Gold supplies.
   */
  function getRewardsMultiplier() external view returns (uint256) {
    return _getRewardsMultiplier(_getTargetGoldSupplyIncrease()).unwrap();
  }

  /**
   * @notice Returns the fraction of floating Gold being used for voting in validator elections.
   * @return The fraction of floating Gold being used for voting in validator elections.
   */
  function getVotingGoldFraction() public view returns (uint256) {
    uint256 liquidGold = getGoldToken().totalSupply().sub(getReserve().getReserveGoldBalance());
    uint256 votingGold = getElection().getTotalVotes();
    return FixidityLib.newFixed(votingGold).divide(FixidityLib.newFixed(liquidGold)).unwrap();
  }

  /**
   * @notice Updates the target voting yield based on the difference between the target and current
   *   voting Gold fraction.
   */
  function _updateTargetVotingYield() internal onlyWhenNotFrozen {
    FixidityLib.Fraction memory votingGoldFraction = FixidityLib.wrap(getVotingGoldFraction());
    if (votingGoldFraction.gt(targetVotingGoldFraction)) {
      FixidityLib.Fraction memory votingGoldFractionDelta = votingGoldFraction.subtract(
        targetVotingGoldFraction
      );
      FixidityLib.Fraction memory targetVotingYieldDelta = votingGoldFractionDelta.multiply(
        targetVotingYieldParams.adjustmentFactor
      );
      if (targetVotingYieldDelta.gte(targetVotingYieldParams.target)) {
        targetVotingYieldParams.target = FixidityLib.newFixed(0);
      } else {
        targetVotingYieldParams.target = targetVotingYieldParams.target.subtract(
          targetVotingYieldDelta
        );
      }
    } else if (votingGoldFraction.lt(targetVotingGoldFraction)) {
      FixidityLib.Fraction memory votingGoldFractionDelta = targetVotingGoldFraction.subtract(
        votingGoldFraction
      );
      FixidityLib.Fraction memory targetVotingYieldDelta = votingGoldFractionDelta.multiply(
        targetVotingYieldParams.adjustmentFactor
      );
      targetVotingYieldParams.target = targetVotingYieldParams.target.add(targetVotingYieldDelta);
      if (targetVotingYieldParams.target.gt(targetVotingYieldParams.max)) {
        targetVotingYieldParams.target = targetVotingYieldParams.max;
      }
    }
    emit TargetVotingYieldUpdated(targetVotingYieldParams.target.unwrap());
  }

  /**
   * @notice Updates the target voting yield based on the difference between the target and current
   *   voting Gold fraction.
   * @dev Only called directly by the protocol.
   */
  function updateTargetVotingYield() external onlyVm onlyWhenNotFrozen {
    _updateTargetVotingYield();
  }

  /**
   * @notice Determines if the reserve is low enough to demand a diversion from
   *    the community reward. Targets initial critical ratio of 2 with a linear
   *    decline until 25 years have passed where the critical ratio will be 1.
   */
  function isReserveLow() external view returns (bool) {
    // critical reserve ratio = 2 - time in second / 25 years
    FixidityLib.Fraction memory timeSinceInitialization = FixidityLib.newFixed(now.sub(startTime));
    FixidityLib.Fraction memory m = FixidityLib.newFixed(25 * 365 * 1 days);
    FixidityLib.Fraction memory b = FixidityLib.newFixed(2);
    FixidityLib.Fraction memory criticalRatio;
    // Don't let the critical reserve ratio go under 1 after 25 years.
    if (timeSinceInitialization.gte(m)) {
      criticalRatio = FixidityLib.fixed1();
    } else {
      criticalRatio = b.subtract(timeSinceInitialization.divide(m));
    }
    FixidityLib.Fraction memory ratio = FixidityLib.wrap(getReserve().getReserveRatio());
    return ratio.lte(criticalRatio);
  }

  /**
   * @notice Calculates the per validator epoch payment and the total rewards to voters.
   * @return The per validator epoch reward, the total rewards to voters, the total community
   * reward, and the total carbon offsetting partner reward.
   */
  function calculateTargetEpochRewards()
    external
    view
    onlyWhenNotFrozen
    returns (uint256, uint256, uint256, uint256)
  {
    uint256 targetVoterReward = getTargetVoterRewards();
    uint256 targetGoldSupplyIncrease = _getTargetGoldSupplyIncrease();
    FixidityLib.Fraction memory rewardsMultiplier = _getRewardsMultiplier(targetGoldSupplyIncrease);
    return (
      FixidityLib.newFixed(targetValidatorEpochPayment).multiply(rewardsMultiplier).fromFixed(),
      FixidityLib.newFixed(targetVoterReward).multiply(rewardsMultiplier).fromFixed(),
      FixidityLib
        .newFixed(targetGoldSupplyIncrease)
        .multiply(communityRewardFraction)
        .multiply(rewardsMultiplier)
        .fromFixed(),
      FixidityLib
        .newFixed(targetGoldSupplyIncrease)
        .multiply(carbonOffsettingFraction)
        .multiply(rewardsMultiplier)
        .fromFixed()
    );
  }
}

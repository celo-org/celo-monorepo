pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

/**
 * @title Contract for calculating epoch rewards.
 */
contract EpochRewards is Ownable, Initializable, UsingPrecompiles, UsingRegistry {

  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000000000000000000000;
  uint256 constant GOLD_SUPPLY_CAP = 1000000000000000000000000000;
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;
  uint256 constant FIXIDITY_E = 2718281828459045235360287;
  uint256 constant FIXIDITY_LN2 = 693147180559945309417232;

  struct RewardsMultiplierAdjustmentFactors {
    FixidityLib.Fraction underspend;
    FixidityLib.Fraction overspend;
  }

  struct TargetVotingYieldParameters {
    FixidityLib.Fraction target;
    FixidityLib.Fraction max;
    FixidityLib.Fraction adjustmentFactor;
  }

  uint256 private startTime = 0;
  RewardsMultiplierAdjustmentFactors private rewardsMultiplierAdjustmentFactors;
  TargetVotingYieldParameters private targetVotingYieldParams;
  FixidityLib.Fraction private targetVotingGoldFraction;
  uint256 public maxValidatorEpochPayment;

  event TargetVotingGoldFractionSet(uint256 fraction);
  event MaxValidatorEpochPaymentSet(uint256 payment);
  event TargetVotingYieldParametersSet(uint256 max, uint256 adjustmentFactor);
  event RewardsMultiplierAdjustmentFactorsSet(uint256 underspend, uint256 overspend);
  event Debug(uint256 value, string desc);

  /**
   * @param _maxValidatorEpochPayment The duration the above gold remains locked after deregistration.
   */
  function initialize(
    address registryAddress,
    uint256 targetVotingYieldInitial,
    uint256 targetVotingYieldMax,
    uint256 targetVotingYieldAdjustmentFactor,
    uint256 rewardsMultiplierUnderspendAdjustmentFactor,
    uint256 rewardsMultiplierOverspendAdjustmentFactor,
    uint256 _targetVotingGoldFraction,
    uint256 _maxValidatorEpochPayment
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setTargetVotingYieldParameters(targetVotingYieldMax, targetVotingYieldAdjustmentFactor);
    setRewardsMultiplierAdjustmentFactors(
      rewardsMultiplierUnderspendAdjustmentFactor,
      rewardsMultiplierOverspendAdjustmentFactor
    );
    setTargetVotingGoldFraction(_targetVotingGoldFraction);
    setMaxValidatorEpochPayment(_maxValidatorEpochPayment);
    targetVotingYieldParams.target = FixidityLib.wrap(targetVotingYieldInitial);
    startTime = now;
  }

  function getTargetVotingYieldParameters() external view returns (uint256, uint256, uint256) {
    TargetVotingYieldParameters storage params = targetVotingYieldParams;
    return (params.target.unwrap(), params.max.unwrap(), params.adjustmentFactor.unwrap());
  }

  function getRewardsMultiplierAdjustmentFactors() external view returns (uint256, uint256) {
    RewardsMultiplierAdjustmentFactors storage factors = rewardsMultiplierAdjustmentFactors;
    return (factors.underspend.unwrap(), factors.overspend.unwrap());
  }

  function setTargetVotingGoldFraction(uint256 value) public onlyOwner returns (bool) {
    require(value != targetVotingGoldFraction.unwrap() && value < FixidityLib.fixed1().unwrap());
    targetVotingGoldFraction = FixidityLib.wrap(value);
    emit TargetVotingGoldFractionSet(value);
    return true;
  }

  function getTargetVotingGoldFraction() external view returns (uint256) {
    return targetVotingGoldFraction.unwrap();
  }

  /**
   * @notice Sets the max per-epoch payment in Celo Dollars for validators.
   * @param value The value in Celo Dollars.
   * @return True upon success.
   */
  function setMaxValidatorEpochPayment(uint256 value) public onlyOwner returns (bool) {
    require(value != maxValidatorEpochPayment);
    maxValidatorEpochPayment = value;
    emit MaxValidatorEpochPaymentSet(value);
    return true;
  }

  function setRewardsMultiplierAdjustmentFactors(uint256 underspend, uint256 overspend) public onlyOwner returns (bool) {
    require(
      underspend != rewardsMultiplierAdjustmentFactors.underspend.unwrap() ||
      overspend != rewardsMultiplierAdjustmentFactors.overspend.unwrap()
    );
    rewardsMultiplierAdjustmentFactors = RewardsMultiplierAdjustmentFactors(
      FixidityLib.wrap(underspend),
      FixidityLib.wrap(overspend)
    );
    emit RewardsMultiplierAdjustmentFactorsSet(underspend, overspend);
    return true;
  }

  function setTargetVotingYieldParameters(uint256 max, uint256 adjustmentFactor) public onlyOwner returns (bool) {
    require(
      max != targetVotingYieldParams.max.unwrap() ||
      adjustmentFactor != targetVotingYieldParams.adjustmentFactor.unwrap()
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

  function _getTargetGoldTotalSupply() internal view returns (uint256) {
    uint256 timeSinceInitialization = now.sub(startTime);
    if (timeSinceInitialization < SECONDS_LINEAR) {
      // Pay out half of all block rewards linearly.
      uint256 linearRewards = GOLD_SUPPLY_CAP.sub(GENESIS_GOLD_SUPPLY).div(2);
      uint256 targetRewards = linearRewards.mul(timeSinceInitialization).div(SECONDS_LINEAR);
      return targetRewards.add(GENESIS_GOLD_SUPPLY);
    } else {
      // TODO(asa): Implement block reward calculation for years 15-30.
      return 0;
    }
  }

  function _getRewardsMultiplier(uint256 targetGoldSupplyIncrease) internal view returns (FixidityLib.Fraction memory) {
    uint256 targetSupply = _getTargetGoldTotalSupply();
    uint256 totalSupply = getGoldToken().totalSupply();
    uint256 remainingSupply = GOLD_SUPPLY_CAP.sub(totalSupply.add(targetGoldSupplyIncrease));
    uint256 targetRemainingSupply = GOLD_SUPPLY_CAP.sub(targetSupply);
    FixidityLib.Fraction memory ratio = FixidityLib.newFixed(remainingSupply).divide(FixidityLib.newFixed(targetRemainingSupply));
    /*
    if (ratio.gt(FixidityLib.fixed1())) {
      FixidityLib.Fraction memory delta = ratio.subtract(FixidityLib.fixed1());
      return delta.multiply(rewardsMultiplierAdjustmentFactors.underspend).add(FixidityLib.fixed1());
    } else if (ratio.lt(FixidityLib.fixed1())) {
      FixidityLib.Fraction memory delta = FixidityLib.fixed1().subtract(ratio);
      return FixidityLib.fixed1().subtract(delta.multiply(rewardsMultiplierAdjustmentFactors.overspend));
    } else {
      return FixidityLib.fixed1();
    }
    */
    return FixidityLib.fixed1();
  }

  function _getTargetEpochRewards() internal view returns (uint256) {
    return FixidityLib.newFixed(getElection().getActiveVotes()).multiply(targetVotingYieldParams.target).fromFixed();
  }

  function _getTargetTotalEpochPaymentsInGold() internal view returns (uint256) {
    address stableTokenAddress = registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID);
    (uint256 numerator, uint256 denominator) = getSortedOracles().medianRate(stableTokenAddress);
    uint256 targetEpochPayment = numberValidatorsInCurrentSet().mul(maxValidatorEpochPayment).mul(denominator).div(numerator);
    return targetEpochPayment;
  }

  function _updateTargetVotingYield() internal {
    // TODO(asa): Ignore custodial accounts.
    address reserveAddress = registry.getAddressForOrDie(RESERVE_REGISTRY_ID);
    uint256 liquidGold = getGoldToken().totalSupply().sub(reserveAddress.balance);
    // TODO(asa): Should this be active votes?
    uint256 votingGold = getElection().getTotalVotes();
    FixidityLib.Fraction memory votingGoldFraction = FixidityLib.newFixed(votingGold).divide(FixidityLib.newFixed(liquidGold));
    emit Debug(votingGoldFraction.unwrap(), "voting gold fraction");
    emit Debug(targetVotingGoldFraction.unwrap(), "target voting gold fraction");
    if (votingGoldFraction.gt(targetVotingGoldFraction)) {
      FixidityLib.Fraction memory votingGoldFractionDelta = votingGoldFraction.subtract(targetVotingGoldFraction);
      emit Debug(votingGoldFractionDelta.unwrap(), "voting gold fraction delta");
      FixidityLib.Fraction memory targetVotingYieldDelta = votingGoldFractionDelta.multiply(targetVotingYieldParams.adjustmentFactor);
      emit Debug(targetVotingYieldDelta.unwrap(), "target voting yield delta");
      if (targetVotingYieldDelta.gte(targetVotingYieldParams.target)) {
        targetVotingYieldParams.target = FixidityLib.newFixed(0);
      } else {
        targetVotingYieldParams.target = targetVotingYieldParams.target.subtract(targetVotingYieldDelta);
      }
    } else if (votingGoldFraction.lt(targetVotingGoldFraction)) {
      FixidityLib.Fraction memory votingGoldFractionDelta = targetVotingGoldFraction.subtract(votingGoldFraction);
      emit Debug(votingGoldFractionDelta.unwrap(), "voting gold fraction delta");
      FixidityLib.Fraction memory targetVotingYieldDelta = votingGoldFractionDelta.multiply(targetVotingYieldParams.adjustmentFactor);
      emit Debug(targetVotingYieldDelta.unwrap(), "target voting yield delta");
      targetVotingYieldParams.target = targetVotingYieldParams.target.add(targetVotingYieldDelta);
      if (targetVotingYieldParams.target.gt(targetVotingYieldParams.max)) {
        targetVotingYieldParams.target = targetVotingYieldParams.max;
      }
    }
  }

  function updateTargetVotingYield() external {
    require(msg.sender == address(0));
    _updateTargetVotingYield();
  }

  function calculateTargetEpochPaymentAndRewards() external view returns (uint256, uint256) {
    uint256 targetEpochRewards = _getTargetEpochRewards();
    uint256 targetTotalEpochPaymentsInGold = _getTargetTotalEpochPaymentsInGold();
    uint256 targetGoldSupplyIncrease = targetEpochRewards.add(targetTotalEpochPaymentsInGold);
    FixidityLib.Fraction memory rewardsMultiplier = _getRewardsMultiplier(targetGoldSupplyIncrease);
    return (
      /*
      FixidityLib.newFixed(maxValidatorEpochPayment).multiply(rewardsMultiplier).fromFixed(),
      FixidityLib.newFixed(targetEpochRewards).multiply(rewardsMultiplier).fromFixed()
      */
      maxValidatorEpochPayment,
      targetEpochRewards
    );
  }
}

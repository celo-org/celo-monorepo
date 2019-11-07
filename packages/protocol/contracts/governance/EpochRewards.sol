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

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000000000000000000000; // 600 million Gold
  uint256 constant GOLD_SUPPLY_CAP = 1000000000000000000000000000; // 1 billion Gold
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;

  struct RewardsMultiplierAdjustmentFactors {
    FixidityLib.Fraction underspend;
    FixidityLib.Fraction overspend;
  }

  struct RewardsMultiplierParameters {
    RewardsMultiplierAdjustmentFactors adjustmentFactors;
    FixidityLib.Fraction max;
  }

  struct TargetVotingYieldParameters {
    FixidityLib.Fraction target;
    FixidityLib.Fraction adjustmentFactor;
    FixidityLib.Fraction max;
  }

  uint256 private startTime = 0;
  RewardsMultiplierParameters private rewardsMultiplierParams;
  TargetVotingYieldParameters private targetVotingYieldParams;
  FixidityLib.Fraction private targetVotingGoldFraction;
  uint256 public targetValidatorEpochPayment;

  event TargetVotingGoldFractionSet(uint256 fraction);
  event TargetValidatorEpochPaymentSet(uint256 payment);
  event TargetVotingYieldParametersSet(uint256 max, uint256 adjustmentFactor);
  event RewardsMultiplierParametersSet(
    uint256 max,
    uint256 underspendAdjustmentFactor,
    uint256 overspendAdjustmentFactor
  );

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param targetVotingYieldInitial The initial relative target block reward for voters.
   * @param targetVotingYieldMax The max relative target block reward for voters.
   * @param targetVotingYieldAdjustmentFactor The target block reward adjustment factor for voters.
   * @param rewardsMultiplierMax The max multiplier on target epoch rewards.
   * @param rewardsMultiplierUnderspendAdjustmentFactor Adjusts the multiplier on target epoch
   *   rewards when the protocol is running behind the target gold supply.
   * @param rewardsMultiplierOverspendAdjustmentFactor Adjusts the multiplier on target epoch
   *   rewards when the protocol is running ahead of the target gold supply.
   * @param _targetVotingGoldFraction The percentage of floating gold voting to target.
   * @param _targetValidatorEpochPayment The target validator epoch payment.
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
    uint256 _targetValidatorEpochPayment
  )
    external
    initializer
  {
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
    targetVotingYieldParams.target = FixidityLib.wrap(targetVotingYieldInitial);
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
   * @notice Sets the target voting gold fraction.
   * @param value The percentage of floating gold voting to target.
   * @return True upon success.
   */
  function setTargetVotingGoldFraction(uint256 value) public onlyOwner returns (bool) {
    require(value != targetVotingGoldFraction.unwrap() && value < FixidityLib.fixed1().unwrap());
    targetVotingGoldFraction = FixidityLib.wrap(value);
    emit TargetVotingGoldFractionSet(value);
    return true;
  }

  /**
   * @notice Returns the target voting gold fraction.
   * @return The percentage of floating gold voting to target.
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
    require(value != targetValidatorEpochPayment);
    targetValidatorEpochPayment = value;
    emit TargetValidatorEpochPaymentSet(value);
    return true;
  }

  /**
   * @notice Sets the rewards multiplier parameters.
   * @param max The max multiplier on target epoch rewards.
   * @param underspendAdjustmentFactor Adjusts the multiplier on target epoch rewards when the
   *   protocol is running behind the target gold supply.
   * @param overspendAdjustmentFactor Adjusts the multiplier on target epoch rewards when the
   *   protocol is running ahead of the target gold supply.
   * @return True upon success.
   */
  function setRewardsMultiplierParameters(
    uint256 max,
    uint256 underspendAdjustmentFactor,
    uint256 overspendAdjustmentFactor
  )
    public
    onlyOwner
    returns (bool)
  {
    require(
      max != rewardsMultiplierParams.max.unwrap() ||
      overspendAdjustmentFactor != rewardsMultiplierParams.adjustmentFactors.overspend.unwrap() ||
      underspendAdjustmentFactor != rewardsMultiplierParams.adjustmentFactors.underspend.unwrap()
    );
    rewardsMultiplierParams = RewardsMultiplierParameters(
      RewardsMultiplierAdjustmentFactors(
        FixidityLib.wrap(underspendAdjustmentFactor),
        FixidityLib.wrap(overspendAdjustmentFactor)
      ),
      FixidityLib.wrap(max)
    );
    emit RewardsMultiplierParametersSet(
      max,
      underspendAdjustmentFactor,
      overspendAdjustmentFactor
    );
    return true;
  }

  /**
   * @notice Sets the target voting yield parameters.
   * @param max The max relative target block reward for voters.
   * @param adjustmentFactor The target block reward adjustment factor for voters.
   * @return True upon success.
   */
  function setTargetVotingYieldParameters(
    uint256 max,
    uint256 adjustmentFactor
  )
    public
    onlyOwner
    returns (bool)
  {
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

  /**
   * @notice Returns the target gold supply according to the epoch rewards target schedule.
   * @return The target gold supply according to the epoch rewards target schedule.
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
      return 0;
    }
  }

  /**
   * @notice Returns the rewards multiplier based on the current and target gold supplies.
   * @param targetGoldSupplyIncrease The target increase in current gold supply.
   * @return The rewards multiplier based on the current and target gold supplies.
   */
  function _getRewardsMultiplier(
    uint256 targetGoldSupplyIncrease
  )
    internal
    view
    returns (FixidityLib.Fraction memory)
  {
    uint256 targetSupply = getTargetGoldTotalSupply();
    uint256 totalSupply = getGoldToken().totalSupply();
    uint256 remainingSupply = GOLD_SUPPLY_CAP.sub(totalSupply.add(targetGoldSupplyIncrease));
    uint256 targetRemainingSupply = GOLD_SUPPLY_CAP.sub(targetSupply);
    FixidityLib.Fraction memory ratio = FixidityLib.newFixed(remainingSupply).divide(
      FixidityLib.newFixed(targetRemainingSupply)
    );
    if (ratio.gt(FixidityLib.fixed1())) {
      FixidityLib.Fraction memory delta = ratio.subtract(FixidityLib.fixed1()).multiply(
        rewardsMultiplierParams.adjustmentFactors.underspend
      );
      FixidityLib.Fraction memory r = FixidityLib.fixed1().add(delta);
      if (r.lt(rewardsMultiplierParams.max)) {
        return r;
      } else {
        return rewardsMultiplierParams.max;
      }
    } else if (ratio.lt(FixidityLib.fixed1())) {
      FixidityLib.Fraction memory delta = FixidityLib.fixed1().subtract(ratio).multiply(
        rewardsMultiplierParams.adjustmentFactors.overspend
      );
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
   * @notice Returns the rewards multiplier based on the current and target gold supplies.
   * @return The rewards multiplier based on the current and target gold supplies.
   */
  function getRewardsMultiplier() external view returns (uint256) {
    uint256 targetEpochRewards = getTargetEpochRewards();
    uint256 targetTotalEpochPaymentsInGold = getTargetTotalEpochPaymentsInGold();
    uint256 targetGoldSupplyIncrease = targetEpochRewards.add(targetTotalEpochPaymentsInGold);
    return _getRewardsMultiplier(targetGoldSupplyIncrease).unwrap();
  }

  /**
   * @notice Returns the total target epoch rewards for voters.
   * @return the total target epoch rewards for voters.
   */
  function getTargetEpochRewards() public view returns (uint256) {
    return FixidityLib.newFixed(getElection().getActiveVotes()).multiply(
      targetVotingYieldParams.target
    ).fromFixed();
  }

  /**
   * @notice Returns the total target epoch payments to validators, converted to gold.
   * @return The total target epoch payments to validators, converted to gold.
   */
  function getTargetTotalEpochPaymentsInGold() public view returns (uint256) {
    address stableTokenAddress = registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID);
    (uint256 numerator, uint256 denominator) = getSortedOracles().medianRate(stableTokenAddress);
    return numberValidatorsInCurrentSet().mul(targetValidatorEpochPayment).mul(denominator).div(
      numerator
    );
  }

  /**
   * @notice Returns the fraction of floating gold being used for voting in validator elections.
   * @return The fraction of floating gold being used for voting in validator elections.
   */
  function getVotingGoldFraction() public view returns (uint256) {
    // TODO(asa): Ignore custodial accounts.
    address reserveAddress = registry.getAddressForOrDie(RESERVE_REGISTRY_ID);
    uint256 liquidGold = getGoldToken().totalSupply().sub(reserveAddress.balance);
    // TODO(asa): Should this be active votes?
    uint256 votingGold = getElection().getTotalVotes();
    return FixidityLib.newFixed(votingGold).divide(FixidityLib.newFixed(liquidGold)).unwrap();
  }

  /**
   * @notice Updates the target voting yield based on the difference between the target and current
   *   voting gold fraction.
   */
  function _updateTargetVotingYield() internal {
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
  }

  /**
   * @notice Updates the target voting yield based on the difference between the target and current
   *   voting gold fraction.
   * @dev Only called directly by the protocol.
   */
  function updateTargetVotingYield() external {
    require(msg.sender == address(0));
    _updateTargetVotingYield();
  }

  /**
   * @notice Calculates the per validator epoch payment and the total rewards to voters.
   * @return The per validator epoch payment and the total rewards to voters.
   */
  function calculateTargetEpochPaymentAndRewards() external view returns (uint256, uint256) {
    uint256 targetEpochRewards = getTargetEpochRewards();
    uint256 targetTotalEpochPaymentsInGold = getTargetTotalEpochPaymentsInGold();
    uint256 targetGoldSupplyIncrease = targetEpochRewards.add(targetTotalEpochPaymentsInGold);
    FixidityLib.Fraction memory rewardsMultiplier = _getRewardsMultiplier(
      targetGoldSupplyIncrease
    );
    return (
      FixidityLib.newFixed(targetValidatorEpochPayment).multiply(rewardsMultiplier).fromFixed(),
      FixidityLib.newFixed(targetEpochRewards).multiply(rewardsMultiplier).fromFixed()
    );
  }
}

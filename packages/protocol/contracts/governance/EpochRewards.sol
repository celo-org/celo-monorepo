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

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000;
  uint256 constant GOLD_SUPPLY_CAP = 1000000000;
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;
  uint256 constant FIXIDITY_E = 2718281828459045235360287;
  uint256 constant FIXIDITY_LN2 = 693147180559945309417232;
  uint256 private startTime = 0;
  FixidityLib.Fraction private targetVotingGoldFraction;
  FixidityLib.Fraction private targetVotingYield;
  FixidityLib.Fraction private maxTargetVotingYield;
  FixidityLib.Fraction private targetVotingYieldAdjustmentFactor;
  uint256 public maxValidatorEpochPayment;

  event MaxValidatorEpochPaymentSet(uint256 payment);
  event MaxTargetVotingYieldSet(uint256 yield);

  /**
   * @param _maxValidatorEpochPayment The duration the above gold remains locked after deregistration.
   */
  function initialize(
    address registryAddress,
    uint256 _maxValidatorEpochPayment,
    uint256 _maxTargetVotingYield,
    uint256 _targetVotingYield
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setMaxTargetVotingYield(_maxTargetVotingYield);
    setMaxValidatorEpochPayment(_maxValidatorEpochPayment);
    targetVotingYield = FixidityLib.wrap(_targetVotingYield);
    startTime = now;
  }

  function getMaxTargetVotingYield() external view returns (uint256) {
    return maxTargetVotingYield.unwrap();
  }

  function getTargetVotingYield() external view returns (uint256) {
    return targetVotingYield.unwrap();
  }

  /**
   m* @notice Sets the max per-epoch payment in Celo Dollars for validators.
   * @param value The value in Celo Dollars.
   * @return True upon success.
   */
  function setMaxValidatorEpochPayment(uint256 value) public onlyOwner returns (bool) {
    require(value != maxValidatorEpochPayment);
    maxValidatorEpochPayment = value;
    emit MaxValidatorEpochPaymentSet(value);
    return true;
  }

  function setMaxTargetVotingYield(uint256 yield) public onlyOwner returns (bool) {
    require(yield != maxTargetVotingYield.unwrap());
    maxTargetVotingYield = FixidityLib.wrap(yield);
    require(
      maxTargetVotingYield.lt(FixidityLib.fixed1()),
      "Max voting yield must be lower than 100%"
    );
    emit MaxTargetVotingYieldSet(yield);
    return true;
  }

  function _getTargetGoldTotalSupply() internal view returns (uint256) {
    uint256 timeSinceInitialization = now.sub(startTime);
    uint256 targetGoldSupply = 0;
    if (timeSinceInitialization < SECONDS_LINEAR) {
      // Pay out half of all block rewards linearly.
      uint256 linearRewards = GOLD_SUPPLY_CAP.sub(GENESIS_GOLD_SUPPLY).div(2);
      uint256 targetRewards = linearRewards.mul(timeSinceInitialization).div(SECONDS_LINEAR);
      return targetRewards.add(GENESIS_GOLD_SUPPLY);
    } else {
      /*
      FixidityLib.Fraction memory exponentialDecaryHalfLife = FixidityLib.wrap(
        FIXIDITY_LN2.div(YEARS_LINEAR)
      );
      uint256 exponentialSeconds = timeSinceInitialization.sub(SECONDS_LINEAR);
      uint256 exponentialRewards = GOLD_SUPPLY_CAP.sub(GENESIS_GOLD_SUPPLY).div(2);
      // 1000 - 200 * e ^ ((- 1 / 15) * (x - 15))
      (uint256 numerator, uint256 denominator) = fractionMulExp(FixidityLib.fixed1(), FixidityLib.fixed1(), FIXIDITY_E, FixidityLib.fixed1(), ???, ???);
      */
      // TODO(asa): This isn't implemented.
      require(false);
      return 0;
    }
  }

  // TODO(asa): Finish this.
  function _getRewardsMultiplier(uint256 targetGoldSupplyIncrease) internal view returns (FixidityLib.Fraction memory) {
    uint256 targetSupply = _getTargetGoldTotalSupply();
    uint256 totalSupplyWithRewards = getGoldToken().totalSupply().add(targetGoldSupplyIncrease);
    if (totalSupplyWithRewards > targetSupply) {
      // uint256 delta = totalSupplyWithRewards.sub(targetSupply);
      return FixidityLib.fixed1();

      // FixidityLib.Fraction memory deviation = FixidityLib.newFixed(delta).
      /*
      B_actual_t = supply_cap - (totalSupplyWithRewards);
      B_target_t = supply_cap - (targetSupply);
      B_actual_t - Z_t = B_actual_t - targetRewards - 
      */
    } else if (totalSupplyWithRewards < targetSupply) {
      // uint256 delta = targetSupply.sub(totalSupplyWithRewards);
      return FixidityLib.fixed1();
    } else {
      return FixidityLib.fixed1();
    }
  }

  function _getTargetEpochRewards() internal view returns (uint256) {
    return FixidityLib.newFixed(getElection().getActiveVotes()).multiply(targetVotingYield).fromFixed();
  }

  function _getTargetTotalEpochPaymentsInGold() internal view returns (uint256) {
    address stableTokenAddress = registry.getAddressForOrDie(STABLE_TOKEN_REGISTRY_ID);
    (uint256 numerator, uint256 denominator) = getSortedOracles().medianRate(stableTokenAddress);
    uint256 targetEpochPayment = numberValidatorsInCurrentSet().mul(maxValidatorEpochPayment).mul(numerator).div(denominator);
    return targetEpochPayment;
  }

  function _updateTargetVotingYield() internal {
    IERC20Token goldToken = getGoldToken();
    // TODO(asa): Ignore custodial accounts.
    address reserveAddress = registry.getAddressForOrDie(RESERVE_REGISTRY_ID);
    uint256 liquidGold = goldToken.totalSupply().sub(goldToken.balanceOf(reserveAddress));
    // TODO(asa): Should this be active votes?
    uint256 votingGold = getElection().getTotalVotes();
    FixidityLib.Fraction memory votingGoldFraction = FixidityLib.newFixed(liquidGold).divide(FixidityLib.newFixed(votingGold));
    if (votingGoldFraction.gt(targetVotingGoldFraction)) {
      FixidityLib.Fraction memory votingGoldFractionDelta = votingGoldFraction.subtract(targetVotingGoldFraction);
      FixidityLib.Fraction memory targetVotingYieldDelta = votingGoldFractionDelta.multiply(targetVotingYieldAdjustmentFactor);
      if (targetVotingYieldDelta.gte(targetVotingYield)) {
        targetVotingYield = FixidityLib.newFixed(0);
      } else {
        targetVotingYield = targetVotingYield.subtract(targetVotingYieldDelta);
      }
    } else {
      FixidityLib.Fraction memory votingGoldFractionDelta = targetVotingGoldFraction.subtract(votingGoldFraction);
      FixidityLib.Fraction memory targetVotingYieldDelta = votingGoldFractionDelta.multiply(targetVotingYieldAdjustmentFactor);
      targetVotingYield = targetVotingYield.add(targetVotingYieldDelta);
      if (targetVotingYield.gt(maxTargetVotingYield)) {
        targetVotingYield = maxTargetVotingYield;
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
      FixidityLib.newFixed(maxValidatorEpochPayment).multiply(rewardsMultiplier).fromFixed(),
      FixidityLib.newFixed(targetEpochRewards).multiply(rewardsMultiplier).fromFixed()
    );
  }
}

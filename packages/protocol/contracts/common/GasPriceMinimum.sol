pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Initializable.sol";
import "./UsingRegistry.sol";
import "./FixidityLib.sol";
import "../stability/interfaces/ISortedOracles.sol";

/**
 * @title Stores and provides gas price minimum for various currencies.
 */
contract GasPriceMinimum is Ownable, Initializable, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  event TargetDensitySet(
    uint256 targetDensity
  );

  event AdjustmentSpeedSet(
    uint256 adjustmentSpeed
  );

  event ProposerFractionSet(
    uint256 proposerFraction
  );

  uint256 public gasPriceMinimum;

  // Block congestion level targeted by the gas price minimum calculation.
  FixidityLib.Fraction public targetDensity;

  // Speed of gas price minimum adjustment due to congestion.
  FixidityLib.Fraction public adjustmentSpeed;

  // FixidityLib.Fraction of the gas price minimum allocated to the infrastructure fund.
  FixidityLib.Fraction public proposerFraction;

  function proposerFraction_() external view returns (uint256, uint256) {
    return (proposerFraction.unwrap(), FixidityLib.fixed1().unwrap());
  }

  modifier onlyVm() {
    assert(msg.sender == address(0x0));
    _;
  }

  function initialize(
    address _registryAddress,
    uint256 initialGas,
    uint256 _targetDensity,
    uint256 _adjustmentSpeed,
    uint256 _proposerFraction
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    gasPriceMinimum = initialGas;
    setTargetDensity(_targetDensity);
    setAdjustmentSpeed(_adjustmentSpeed);
    setProposerFraction(_proposerFraction);
  }

  /**
   * @notice Set a multiplier that impacts how quickly gas price minimum is adjusted.
   * @dev Value is expected to be < 1.
   */
  function setAdjustmentSpeed(uint256 _adjustmentSpeed) public onlyOwner {
    adjustmentSpeed = FixidityLib.wrap(_adjustmentSpeed);
    require(adjustmentSpeed.lt(FixidityLib.fixed1()));
    emit AdjustmentSpeedSet(_adjustmentSpeed);
  }

  /**
   * @notice Set the block density targeted by the gas price minimum algorithm.
   * @dev Value is expected to be < 1.
   */
  function setTargetDensity(uint256 _targetDensity) public onlyOwner {
    targetDensity = FixidityLib.wrap(_targetDensity);
    require(targetDensity.lt(FixidityLib.fixed1()));
    emit TargetDensitySet(_targetDensity);
  }

  /**
   * @notice Set the fraction of the gas price minimum which is sent to
   * the infrastructure fund.
   * @dev Value is expected to be < 1.
   */
  function setProposerFraction(uint256 _proposerFraction) public onlyOwner {
    proposerFraction = FixidityLib.wrap(_proposerFraction);
    require(proposerFraction.lt(FixidityLib.fixed1()));
    emit ProposerFractionSet(_proposerFraction);
  }

  /**
   * @notice Retrieve the current gas price minimum for a currency.
   * @param tokenAddress The currency the gas price should be in (defaults to gold).
   * @return current gas price minimum in the requested currency
   */
  function getGasPriceMinimum(address tokenAddress) external view returns (uint256) {
    if (
      tokenAddress == address(0) ||
      tokenAddress == registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID)
    ) {
      return gasPriceMinimum;
    } else {

      ISortedOracles sortedOracles = ISortedOracles(
        registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
      );
      uint256 rateNumerator;
      uint256 rateDenominator;
      (rateNumerator, rateDenominator) = sortedOracles.medianRate(tokenAddress);
      return (gasPriceMinimum.mul(rateNumerator).div(rateDenominator));
    }
  }

  /**
   * @notice Adjust the gas price minimum based on governable parameters
   * and block congestion.
   * @param blockGasTotal The amount of gas in the most recent block.
   * @param blockGasLimit The maxBlockGasLimit of the past block.
   * @return result of the calculation (new gas price minimum)
   */
  function updateGasPriceMinimum(
    uint256 blockGasTotal,
    uint256 blockGasLimit
  )
    external
    onlyVm
    returns (uint256)
  {
    gasPriceMinimum = getUpdatedGasPriceMinimum(blockGasTotal, blockGasLimit);
    return gasPriceMinimum;
  }

  /**
   * @notice Calculates the gas price minimum based on governable parameters
   * and block congestion.
   * @param blockGasTotal The amount of gas in the most recent block.
   * @param blockGasLimit The maxBlockGasLimit of the past block.
   * @return result of the calculation (new gas price minimum)
   * @dev Calculate using the following formula:
   * oldGasPriceMinimum * (1 + (adjustmentSpeed * (blockDensity - targetDensity))) + 1.
   */
  function getUpdatedGasPriceMinimum(
    uint256 blockGasTotal,
    uint256 blockGasLimit
  )
    public
    view
    returns (uint256)
  {
    FixidityLib.Fraction memory blockDensity = FixidityLib.newFixedFraction(
      blockGasTotal, blockGasLimit
    );
    bool densityGreaterThanTarget = blockDensity.gt(targetDensity);
    FixidityLib.Fraction memory densityDelta = densityGreaterThanTarget ?
      blockDensity.subtract(targetDensity) :
      targetDensity.subtract(blockDensity);
    FixidityLib.Fraction memory adjustment = densityGreaterThanTarget ?
      FixidityLib.fixed1().add(adjustmentSpeed.multiply(densityDelta)) :
      FixidityLib.fixed1().subtract(adjustmentSpeed.multiply(densityDelta));

    return adjustment
      .multiply(FixidityLib.newFixed(gasPriceMinimum))
      .add(FixidityLib.fixed1())
      .fromFixed();
  }
}

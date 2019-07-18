pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Initializable.sol";
import "./UsingRegistry.sol";
import "../stability/interfaces/ISortedOracles.sol";
import "../stability/FractionUtil.sol";

/**
 * @title Stores and provides gas price minimum for various currencies.
 */
contract GasPriceMinimum is Ownable, Initializable, UsingRegistry {
  using SafeMath for uint256;
  using FractionUtil for FractionUtil.Fraction;

  event TargetDensitySet(
    uint256 numerator,
    uint256 denominator
  );

  event AdjustmentSpeedSet(
    uint256 numerator,
    uint256 denominator
  );

  event InfrastructureFractionSet(
    uint256 numerator,
    uint256 denominator
  );

  uint256 public gasPriceMinimum;

  // Block congestion level targeted by the gas price minimum calculation.
  FractionUtil.Fraction public targetDensity;

  // Speed of gas price minimum adjustment due to congestion.
  FractionUtil.Fraction public adjustmentSpeed;

  // Fraction of the gas price minimum allocated to the infrastructure fund.
  FractionUtil.Fraction public infrastructureFraction;

  modifier onlyVm() {
    assert(msg.sender == address(0x0));
    _;
  }

  function initialize(
    address _registryAddress,
    uint256 initialGas,
    uint256 targetDensityNumerator,
    uint256 targetDensityDenominator,
    uint256 adjustmentSpeedNumerator,
    uint256 adjustmentSpeedDenominator,
    uint256 infrastructureFractionNumerator,
    uint256 infrastructureFractionDenominator
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    gasPriceMinimum = initialGas;
    setTargetDensity(targetDensityNumerator, targetDensityDenominator);
    setAdjustmentSpeed(adjustmentSpeedNumerator, adjustmentSpeedDenominator);
    setInfrastructureFraction(infrastructureFractionNumerator, infrastructureFractionDenominator);
  }

  /**
   * @notice Set a multiplier that impacts how quickly gas price minimum is adjusted.
   * @dev Value is expected to be < 1.
   */
  function setAdjustmentSpeed(uint256 numerator, uint256 denominator) public onlyOwner {
    require(denominator > 0 && numerator < denominator);
    adjustmentSpeed = FractionUtil.Fraction(numerator, denominator);
    emit AdjustmentSpeedSet(numerator, denominator);
  }

  /**
   * @notice Set the block density targeted by the gas price minimum algorithm.
   */
  function setTargetDensity(uint256 numerator, uint256 denominator) public onlyOwner {
    require(denominator > 0 && numerator < denominator);
    targetDensity = FractionUtil.Fraction(numerator, denominator);
    emit TargetDensitySet(numerator, denominator);
  }

  /**
   * @notice Set the fraction of the gas price minimum which is sent to
   * the infrastructure fund.
   */
  function setInfrastructureFraction(uint256 numerator, uint256 denominator) public onlyOwner {
    require(denominator > 0 && numerator < denominator);
    infrastructureFraction = FractionUtil.Fraction(numerator, denominator);
    emit InfrastructureFractionSet(numerator, denominator);
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
      uint128 rateNumerator;
      uint128 rateDenominator;
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
    FractionUtil.Fraction memory one = FractionUtil.Fraction(1, 1);
    FractionUtil.Fraction memory blockDensity = FractionUtil.Fraction(
      blockGasTotal,
      blockGasLimit
    );
    FractionUtil.Fraction memory adjustment = one.add(adjustmentSpeed.mul(blockDensity)).sub(
      adjustmentSpeed.mul(targetDensity)
    );
    return adjustment.mul(gasPriceMinimum).add(1);
  }
}

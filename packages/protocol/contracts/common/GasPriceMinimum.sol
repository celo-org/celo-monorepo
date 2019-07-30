pragma solidity ^0.5.8;

import "fixidity/contracts/FixidityLib.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Initializable.sol";
import "./UsingRegistry.sol";
import "../stability/interfaces/ISortedOracles.sol";

/**
 * @title Stores and provides gas price minimum for various currencies.
 */
contract GasPriceMinimum is Ownable, Initializable, UsingRegistry {
  using FixidityLib for int256;
  using SafeMath for uint256;

  event TargetDensitySet(
    int256 targetDensity
  );

  event AdjustmentSpeedSet(
    int256 adjustmentSpeed
  );

  event InfrastructureFractionSet(
    int256 infrastructureFraction
  );

  uint256 public gasPriceMinimum;

  // Block congestion level targeted by the gas price minimum calculation.
  int256 public targetDensity;

  // Speed of gas price minimum adjustment due to congestion.
  int256 public adjustmentSpeed;

  // Fraction of the gas price minimum allocated to the infrastructure fund.
  int256 public infrastructureFraction;

  modifier onlyVm() {
    assert(msg.sender == address(0x0));
    _;
  }

  function initialize(
    address _registryAddress,
    uint256 initialGas,
    int256 _targetDensity,
    int256 _adjustmentSpeed,
    int256 _infrastructureFraction
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    gasPriceMinimum = initialGas;
    setTargetDensity(_targetDensity);
    setAdjustmentSpeed(_adjustmentSpeed);
    setInfrastructureFraction(_infrastructureFraction);
  }

  /**
   * @notice Set a multiplier that impacts how quickly gas price minimum is adjusted.
   * @dev Value is expected to be < 1.
   */
  function setAdjustmentSpeed(int256 _adjustmentSpeed) public onlyOwner {
    require(_adjustmentSpeed < FixidityLib.fixed1());
    adjustmentSpeed = _adjustmentSpeed;
    emit AdjustmentSpeedSet(_adjustmentSpeed);
  }

  /**
   * @notice Set the block density targeted by the gas price minimum algorithm.
   */
  function setTargetDensity(int256 _targetDensity) public onlyOwner {
    require(_targetDensity < FixidityLib.fixed1());
    targetDensity = _targetDensity;
    emit TargetDensitySet(_targetDensity);
  }

  /**
   * @notice Set the fraction of the gas price minimum which is sent to
   * the infrastructure fund.
   */
  function setInfrastructureFraction(int256 _infrastructureFraction) public onlyOwner {
    require(_infrastructureFraction < FixidityLib.fixed1());
    infrastructureFraction = _infrastructureFraction;
    emit InfrastructureFractionSet(_infrastructureFraction);
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
    int256 blockDensity = FixidityLib.newFixed(int256(blockGasTotal)).divide(
      FixidityLib.newFixed(int256(blockGasLimit))
    );
    int256 adjustment = FixidityLib.fixed1().add(
      adjustmentSpeed.multiply(blockDensity.subtract(targetDensity))
    );

    return uint256(
      adjustment
        .multiply(FixidityLib.newFixed(int256(gasPriceMinimum)))
        .add(FixidityLib.fixed1())
        .fromFixed()
    );
  }
}

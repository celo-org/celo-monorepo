pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./CalledByVm.sol";
import "./Initializable.sol";
import "./FixidityLib.sol";
import "./UsingRegistry.sol";
import "../stability/interfaces/ISortedOracles.sol";

/**
 * @title Stores and provides gas price minimum for various currencies.
 */
contract GasPriceMinimum is Ownable, Initializable, UsingRegistry, CalledByVm {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  event TargetDensitySet(uint256 targetDensity);
  event GasPriceMinimumFloorSet(uint256 gasPriceMinimumFloor);
  event AdjustmentSpeedSet(uint256 adjustmentSpeed);
  event GasPriceMinimumUpdated(uint256 gasPriceMinimum);

  uint256 public gasPriceMinimum;
  uint256 public gasPriceMinimumFloor;

  // Block congestion level targeted by the gas price minimum calculation.
  FixidityLib.Fraction public targetDensity;

  // Speed of gas price minimum adjustment due to congestion.
  FixidityLib.Fraction public adjustmentSpeed;

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _registryAddress The address of the registry core smart contract.
   * @param _gasPriceMinimumFloor The lowest value the gas price minimum can be.
   * @param _targetDensity The target gas fullness of blocks, expressed as a fixidity fraction.
   * @param _adjustmentSpeed How quickly the minimum changes, expressed as a fixidity fraction.
   */
  function initialize(
    address _registryAddress,
    uint256 _gasPriceMinimumFloor,
    uint256 _targetDensity,
    uint256 _adjustmentSpeed
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    gasPriceMinimum = _gasPriceMinimumFloor;
    setGasPriceMinimumFloor(_gasPriceMinimumFloor);
    setTargetDensity(_targetDensity);
    setAdjustmentSpeed(_adjustmentSpeed);
  }

  /**
   * @notice Set a multiplier that impacts how quickly gas price minimum is adjusted.
   * @param _adjustmentSpeed How quickly the minimum changes, expressed as a fixidity fraction.
   * @dev Value is expected to be < 1.
   */
  function setAdjustmentSpeed(uint256 _adjustmentSpeed) public onlyOwner {
    adjustmentSpeed = FixidityLib.wrap(_adjustmentSpeed);
    require(adjustmentSpeed.lt(FixidityLib.fixed1()), "adjustment speed must be smaller than 1");
    emit AdjustmentSpeedSet(_adjustmentSpeed);
  }

  /**
   * @notice Set the block density targeted by the gas price minimum algorithm.
   * @param _targetDensity The target gas fullness of blocks, expressed as a fixidity fraction.
   * @dev Value is expected to be < 1.
   */
  function setTargetDensity(uint256 _targetDensity) public onlyOwner {
    targetDensity = FixidityLib.wrap(_targetDensity);
    require(targetDensity.lt(FixidityLib.fixed1()), "target density must be smaller than 1");
    emit TargetDensitySet(_targetDensity);
  }

  /**
   * @notice Set the minimum gas price treshold.
   * @param _gasPriceMinimumFloor The lowest value the gas price minimum can be.
   * @dev Value is expected to be > 0.
   */
  function setGasPriceMinimumFloor(uint256 _gasPriceMinimumFloor) public onlyOwner {
    require(_gasPriceMinimumFloor > 0, "gas price minimum floor must be greater than zero");
    gasPriceMinimumFloor = _gasPriceMinimumFloor;
    emit GasPriceMinimumFloorSet(_gasPriceMinimumFloor);
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
  function updateGasPriceMinimum(uint256 blockGasTotal, uint256 blockGasLimit)
    external
    onlyVm
    returns (uint256)
  {
    gasPriceMinimum = getUpdatedGasPriceMinimum(blockGasTotal, blockGasLimit);
    emit GasPriceMinimumUpdated(gasPriceMinimum);
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
  function getUpdatedGasPriceMinimum(uint256 blockGasTotal, uint256 blockGasLimit)
    public
    view
    returns (uint256)
  {
    FixidityLib.Fraction memory blockDensity = FixidityLib.newFixedFraction(
      blockGasTotal,
      blockGasLimit
    );
    bool densityGreaterThanTarget = blockDensity.gt(targetDensity);
    FixidityLib.Fraction memory densityDelta = densityGreaterThanTarget
      ? blockDensity.subtract(targetDensity)
      : targetDensity.subtract(blockDensity);
    FixidityLib.Fraction memory adjustment = densityGreaterThanTarget
      ? FixidityLib.fixed1().add(adjustmentSpeed.multiply(densityDelta))
      : FixidityLib.fixed1().subtract(adjustmentSpeed.multiply(densityDelta));

    uint256 newGasPriceMinimum = adjustment
      .multiply(FixidityLib.newFixed(gasPriceMinimum))
      .add(FixidityLib.fixed1())
      .fromFixed();

    return newGasPriceMinimum >= gasPriceMinimumFloor ? newGasPriceMinimum : gasPriceMinimumFloor;
  }
}

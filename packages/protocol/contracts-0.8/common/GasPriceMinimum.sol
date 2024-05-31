// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";

import "../../contracts/common/CalledByVm.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/common/FixidityLib.sol";
import "./UsingRegistry.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";
import "./IsL2Check.sol";

/**
 * @title Stores and provides gas price minimum for various currencies.
 */
contract GasPriceMinimum is
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  IsL2Check,
  CalledByVm
{
  // TODO add IGasPriceMinimum
  using FixidityLib for FixidityLib.Fraction;

  uint256 public deprecated_gasPriceMinimum;
  uint256 public gasPriceMinimumFloor;

  // Block congestion level targeted by the gas price minimum calculation.
  FixidityLib.Fraction public targetDensity;

  // Speed of gas price minimum adjustment due to congestion.
  FixidityLib.Fraction public adjustmentSpeed;

  uint256 public baseFeeOpCodeActivationBlock;
  uint256 public constant ABSOLUTE_MINIMAL_GAS_PRICE = 1;

  event TargetDensitySet(uint256 targetDensity);
  event GasPriceMinimumFloorSet(uint256 gasPriceMinimumFloor);
  event AdjustmentSpeedSet(uint256 adjustmentSpeed);
  event GasPriceMinimumUpdated(uint256 gasPriceMinimum);
  event BaseFeeOpCodeActivationBlockSet(uint256 baseFeeOpCodeActivationBlock);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _registryAddress The address of the registry core smart contract.
   * @param _gasPriceMinimumFloor The lowest value the gas price minimum can be.
   * @param _targetDensity The target gas fullness of blocks, expressed as a fixidity fraction.
   * @param _adjustmentSpeed How quickly the minimum changes, expressed as a fixidity fraction.
   * @param _baseFeeOpCodeActivationBlock Block number where the baseFee opCode is activated
   */
  function initialize(
    address _registryAddress,
    uint256 _gasPriceMinimumFloor,
    uint256 _targetDensity,
    uint256 _adjustmentSpeed,
    uint256 _baseFeeOpCodeActivationBlock
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
    deprecated_gasPriceMinimum = _gasPriceMinimumFloor;
    setGasPriceMinimumFloor(_gasPriceMinimumFloor);
    setTargetDensity(_targetDensity);
    setAdjustmentSpeed(_adjustmentSpeed);
    _setBaseFeeOpCodeActivationBlock(_baseFeeOpCodeActivationBlock, true);
  }

  /**
   * @notice Set the activation block of the baseFee opCode.
   * @param _baseFeeOpCodeActivationBlock Block number where the baseFee opCode is activated
   * @dev Value is expected to be > 0.
   */
  function setBaseFeeOpCodeActivationBlock(
    uint256 _baseFeeOpCodeActivationBlock
  ) external onlyOwner onlyL1 {
    _setBaseFeeOpCodeActivationBlock(_baseFeeOpCodeActivationBlock, false);
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
  ) external onlyVm onlyL1 returns (uint256) {
    deprecated_gasPriceMinimum = getUpdatedGasPriceMinimum(blockGasTotal, blockGasLimit);
    emit GasPriceMinimumUpdated(deprecated_gasPriceMinimum);
    return deprecated_gasPriceMinimum;
  }

  /**
   * @notice Retrieve the current gas price minimum for a currency.
   * When caled for 0x0 or Celo address, it returns gasPriceMinimum().
   * For other addresses it returns gasPriceMinimum() mutiplied by
   * the SortedOracles median of the token. It does not check tokenAddress is a valid fee currency.
   * this function will never returns values less than ABSOLUTE_MINIMAL_GAS_PRICE.
   * If Oracle rate doesn't exist, it returns ABSOLUTE_MINIMAL_GAS_PRICE.
   * @dev This functions assumes one unit of token has 18 digits.
   * @param tokenAddress The currency the gas price should be in (defaults to Celo).
   * @return current gas price minimum in the requested currency
   */
  function getGasPriceMinimum(address tokenAddress) external view returns (uint256) {
    return Math.max(_getGasPriceMinimum(tokenAddress), ABSOLUTE_MINIMAL_GAS_PRICE);
  }
  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 2, 1, 0);
  }

  /**
   * @notice Set a multiplier that impacts how quickly gas price minimum is adjusted.
   * @param _adjustmentSpeed How quickly the minimum changes, expressed as a fixidity fraction.
   * @dev Value is expected to be < 1.
   */
  function setAdjustmentSpeed(uint256 _adjustmentSpeed) public onlyOwner onlyL1 {
    adjustmentSpeed = FixidityLib.wrap(_adjustmentSpeed);
    require(adjustmentSpeed.lt(FixidityLib.fixed1()), "adjustment speed must be smaller than 1");
    emit AdjustmentSpeedSet(_adjustmentSpeed);
  }

  /**
   * @notice Set the block density targeted by the gas price minimum algorithm.
   * @param _targetDensity The target gas fullness of blocks, expressed as a fixidity fraction.
   * @dev Value is expected to be < 1.
   */
  function setTargetDensity(uint256 _targetDensity) public onlyOwner onlyL1 {
    targetDensity = FixidityLib.wrap(_targetDensity);
    require(targetDensity.lt(FixidityLib.fixed1()), "target density must be smaller than 1");
    emit TargetDensitySet(_targetDensity);
  }

  /**
   * @notice Set the minimum gas price treshold.
   * @param _gasPriceMinimumFloor The lowest value the gas price minimum can be.
   * @dev Value is expected to be > 0.
   */
  function setGasPriceMinimumFloor(uint256 _gasPriceMinimumFloor) public onlyOwner onlyL1 {
    require(_gasPriceMinimumFloor > 0, "gas price minimum floor must be greater than zero");
    gasPriceMinimumFloor = _gasPriceMinimumFloor;
    emit GasPriceMinimumFloorSet(_gasPriceMinimumFloor);
  }

  function gasPriceMinimum() public view returns (uint256) {
    if (baseFeeOpCodeActivationBlock > 0 && block.number >= baseFeeOpCodeActivationBlock) {
      return block.basefee;
    } else {
      return deprecated_gasPriceMinimum;
    }
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
  ) public view returns (uint256) {
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
      .multiply(FixidityLib.newFixed(gasPriceMinimum()))
      .add(FixidityLib.fixed1())
      .fromFixed();

    return newGasPriceMinimum >= gasPriceMinimumFloor ? newGasPriceMinimum : gasPriceMinimumFloor;
  }

  /**
   * @notice Set the activation block of the baseFee opCode.
   * @param _baseFeeOpCodeActivationBlock Block number where the baseFee opCode is activated
   * @dev Value is expected to be > 0.
   */
  function _setBaseFeeOpCodeActivationBlock(
    uint256 _baseFeeOpCodeActivationBlock,
    bool allowZero
  ) private onlyOwner {
    require(
      allowZero || _baseFeeOpCodeActivationBlock > 0,
      "baseFee opCode activation block must be greater than zero"
    );
    baseFeeOpCodeActivationBlock = _baseFeeOpCodeActivationBlock;
    emit BaseFeeOpCodeActivationBlockSet(_baseFeeOpCodeActivationBlock);
  }

  function _getGasPriceMinimum(address tokenAddress) private view returns (uint256) {
    if (
      tokenAddress == address(0) ||
      tokenAddress == registry.getAddressForOrDie(GOLD_TOKEN_REGISTRY_ID)
    ) {
      return gasPriceMinimum();
    } else {
      ISortedOracles sortedOracles = ISortedOracles(
        registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
      );
      uint256 rateNumerator;
      uint256 rateDenominator;
      (rateNumerator, rateDenominator) = sortedOracles.medianRate(tokenAddress);
      return ((gasPriceMinimum() * rateNumerator) / rateDenominator);
    }
  }
}

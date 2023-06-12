// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7;

import "@openzeppelin/contracts8/access/Ownable.sol";

import "./CalledByVm.sol";
import "./Initializable.sol";
import "./interfaces/ICeloVersionedContract.sol";
import "./FixidityLib.sol";
import "./UsingRegistry8.sol";
import "../stability/interfaces/ISortedOracles.sol";

/**
 * @title Stores and provides gas price minimum for various currencies.
 */
contract GasPriceMinimum is
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  CalledByVm
{
  using FixidityLib for FixidityLib.Fraction;

  event TargetDensitySet(uint256 targetDensity);
  event GasPriceMinimumFloorSet(uint256 gasPriceMinimumFloor);
  event AdjustmentSpeedSet(uint256 adjustmentSpeed);
  event GasPriceMinimumUpdated(uint256 gasPriceMinimum);
  event BaseFeeOpCodeActivationBlockSet(uint256 baseFeeOpCodeActivationBlock);

  uint256 public gasPriceMinimum;
  uint256 public gasPriceMinimumFloor;

  // Block congestion level targeted by the gas price minimum calculation.
  FixidityLib.Fraction public targetDensity;

  // Speed of gas price minimum adjustment due to congestion.
  FixidityLib.Fraction public adjustmentSpeed;

  uint256 public baseFeeOpCodeActivationBlock;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

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
    gasPriceMinimum = _gasPriceMinimumFloor;
    setGasPriceMinimumFloor(_gasPriceMinimumFloor);
    setTargetDensity(_targetDensity);
    setAdjustmentSpeed(_adjustmentSpeed);
    setBaseFeeOpCodeActivationBlock(_baseFeeOpCodeActivationBlock);
  }

  /**
   * @notice Set a multiplier that impacts how quickly gas price minimum is adjusted.
   * @param _adjustmentSpeed How quickly the minimum changes, expressed as a fixidity fraction.
   * @dev Value is expected to be < 1.
   */
  function setAdjustmentSpeed(uint256 _adjustmentSpeed) public onlyOwner {}

  /**
   * @notice Set the block density targeted by the gas price minimum algorithm.
   * @param _targetDensity The target gas fullness of blocks, expressed as a fixidity fraction.
   * @dev Value is expected to be < 1.
   */
  function setTargetDensity(uint256 _targetDensity) public onlyOwner {}

  /**
   * @notice Set the minimum gas price treshold.
   * @param _gasPriceMinimumFloor The lowest value the gas price minimum can be.
   * @dev Value is expected to be > 0.
   */
  function setGasPriceMinimumFloor(uint256 _gasPriceMinimumFloor) public onlyOwner {}

  /**
   * @notice Set the activation block of the baseFee opCode.
   * @param _baseFeeOpCodeActivationBlock Block number where the baseFee opCode is activated
   * @dev Value is expected to be > 0.
   */
  function setBaseFeeOpCodeActivationBlock(uint256 _baseFeeOpCodeActivationBlock)
    public
    onlyOwner
  {}

  /**
   * @notice Retrieve the current gas price minimum for a currency.
   * @param tokenAddress The currency the gas price should be in (defaults to gold).
   * @return current gas price minimum in the requested currency
   */
  function getGasPriceMinimum(address tokenAddress) external view returns (uint256) {
    return 10;
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
    return 10;
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
    return 10;
  }
}

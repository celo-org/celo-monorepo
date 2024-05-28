pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/Initializable.sol";
import "../common/UsingPrecompiles.sol";

import "../../contracts-0.8/common/IsL2Check.sol";

/**
 * @title Contract for storing blockchain parameters that can be set by governance.
 */
contract BlockchainParameters is Ownable, Initializable, UsingPrecompiles, IsL2Check {
  using SafeMath for uint256;

  // obsolete
  struct ClientVersion {
    uint256 major;
    uint256 minor;
    uint256 patch;
  }

  struct LookbackWindow {
    // Value for lookbackWindow before `nextValueActivationBlock`
    uint256 oldValue;
    // Value for lookbackWindow after `nextValueActivationBlock`
    uint256 nextValue;
    // Epoch where next value is activated
    uint256 nextValueActivationEpoch;
  }

  ClientVersion private minimumClientVersion; // obsolete
  uint256 public blockGasLimit;
  uint256 public intrinsicGasForAlternativeFeeCurrency;
  LookbackWindow public uptimeLookbackWindow;

  event IntrinsicGasForAlternativeFeeCurrencySet(uint256 gas);
  event BlockGasLimitSet(uint256 limit);
  event UptimeLookbackWindowSet(uint256 window, uint256 activationEpoch);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _gasForNonGoldCurrencies Intrinsic gas for non-gold gas currencies.
   * @param gasLimit Block gas limit.
   * @param lookbackWindow Lookback window for measuring validator uptime.
   */
  function initialize(
    uint256 _gasForNonGoldCurrencies,
    uint256 gasLimit,
    uint256 lookbackWindow
  ) external initializer {
    _transferOwnership(msg.sender);
    setBlockGasLimit(gasLimit);
    setIntrinsicGasForAlternativeFeeCurrency(_gasForNonGoldCurrencies);
    setUptimeLookbackWindow(lookbackWindow);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 3, 1, 0);
  }

  /**
   * @notice Sets the block gas limit.
   * @param gasLimit New block gas limit.
   */
  function setBlockGasLimit(uint256 gasLimit) public onlyOwner onlyL1 {
    blockGasLimit = gasLimit;
    emit BlockGasLimitSet(gasLimit);
  }

  /**
   * @notice Sets the intrinsic gas for non-gold gas currencies.
   * @param gas Intrinsic gas for non-gold gas currencies.
   */
  function setIntrinsicGasForAlternativeFeeCurrency(uint256 gas) public onlyOwner onlyL1 {
    intrinsicGasForAlternativeFeeCurrency = gas;
    emit IntrinsicGasForAlternativeFeeCurrencySet(gas);
  }

  /**
   * @notice Sets the uptime lookback window.
   * @param window New window.
   */
  function setUptimeLookbackWindow(uint256 window) public onlyL1 onlyOwner {
    require(window >= 3 && window <= 720, "UptimeLookbackWindow must be within safe range");
    require(
      window <= getEpochSize().sub(2),
      "UptimeLookbackWindow must be smaller or equal to epochSize - 2"
    );

    uptimeLookbackWindow.oldValue = _getUptimeLookbackWindow();

    // changes only take place on the next epoch
    uptimeLookbackWindow.nextValueActivationEpoch = getEpochNumber().add(1);
    uptimeLookbackWindow.nextValue = window;

    emit UptimeLookbackWindowSet(window, uptimeLookbackWindow.nextValueActivationEpoch);
  }

  /**
   * @notice Gets the uptime lookback window.
   */
  function getUptimeLookbackWindow() public view returns (uint256 lookbackWindow) {
    lookbackWindow = _getUptimeLookbackWindow();
    require(lookbackWindow != 0, "UptimeLookbackWindow is not initialized");
  }

  /**
   * @notice Gets the uptime lookback window.
   */
  function _getUptimeLookbackWindow() internal view onlyL1 returns (uint256 lookbackWindow) {
    if (getEpochNumber() >= uptimeLookbackWindow.nextValueActivationEpoch) {
      return uptimeLookbackWindow.nextValue;
    } else {
      return uptimeLookbackWindow.oldValue;
    }
  }
}

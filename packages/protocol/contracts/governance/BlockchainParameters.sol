pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/Initializable.sol";
import "../common/UsingPrecompiles.sol";

/**
 * @title Contract for storing blockchain parameters that can be set by governance.
 */
contract BlockchainParameters is Ownable, Initializable, UsingPrecompiles {
  using SafeMath for uint256;

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

  ClientVersion private minimumClientVersion;
  uint256 public blockGasLimit;
  uint256 public intrinsicGasForAlternativeFeeCurrency;
  LookbackWindow public uptimeLookbackWindow;

  event MinimumClientVersionSet(uint256 major, uint256 minor, uint256 patch);
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
   * @param major Minimum client version that can be used in the chain, major version.
   * @param minor Minimum client version that can be used in the chain, minor version.
   * @param patch Minimum client version that can be used in the chain, patch level.
   * @param _gasForNonGoldCurrencies Intrinsic gas for non-gold gas currencies.
   * @param gasLimit Block gas limit.
   * @param lookbackWindow Lookback window for measuring validator uptime.
   */
  function initialize(
    uint256 major,
    uint256 minor,
    uint256 patch,
    uint256 _gasForNonGoldCurrencies,
    uint256 gasLimit,
    uint256 lookbackWindow
  ) external initializer {
    _transferOwnership(msg.sender);
    setMinimumClientVersion(major, minor, patch);
    setBlockGasLimit(gasLimit);
    setIntrinsicGasForAlternativeFeeCurrency(_gasForNonGoldCurrencies);
    setUptimeLookbackWindow(lookbackWindow);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 2, 0, 0);
  }

  /**
   * @notice Sets the minimum client version.
   * @param major Major version.
   * @param minor Minor version.
   * @param patch Patch version.
   * @dev For example if the version is 1.9.2, 1 is the major version, 9 is minor,
   * and 2 is the patch level.
   */
  function setMinimumClientVersion(uint256 major, uint256 minor, uint256 patch) public onlyOwner {
    minimumClientVersion.major = major;
    minimumClientVersion.minor = minor;
    minimumClientVersion.patch = patch;
    emit MinimumClientVersionSet(major, minor, patch);
  }

  /**
   * @notice Sets the block gas limit.
   * @param gasLimit New block gas limit.
   */
  function setBlockGasLimit(uint256 gasLimit) public onlyOwner {
    blockGasLimit = gasLimit;
    emit BlockGasLimitSet(gasLimit);
  }

  /**
   * @notice Sets the intrinsic gas for non-gold gas currencies.
   * @param gas Intrinsic gas for non-gold gas currencies.
   */
  function setIntrinsicGasForAlternativeFeeCurrency(uint256 gas) public onlyOwner {
    intrinsicGasForAlternativeFeeCurrency = gas;
    emit IntrinsicGasForAlternativeFeeCurrencySet(gas);
  }

  /**
   * @notice Sets the uptime lookback window.
   * @param window New window.
   */
  function setUptimeLookbackWindow(uint256 window) public onlyOwner {
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
  function _getUptimeLookbackWindow() internal view returns (uint256 lookbackWindow) {
    if (getEpochNumber() >= uptimeLookbackWindow.nextValueActivationEpoch) {
      return uptimeLookbackWindow.nextValue;
    } else {
      return uptimeLookbackWindow.oldValue;
    }
  }

  /**
   * @notice Query minimum client version.
   * @return Returns major, minor, and patch version numbers.
   */
  function getMinimumClientVersion()
    external
    view
    returns (uint256 major, uint256 minor, uint256 patch)
  {
    return (minimumClientVersion.major, minimumClientVersion.minor, minimumClientVersion.patch);
  }

}

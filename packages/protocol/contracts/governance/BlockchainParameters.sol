pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/Initializable.sol";

/**
 * @title Contract for storing blockchain parameters that can be set by governance.
 */
contract BlockchainParameters is Ownable, Initializable {
  struct ClientVersion {
    uint256 major;
    uint256 minor;
    uint256 patch;
  }

  ClientVersion private minimumClientVersion;
  uint256 public blockGasLimit;
  uint256 public intrinsicGasForAlternativeFeeCurrency;
  uint256 public uptimeLookbackWindow;

  event MinimumClientVersionSet(uint256 major, uint256 minor, uint256 patch);
  event IntrinsicGasForAlternativeFeeCurrencySet(uint256 gas);
  event BlockGasLimitSet(uint256 limit);
  event UptimeLookbackWindowSet(uint256 window);

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
    uptimeLookbackWindow = window;
    emit UptimeLookbackWindowSet(window);
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

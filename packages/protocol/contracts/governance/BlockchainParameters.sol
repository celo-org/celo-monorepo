pragma solidity ^0.5.3;

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

  uint256 public intrinsicGasForAlternativeGasCurrency;

  event MinimumClientVersionSet(uint256 major, uint256 minor, uint256 patch);
  event IntrinsicGasForAlternativeGasCurrencySet(uint256 gas);

  /**
   * @notice Initializes critical variables.
   * @param major Minimum client version that can be used in the chain,
   * major version.
   * @param minor Minimum client version that can be used in the chain,
   * minor version.
   * @param patch Minimum client version that can be used in the chain,
   * patch level.
   */
  function initialize(uint256 major, uint256 minor, uint256 patch, uint256 _gasForNonGoldCurrencies)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setMinimumClientVersion(major, minor, patch);
    setIntrinsicGasForAlternativeGasCurrency(_gasForNonGoldCurrencies);
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

  function setIntrinsicGasForAlternativeGasCurrency(uint256 gas) public onlyOwner {
    intrinsicGasForAlternativeGasCurrency = gas;
    emit IntrinsicGasForAlternativeGasCurrencySet(gas);
  }

  /** @notice Query minimum client version.
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

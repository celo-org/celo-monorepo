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

  uint256 public gasForDebitFromTransactions;
  uint256 public gasForCreditToTransactions;
  uint256 public gasToReadErc20Balance;
  uint256 public gasToReadTobinTax;
  uint256 public gasForNonGoldCurrencies;

  event MinimumClientVersionSet(uint256 major, uint256 minor, uint256 patch);
  event GasForDebitFromTransactionsSet(uint gas);
  event GasForCreditToTransactionsSet(uint gas);
  event GasToReadErc20BalanceSet(uint gas);
  event GasToReadTobinTaxSet(uint gas);
  event GasForNonGoldCurrenciesSet(uint gas);

  /**
   * @notice Initializes critical variables.
   * @param major Minimum client version that can be used in the chain,
   * major version.
   * @param minor Minimum client version that can be used in the chain,
   * minor version.
   * @param patch Minimum client version that can be used in the chain,
   * patch level.
   */
  function initialize(
    uint256 _minimumClientVersion1,
    uint256 _minimumClientVersion2,
    uint256 _minimumClientVersion3,
    uint256 _gasForDebitFromTransactions,
    uint256 _gasForCreditToTransactions,
    uint256 _gasToReadErc20Balance,
    uint256 _gasToReadTobinTax,
    uint256 _gasForNonGoldCurrencies
  ) external initializer
  {
    _transferOwnership(msg.sender);
    setMinimumClientVersion(major, minor, patch);
    setGasForDebitFromTransactions(_gasForDebitFromTransactions);
    setGasForCreditToTransactions(_gasForCreditToTransactions);
    setGasToReadErc20Balance(_gasToReadErc20Balance);
    setGasToReadTobinTax(_gasToReadTobinTax);
    setGasForNonGoldCurrencies(_gasForNonGoldCurrencies);
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

  function setGasForDebitFromTransactions(uint256 gas) public onlyOwner {
    gasForDebitFromTransactions = gas;
    emit GasForDebitFromTransactionsSet(gas);
  }

  function setGasForCreditToTransactions(uint256 gas) public onlyOwner {
    gasForCreditToTransactions = gas;
    emit GasForCreditToTransactionsSet(gas);
  }

  function setGasToReadErc20Balance(uint256 gas) public onlyOwner {
    gasToReadErc20Balance = gas;
    emit GasToReadErc20BalanceSet(gas);
  }

  function setGasToReadTobinTax(uint256 gas) public onlyOwner {
    gasToReadTobinTax = gas;
    emit GasToReadTobinTaxSet(gas);
  }

  function setGasForNonGoldCurrencies(uint256 gas) public onlyOwner {
    gasForNonGoldCurrencies = gas;
    emit GasForNonGoldCurrenciesSet(gas);
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

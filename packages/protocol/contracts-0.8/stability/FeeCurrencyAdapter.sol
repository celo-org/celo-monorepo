// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "../../contracts/common/CalledByVm.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "./interfaces/IFeeCurrency.sol";
import "./interfaces/IDecimals.sol";

contract FeeCurrencyAdapter is Initializable, CalledByVm, Ownable {
  IFeeCurrency public wrappedToken;

  uint96 public digitDifference;

  uint256 public debited;

  string public name;
  string public symbol;

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
    return (1, 1, 0, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _wrappedToken The address of the wrapped token.
   * @param _name The name of the wrapped token.
   * @param _symbol The symbol of the wrapped token.
   * @param _expectedDecimals The expected number of decimals of the wrapped token.
   */
  function initialize(
    address _wrappedToken,
    string memory _name,
    string memory _symbol,
    uint8 _expectedDecimals
  ) external initializer {
    _transferOwnership(msg.sender);
    wrappedToken = IFeeCurrency(_wrappedToken);
    name = _name;
    symbol = _symbol;
    uint8 decimals = IDecimals(_wrappedToken).decimals();
    digitDifference = uint96(10**(_expectedDecimals - decimals));
  }

  /**
     * @notice Gets the balance of the specified address with correct digits.
     * @param account The address to query the balance of.
     * @return The balance of the specified address.
     */
  function balanceOf(address account) public view returns (uint256) {
    return upscale(wrappedToken.balanceOf(account));
  }

  /**
   * Downscales value to the wrapped token's native digits and debits it.
   * @param from from address
   * @param value Debited value in the wrapped digits.
   */
  function debitGasFees(address from, uint256 value) external onlyVm {
    uint256 toDebit = downscale(value);
    require(toDebit > 0, "Must debit at least one token.");
    debited = toDebit;
    wrappedToken.debitGasFees(from, toDebit);
  }

  /**
   * Downscales value to the wrapped token's native digits and credits it.
   * @param refundRecipient The recipient of the refund.
   * @param tipRecipient The recipient of the tip.
   * @param _gatewayFeeRecipient The recipient of the gateway fee. Unused.
   * @param baseFeeRecipient The recipient of the base fee.
   * @param refundAmount The amount to refund (in wrapped token digits).
   * @param tipAmount The amount to tip (in wrapped token digits).
   * @param _gatewayFeeAmount The amount of the gateway fee (in wrapped token digits). Unused.
   * @param baseFeeAmount The amount of the base fee (in wrapped token digits).
   */
  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address _gatewayFeeRecipient,
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 _gatewayFeeAmount,
    uint256 baseFeeAmount
  ) public onlyVm {
    if (debited == 0) {
      // When eth.estimateGas is called, this function is called but we don't want to credit anything.
      return;
    }

    uint256 refundScaled = downscale(refundAmount);
    uint256 tipTxFeeScaled = downscale(tipAmount);
    uint256 baseTxFeeScaled = downscale(baseFeeAmount);

    require(
      refundScaled + tipTxFeeScaled + baseTxFeeScaled <= debited,
      "Cannot credit more than debited."
    );

    uint256 roundingError = debited - (refundScaled + tipTxFeeScaled + baseTxFeeScaled);

    if (roundingError > 0) {
      baseTxFeeScaled += roundingError;
    }
    wrappedToken.creditGasFees(
      refundRecipient,
      tipRecipient,
      address(0),
      baseFeeRecipient,
      refundScaled,
      tipTxFeeScaled,
      0,
      baseTxFeeScaled
    );

    debited = 0;
  }

  /**
   * @notice Sets wrapped token address.
   * @param _wrappedToken The address of the wrapped token.
   */
  function setWrappedToken(address _wrappedToken) external onlyOwner {
    wrappedToken = IFeeCurrency(_wrappedToken);
  }

  /**
   * @notice Returns wrapped token address.
   * @return The wrapped token address.
   */
  function getWrappedToken() external view returns (address) {
    return address(wrappedToken);
  }

  function upscale(uint256 value) internal view returns (uint256) {
    return value * digitDifference;
  }

  function downscale(uint256 value) internal view returns (uint256) {
    return value / digitDifference;
  }
}

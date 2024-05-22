// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

import "../../contracts/common/CalledByVm.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "./interfaces/IFeeCurrency.sol";
import "./interfaces/IDecimals.sol";
import "./interfaces/IFeeCurrencyAdapter.sol";

contract FeeCurrencyAdapter is Initializable, CalledByVm, IFeeCurrencyAdapter {
  IFeeCurrency public adaptedToken;

  uint96 public digitDifference;

  uint256 public debited = 0;

  string public name;
  string public symbol;

  uint8 public expectedDecimals;

  uint256[44] __gap;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _adaptedToken The address of the adapted token.
   * @param _name The name of the adapted token.
   * @param _symbol The symbol of the adapted token.
   * @param _expectedDecimals The expected number of decimals of the adapted token.
   * @notice _expectedDecimals must be bigger than _adaptedToken.decimals().
   */
  function initialize(
    address _adaptedToken,
    string memory _name,
    string memory _symbol,
    uint8 _expectedDecimals
  ) public virtual initializer {
    _setAdaptedToken(_adaptedToken);
    name = _name;
    symbol = _symbol;
    uint8 _decimals = IDecimals(_adaptedToken).decimals();
    require(
      _decimals < _expectedDecimals,
      "Decimals of adapted token must be < expected decimals."
    );
    digitDifference = uint96(10 ** (_expectedDecimals - _decimals));
    expectedDecimals = _expectedDecimals;
  }

  /**
   * Downscales value to the adapted token's native digits and debits it.
   * @param from from address
   * @param value Debited value in the adapted digits.
   */
  function debitGasFees(address from, uint256 value) external onlyVm {
    uint256 valueScaled = downscale(value);
    require(valueScaled > 0, "Scaled debit value must be > 0.");
    debited = valueScaled;
    adaptedToken.debitGasFees(from, valueScaled);
  }

  /**
   * Downscales value to the adapted token's native digits and credits it.
   * @param refundRecipient The recipient of the refund.
   * @param tipRecipient The recipient of the tip.
   * @param _gatewayFeeRecipient The recipient of the gateway fee. Unused.
   * @param baseFeeRecipient The recipient of the base fee.
   * @param refundAmount The amount to refund (in adapted token digits).
   * @param tipAmount The amount to tip (in adapted token digits).
   * @param _gatewayFeeAmount The amount of the gateway fee (in adapted token digits). Unused.
   * @param baseFeeAmount The amount of the base fee (in adapted token digits).
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
  ) external onlyVm {
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
    adaptedToken.creditGasFees(
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
   * @notice Returns adapted token address.
   * @return The adapted token address.
   */
  function getAdaptedToken() external view returns (address) {
    return address(adaptedToken);
  }

  /**
   * @notice Gets the balance of the specified address with correct digits.
   * @param account The address to query the balance of.
   * @return The balance of the specified address.
   */
  function balanceOf(address account) external view returns (uint256) {
    return upscale(adaptedToken.balanceOf(account));
  }

  /**
   * @notice Gets the total supply with correct digits.
   * @return The total supply.
   */
  function totalSupply() external view returns (uint256) {
    return upscale(adaptedToken.totalSupply());
  }

  /**
   * @notice Gets the total supply with correct digits.
   * @return The total supply.
   */
  function decimals() external view returns (uint8) {
    return expectedDecimals;
  }

  function _setAdaptedToken(address _adaptedToken) internal virtual {
    adaptedToken = IFeeCurrency(_adaptedToken);
  }

  function upscale(uint256 value) internal view returns (uint256) {
    return value * digitDifference;
  }

  /**
   * @notice Downscales value to the adapted token's native digits.
   * @dev Downscale is rounding up in favour of protocol. User possibly can pay a bit more than expected (up to 1 unit of a token).
   * Example:
   * USDC has 6 decimals and in such case user can pay up to 0.000001 USDC more than expected.
   * WBTC (currently not supported by Celo chain as fee currency) has 8 decimals and in such case user can pay up to 0.00000001 WBTC more than expected.
   * Considering the current price of WBTC, it's less than 0.0005 USD. Even when WBTC price would be 1 mil USD, it's still would be only 0.01 USD.
   * In general it is a very small amount and it is acceptable to round up in favor of the protocol.
   * @param value The value to downscale.
   */
  function downscale(uint256 value) internal view returns (uint256) {
    return (value + digitDifference - 1) / digitDifference;
  }
}

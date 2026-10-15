// SPDX-License-Identifier: apache-2.0
// Original distribution at https://gist.github.com/martinvol/1061f25b61cf28915a7e0d3539bf4165
// Adapted by Tether.to 2024 for greater flexibility and reusability
pragma solidity >=0.8.4 <0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "src/contracts/interfaces/IFeeCurrency.sol";
import "src/contracts/Wrappers/interfaces/IFeeCurrencyAdapter.sol";


contract FeeCurrencyWrapperOriginal is Initializable, IFeeCurrencyAdapter {

  modifier onlyVm() {
    require(msg.sender == address(0), "Only VM can call");
    _;
  }

  IFeeCurrency public wrappedToken;

  uint96 public override digitDifference;

  uint256 public override debited;

  uint8 public constant override decimals = 18;

  function symbol() external view override returns (string memory) {
    return wrappedToken.symbol();
  }

  function name() external view override returns (string memory) {
    return wrappedToken.name();
  }

  function expectedDecimals() external view override returns (uint8) {
    return decimals;
  }

  function getAdaptedToken() external view override returns (address) {
    return address(wrappedToken);
  }

  constructor () initializer {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _wrappedToken The address of the wrapped token.
   */
  function initialize(address _wrappedToken)
    external
    initializer
  {
    wrappedToken = IFeeCurrency(_wrappedToken);
    uint8 wrappedTokenDigits = wrappedToken.decimals();

    require(
      wrappedTokenDigits <= decimals,
      "Wrapped token digits must be less than or equal to required token digits"
    );
    digitDifference = uint96(10 ** (decimals - wrappedTokenDigits));
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
   * @notice Gets the total supply with correct digits.
   * @return The total supply.
   */
  function totalSupply() public view returns (uint256) {
    return upscale(wrappedToken.totalSupply());
  }

  /**
   * Downscales value to the wrapped token's native digits and debits it.
   * @param from from address
   * @param value Debited value in the wrapped digits.
   */
  function debitGasFees(address from, uint256 value) external override onlyVm {
    uint256 toDebit = downscale(value);
    require(toDebit > 0, "Can not debit 0");
   
    debited = toDebit;
    wrappedToken.debitGasFees(from, toDebit);
  }

  /**
   * Downscales value to the wrapped token's native digits and credits it.
   * @param refundRecipient the address that will receive the refund
   * @param tipRecipient the coinbase of the validator receiving the tip
   * @param baseFeeRecipient the address receiving the fee (currently FeeHandler)
   * @param refundAmount refund amount (in wrapped token digits)
   * @param tipAmount tip amount sent to the coinbase (in wrapped token digits)
   * @param baseFeeAmount base transaction fee (in wrapped token digits)
   */
  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address , // unused
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 ,  // unused
    uint256 baseFeeAmount
  ) external override onlyVm {

    if (debited == 0) {
      return;
    }

    uint256 refundAmountScaled = downscale(refundAmount);
    uint256 tipAmountScaled = downscale(tipAmount);
    uint256 baseFeeAmountScaled = downscale(baseFeeAmount);

    require(
      refundAmountScaled + tipAmountScaled + baseFeeAmountScaled <= debited,
      "Can not credit more than debited"
    );

    uint256 roundingError = debited - (refundAmountScaled + tipAmountScaled + baseFeeAmountScaled);

    if (roundingError > 0) {
      baseFeeAmountScaled += roundingError;
    }

    wrappedToken.creditGasFees(
      refundRecipient,
      tipRecipient,
      address(0), // unused
      baseFeeRecipient,
      refundAmountScaled,
      tipAmountScaled,
      0, // unused
      baseFeeAmountScaled
    );

    debited = 0;
  }

  function upscale(uint256 value) internal view returns (uint256) {
    return value * digitDifference;
  }

  function downscale(uint256 value) internal view returns (uint256) {
    return value / digitDifference;
  }
}
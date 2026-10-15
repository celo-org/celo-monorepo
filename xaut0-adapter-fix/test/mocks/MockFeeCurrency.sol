// SPDX-License-Identifier: apache-2.0
pragma solidity ^0.8.4;

import "src/contracts/interfaces/IFeeCurrency.sol";

/// Minimal 6-decimal fee currency. Gas-fee functions mirror the XAUt0 token on Celo:
/// debit moves tokens to GAS_FEE_ADDRESS, credit moves them back out to the recipients.
contract MockFeeCurrency is IFeeCurrency {
  address public constant GAS_FEE_ADDRESS = 0x000000000000000000000000000000000Ce106A5;

  string public constant override name = "Mock Tether Gold";
  string public constant override symbol = "XAUt0";
  uint8 public constant override decimals = 6;

  mapping(address => bool) public isFeeCurrencyWrapper;
  uint256 public override totalSupply;
  mapping(address => uint256) public override balanceOf;
  mapping(address => mapping(address => uint256)) public override allowance;

  modifier onlyFeeWrapper() {
    require(msg.sender == address(0) || isFeeCurrencyWrapper[msg.sender], "only fee wrapper");
    _;
  }

  function allowFeeCurrencyWrapper(address wrapper) external {
    isFeeCurrencyWrapper[wrapper] = true;
  }

  function mint(address to, uint256 amount) external {
    balanceOf[to] += amount;
    totalSupply += amount;
  }

  function debitGasFees(address from, uint256 value) external override onlyFeeWrapper {
    _transfer(from, GAS_FEE_ADDRESS, value);
  }

  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address,
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256,
    uint256 baseFeeAmount
  ) external override onlyFeeWrapper {
    if (tipRecipient != address(0)) _transfer(GAS_FEE_ADDRESS, tipRecipient, tipAmount);
    if (baseFeeRecipient != address(0)) _transfer(GAS_FEE_ADDRESS, baseFeeRecipient, baseFeeAmount);
    if (refundAmount > 0) _transfer(GAS_FEE_ADDRESS, refundRecipient, refundAmount);
  }

  function transfer(address to, uint256 amount) external override returns (bool) {
    _transfer(msg.sender, to, amount);
    return true;
  }

  function approve(address spender, uint256 amount) external override returns (bool) {
    allowance[msg.sender][spender] = amount;
    return true;
  }

  function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
    allowance[from][msg.sender] -= amount;
    _transfer(from, to, amount);
    return true;
  }

  function _transfer(address from, address to, uint256 amount) internal {
    require(balanceOf[from] >= amount, "insufficient balance");
    balanceOf[from] -= amount;
    balanceOf[to] += amount;
  }
}

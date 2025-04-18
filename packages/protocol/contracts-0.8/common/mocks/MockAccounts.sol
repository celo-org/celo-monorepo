// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../../../contracts/common/FixidityLib.sol";

contract MockAccounts {
  using FixidityLib for FixidityLib.Fraction;

  struct PaymentDelegation {
    // Address that should receive a fraction of validator payments.
    address beneficiary;
    // Fraction of payment to delegate to `beneficiary`.
    FixidityLib.Fraction fraction;
  }

  mapping(address => PaymentDelegation) delegations;
  mapping(address => address) accountToSigner;

  function setValidatorSigner(address account, address signer) external {
    accountToSigner[account] = signer;
  }

  function getValidatorSigner(address account) external view returns (address) {
    return accountToSigner[account];
  }

  function getPaymentDelegation(address account) external view returns (address, uint256) {
    PaymentDelegation storage delegation = delegations[account];
    return (delegation.beneficiary, delegation.fraction.unwrap());
  }

  function setPaymentDelegationFor(
    address validator,
    address beneficiary,
    uint256 fraction
  ) public {
    delegations[validator] = PaymentDelegation(beneficiary, FixidityLib.wrap(fraction));
  }

  function deletePaymentDelegationFor(address validator) public {
    delete delegations[validator];
  }
}

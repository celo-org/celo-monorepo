// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/FixidityLib.sol";

contract MockAccounts {
  using FixidityLib for FixidityLib.Fraction;

  struct PaymentDelegation {
    // Address that should receive a fraction of validator payments.
    address beneficiary;
    // Fraction of payment to delegate to `beneficiary`.
    FixidityLib.Fraction fraction;
  }

  mapping(address => PaymentDelegation) delegations;

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

  function getPaymentDelegation(address account) external view returns (address, uint256) {
    PaymentDelegation storage delegation = delegations[account];
    return (delegation.beneficiary, delegation.fraction.unwrap());
  }
}

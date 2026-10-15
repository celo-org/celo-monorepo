// SPDX-License-Identifier: apache-2.0
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "src/contracts/Wrappers/FeeCurrencyWrapper.sol";
import "test/original/FeeCurrencyWrapperOriginal.sol";
import "test/mocks/MockFeeCurrency.sol";
import "test/mocks/MinimalProxy.sol";

/// Test vectors for the rounding fix in FeeCurrencyWrapper.debitGasFees.
///
/// All values are in the adapter's 18-decimal units; the wrapped token has 6 decimals,
/// so digitDifference is 1e12 (one native unit of the token).
///
/// The "mainnet" vector reproduces the minimal XAUt0 transaction observed on Celo mainnet
/// at block 79570345: gas limit 106,000 (21,000 + 85,000 intrinsic for XAUt0), base fee
/// 4,610,531 XAUt0 units per gas, tip 4,800,000, max fee 10,000,000.
contract FeeCurrencyWrapperTest is Test {
  uint256 constant DIGIT_DIFFERENCE = 1e12;

  uint256 constant GAS = 106_000;
  uint256 constant BASE_FEE_PER_GAS = 4_610_531;
  uint256 constant TIP_PER_GAS = 4_800_000;
  uint256 constant MAX_FEE_PER_GAS = 10_000_000;

  uint256 constant MAINNET_ADMISSION_DEBIT = GAS * MAX_FEE_PER_GAS; // 1,060,000,000,000
  uint256 constant MAINNET_EFFECTIVE_DEBIT = GAS * (BASE_FEE_PER_GAS + TIP_PER_GAS); // 997,516,286,000
  uint256 constant MAINNET_TIP = GAS * TIP_PER_GAS; // 508,800,000,000
  uint256 constant MAINNET_BASE_FEE = GAS * BASE_FEE_PER_GAS; // 488,716,286,000

  address constant VM = address(0);
  address holder = makeAddr("holder");
  address tipRecipient = makeAddr("tipRecipient");
  address baseFeeRecipient = makeAddr("baseFeeRecipient");

  MockFeeCurrency token;
  FeeCurrencyWrapper wrapper;
  FeeCurrencyWrapperOriginal original;

  function setUp() public {
    token = new MockFeeCurrency();
    wrapper = FeeCurrencyWrapper(address(new MinimalProxy(address(new FeeCurrencyWrapper()))));
    wrapper.initialize(address(token));
    original = FeeCurrencyWrapperOriginal(address(new MinimalProxy(address(new FeeCurrencyWrapperOriginal()))));
    original.initialize(address(token));
    token.allowFeeCurrencyWrapper(address(wrapper));
    token.allowFeeCurrencyWrapper(address(original));
    token.mint(holder, 1_000_000); // 1 XAUt0
    assertEq(wrapper.digitDifference(), DIGIT_DIFFERENCE);
  }

  // ---------------------------------------------------------------------------
  // Debit vectors (patched wrapper)
  // ---------------------------------------------------------------------------

  function test_vector_debit_zero_reverts() public {
    vm.prank(VM);
    vm.expectRevert("Can not debit 0");
    wrapper.debitGasFees(holder, 0);
  }

  function test_vector_debit_one_wei_charges_one_unit() public {
    _assertDebit(1, 1);
  }

  function test_vector_debit_just_below_one_unit_charges_one_unit() public {
    _assertDebit(DIGIT_DIFFERENCE - 1, 1); // 999,999,999,999 -> 1
  }

  function test_vector_debit_exactly_one_unit_charges_one_unit() public {
    _assertDebit(DIGIT_DIFFERENCE, 1); // 1,000,000,000,000 -> 1
  }

  function test_vector_debit_just_above_one_unit_charges_two_units() public {
    _assertDebit(DIGIT_DIFFERENCE + 1, 2); // 1,000,000,000,001 -> 2
  }

  function test_vector_debit_exact_multiple_is_unchanged() public {
    _assertDebit(1000 * DIGIT_DIFFERENCE, 1000);
  }

  function test_vector_debit_mainnet_effective_fee_charges_one_unit() public {
    // Floor gave 0 here and the adapter reverted with "Can not debit 0".
    _assertDebit(MAINNET_EFFECTIVE_DEBIT, 1);
  }

  function test_vector_debit_mainnet_admission_fee_charges_two_units() public {
    // Floor gave 1 here; the extra unit is refunded through creditGasFees.
    _assertDebit(MAINNET_ADMISSION_DEBIT, 2);
  }

  function test_debit_reverts_when_not_called_by_vm() public {
    vm.expectRevert("Only VM can call");
    wrapper.debitGasFees(holder, DIGIT_DIFFERENCE);
  }

  // ---------------------------------------------------------------------------
  // Credit vectors (patched wrapper; credit path unchanged, floors + rounding error)
  // ---------------------------------------------------------------------------

  function test_vector_credit_after_mainnet_debit_sends_rounding_unit_to_base_fee() public {
    _assertDebit(MAINNET_EFFECTIVE_DEBIT, 1);

    vm.prank(VM);
    wrapper.creditGasFees(holder, tipRecipient, address(0), baseFeeRecipient, 0, MAINNET_TIP, 0, MAINNET_BASE_FEE);

    assertEq(token.balanceOf(tipRecipient), 0, "tip floors to 0");
    assertEq(token.balanceOf(baseFeeRecipient), 1, "base fee gets the rounding unit");
    assertEq(token.balanceOf(token.GAS_FEE_ADDRESS()), 0, "nothing left in escrow");
    assertEq(wrapper.debited(), 0);
  }

  function test_vector_credit_full_refund_of_sub_unit_debit_keeps_one_unit_as_fee() public {
    // A user pays at most one native unit more than the exact fee.
    _assertDebit(DIGIT_DIFFERENCE - 1, 1);

    vm.prank(VM);
    wrapper.creditGasFees(holder, tipRecipient, address(0), baseFeeRecipient, DIGIT_DIFFERENCE - 1, 0, 0, 0);

    assertEq(token.balanceOf(holder), 1_000_000 - 1);
    assertEq(token.balanceOf(baseFeeRecipient), 1);
    assertEq(wrapper.debited(), 0);
  }

  function test_vector_credit_after_mainnet_admission_debit_refunds_extra_unit() public {
    _assertDebit(MAINNET_ADMISSION_DEBIT, 2);
    uint256 refund = MAINNET_ADMISSION_DEBIT - MAINNET_EFFECTIVE_DEBIT; // 62,483,714,000

    vm.prank(VM);
    wrapper.creditGasFees(holder, tipRecipient, address(0), baseFeeRecipient, refund, MAINNET_TIP, 0, MAINNET_BASE_FEE);

    // refund 0.062 -> 0, tip 0.5088 -> 0, base 0.4887 -> 0, rounding error 2 -> base fee
    assertEq(token.balanceOf(holder), 1_000_000 - 2);
    assertEq(token.balanceOf(tipRecipient), 0);
    assertEq(token.balanceOf(baseFeeRecipient), 2);
    assertEq(wrapper.debited(), 0);
  }

  function test_credit_is_noop_when_nothing_debited() public {
    vm.prank(VM);
    wrapper.creditGasFees(holder, tipRecipient, address(0), baseFeeRecipient, 1, 1, 0, 1);
    assertEq(token.balanceOf(baseFeeRecipient), 0);
  }

  // ---------------------------------------------------------------------------
  // Invariants
  // ---------------------------------------------------------------------------

  /// For any debit and any split of it into refund + tip + base fee, the credit never reverts
  /// and the credited total equals the debited amount.
  function testFuzz_credit_never_exceeds_debit(uint256 value, uint256 refund, uint256 tip) public {
    value = bound(value, 1, 1_000_000 * DIGIT_DIFFERENCE);
    refund = bound(refund, 0, value);
    tip = bound(tip, 0, value - refund);
    uint256 baseFee = value - refund - tip;

    vm.prank(VM);
    wrapper.debitGasFees(holder, value);
    uint256 debited = wrapper.debited();
    assertEq(debited, (value + DIGIT_DIFFERENCE - 1) / DIGIT_DIFFERENCE);

    vm.prank(VM);
    wrapper.creditGasFees(holder, tipRecipient, address(0), baseFeeRecipient, refund, tip, 0, baseFee);

    uint256 credited = 1_000_000 - token.balanceOf(holder);
    assertEq(token.balanceOf(token.GAS_FEE_ADDRESS()), 0, "escrow fully distributed");
    assertEq(token.balanceOf(tipRecipient) + token.balanceOf(baseFeeRecipient), credited);
    assertEq(wrapper.debited(), 0);
  }

  /// The patched debit differs from the original by at most one native unit, and only
  /// when the value is not an exact multiple of digitDifference.
  function testFuzz_patched_debit_is_original_plus_at_most_one(uint256 value) public {
    // Both wrappers debit the same holder, who holds 1,000,000 units.
    value = bound(value, DIGIT_DIFFERENCE, 400_000 * DIGIT_DIFFERENCE);

    vm.prank(VM);
    wrapper.debitGasFees(holder, value);
    vm.prank(VM);
    original.debitGasFees(holder, value);

    uint256 expectedDelta = value % DIGIT_DIFFERENCE == 0 ? 0 : 1;
    assertEq(wrapper.debited() - original.debited(), expectedDelta);
  }

  // ---------------------------------------------------------------------------
  // Regression: the original (currently deployed) code
  // ---------------------------------------------------------------------------

  function test_original_reverts_on_mainnet_effective_fee() public {
    vm.prank(VM);
    vm.expectRevert("Can not debit 0");
    original.debitGasFees(holder, MAINNET_EFFECTIVE_DEBIT);
  }

  function test_original_reverts_just_below_one_unit() public {
    vm.prank(VM);
    vm.expectRevert("Can not debit 0");
    original.debitGasFees(holder, DIGIT_DIFFERENCE - 1);
  }

  // ---------------------------------------------------------------------------

  function _assertDebit(uint256 value, uint256 expectedUnits) internal {
    uint256 before = token.balanceOf(holder);
    vm.prank(VM);
    wrapper.debitGasFees(holder, value);
    assertEq(wrapper.debited(), expectedUnits, "debited");
    assertEq(before - token.balanceOf(holder), expectedUnits, "holder balance delta");
    assertEq(token.balanceOf(token.GAS_FEE_ADDRESS()), expectedUnits, "escrow");
  }
}

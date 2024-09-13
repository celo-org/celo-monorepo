// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/test/FixidityWrapper.sol";

contract FixidityTest is Test {
  uint256 private constant FIXED1_UINT = 1000000000000000000000000;
  uint256 private constant MAX_NEW_FIXED = 115792089237316195423570985008687907853269984665640564;
  uint256 private constant MAX_NEW_FIXED_ADD =
    57896044618658097711785492504343953926634992332820282019728792003956564819967;
  uint256 private constant MAX_UINT256 =
    115792089237316195423570985008687907853269984665640564039457584007913129639935;
  uint256 private constant MAX_FIXED_MUL = 340282366920938463463374607431768211455999999999999;
  uint256 private constant MAX_FIXED_DIV = 115792089237316195423570985008687907853269984665640564;
  uint256 private constant MUL_PRECISION = 1000000000000;

  FixidityWrapper fixidity;

  function setUp() public {
    fixidity = new FixidityWrapper();
  }

  function test_zero_fixed() public {
    assertEq(fixidity.newFixed(0), 0);
  }

  function test_one_fixed() public {
    assertEq(fixidity.newFixed(1), FIXED1_UINT);
  }

  function test_create_maxNewFixed() public {
    assertEq(
      fixidity.newFixed(MAX_NEW_FIXED),
      115792089237316195423570985008687907853269984665640564000000000000000000000000
    );
  }

  function test_new_fixed_plus_one() public {
    vm.expectRevert("can't create fixidity number larger than maxNewFixed()");
    fixidity.newFixed(MAX_NEW_FIXED + 1);
  }

  function test_fraction_one() public {
    assertEq(fixidity.newFixedFraction(1, 1), FIXED1_UINT);
  }

  function test_fraction_zero() public {
    assertEq(fixidity.newFixedFraction(0, 1), 0);
  }

  function test_fraction_one_fixed() public {
    assertEq(fixidity.newFixedFraction(1, FIXED1_UINT), 1);
  }

  function test_fraction_zero_denominator() public {
    vm.expectRevert("can't divide by 0");
    fixidity.newFixedFraction(1, 0);
  }

  function test_fraction_add_interger() public {
    uint256 a = fixidity.newFixed(2);
    uint256 b = fixidity.newFixed(3);

    assertEq(fixidity.add(a, b), fixidity.newFixed(5));
  }

  function test_fraction_add_fraction() public {
    uint256 a = fixidity.newFixedFraction(242, 100);
    uint256 b = fixidity.newFixedFraction(363, 100);

    assertEq(fixidity.add(a, b), fixidity.newFixedFraction(605, 100));
  }

  function add_two_maxFixedAdd_numbers() public {
    fixidity.add(MAX_NEW_FIXED_ADD, MAX_NEW_FIXED_ADD);

    assertEq(fixidity.add(MAX_NEW_FIXED_ADD, MAX_NEW_FIXED_ADD), MAX_NEW_FIXED - 1);
  }

  function test_no_maxFixed_add() public {
    uint256 fixedAdd1 = MAX_NEW_FIXED_ADD + 1;

    vm.expectRevert("add overflow detected");
    fixidity.add(fixedAdd1, fixedAdd1);
  }

  function test_no_add_maxUint256() public {
    vm.expectRevert("add overflow detected");
    fixidity.add(MAX_UINT256, 1);
  }

  function test_substract_integers() public {
    uint256 a = fixidity.newFixedFraction(100, 10);
    uint256 b = fixidity.newFixedFraction(60, 10);
    uint256 expected = fixidity.newFixedFraction(40, 10);

    uint256 result = fixidity.subtract(a, b);
    assertEq(result, expected);
  }

  function test_substract_fractions() public {
    uint256 a = fixidity.newFixedFraction(234, 10);
    uint256 b = fixidity.newFixedFraction(232, 10);
    uint256 expected = fixidity.newFixedFraction(2, 10);

    uint256 result = fixidity.subtract(a, b);
    assertEq(result, expected);
  }

  function test_substract_fail_small_large_number() public {
    uint256 a = fixidity.newFixedFraction(60, 10);
    uint256 b = fixidity.newFixedFraction(100, 10);

    vm.expectRevert("substraction underflow detected");
    fixidity.subtract(a, b);
  }

  function test_multiply_integers() public {
    uint256 a = fixidity.newFixedFraction(70, 10);
    uint256 b = fixidity.newFixedFraction(60, 10);
    uint256 expected = fixidity.newFixedFraction(420, 10);

    uint256 result = fixidity.multiply(a, b);
    assertEq(result, expected);
  }

  function test_multiply_fraction() public {
    uint256 a = fixidity.newFixedFraction(13, 10);
    uint256 b = fixidity.newFixedFraction(42, 10);
    uint256 expected = fixidity.newFixedFraction(546, 100);

    uint256 result = fixidity.multiply(a, b);
    assertEq(result, expected);
  }

  function test_multiply_by_zero() public {
    assertEq(fixidity.multiply(FIXED1_UINT, 0), 0);
  }

  function test_multiply_maxFixedMul() public {
    uint256 result = fixidity.multiply(MAX_FIXED_MUL, MAX_FIXED_MUL);
    uint256 expected = 115792089237316195423570985008687907853269984665639883474723742130122666467811;
    assertEq(result, expected);
  }

  function test_multiply_retain_presition() public {
    uint256 a = fixidity.divide(FIXED1_UINT, MUL_PRECISION);
    uint256 b = fixidity.multiply(FIXED1_UINT, MUL_PRECISION);

    uint256 result = fixidity.multiply(a, b);

    assertEq(result, FIXED1_UINT);
  }

  function test_multiply_fails_larger_than_maxFixedMul() public {
    uint256 a = MAX_FIXED_MUL + 1;

    vm.expectRevert("add overflow detected");

    fixidity.multiply(a, a);
  }

  function test_reciprocal_fixed1() public {
    assertEq(fixidity.reciprocal(FIXED1_UINT), FIXED1_UINT);
  }

  function test_divide_intergers() public {
    uint256 a = fixidity.newFixedFraction(840, 10);
    uint256 b = fixidity.newFixedFraction(20, 10);
    uint256 expected = fixidity.newFixedFraction(420, 10);

    uint256 result = fixidity.divide(a, b);
    assertEq(result, expected);
  }

  function test_divide_fractions() public {
    uint256 a = fixidity.newFixedFraction(18, 10);
    uint256 b = fixidity.newFixedFraction(15, 10);
    uint256 expected = fixidity.newFixedFraction(12, 10);

    uint256 result = fixidity.divide(a, b);
    assertEq(result, expected);
  }

  function test_divide_maxFixedDividend_1() public {
    assertEq(fixidity.divide(MAX_FIXED_DIV, 1), MAX_FIXED_DIV * FIXED1_UINT);
  }

  function test_divide_fail_more_than_max_div() public {
    vm.expectRevert("overflow at divide");
    fixidity.divide(MAX_FIXED_DIV + 1, 1);
  }

  function test_divide_fail_divide_zero() public {
    vm.expectRevert("can't divide by 0");
    fixidity.divide(MAX_FIXED_DIV, 0);
  }

  function test_comparison_first_number_greather() public {
    uint256 a = 2;
    uint256 b = 1;

    assertTrue(fixidity.gt(a, b));
    assertTrue(fixidity.gte(a, b));
    assertFalse(fixidity.lt(a, b));
    assertFalse(fixidity.lte(a, b));
  }

  function test_comparison_numbers_equal() public {
    uint256 a = 2;
    uint256 b = 2;

    assertFalse(fixidity.gt(a, b));
    assertTrue(fixidity.gte(a, b));
    assertFalse(fixidity.lt(a, b));
    assertTrue(fixidity.lte(a, b));
  }

  function test_comparison_first_number_smaller() public {
    uint256 a = 1;
    uint256 b = 2;

    assertFalse(fixidity.gt(a, b));
    assertFalse(fixidity.gte(a, b));
    assertTrue(fixidity.lt(a, b));
    assertTrue(fixidity.lte(a, b));
  }
}

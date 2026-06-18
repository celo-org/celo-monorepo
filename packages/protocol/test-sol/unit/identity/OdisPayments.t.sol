// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

import { OdisPayments } from "@celo-contracts-8/identity/OdisPayments.sol";
import { MockERC20 } from "@test-sol/unit/common/mocks/MockERC20.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";

contract OdisPaymentsFoundryTest is Test, TestConstants {
  uint256 startingBalanceCUSD = 1000;

  IRegistry registry;
  OdisPayments odisPayments;
  address odisPaymentsAddress;
  // cUSD is exercised purely as an ERC-20 by OdisPayments; the allowance-aware
  // MockERC20 replaces the mento StableToken (0.5 submodule, not importable by 0.8).
  MockERC20 stableToken;

  address sender;
  address receiver;

  event PaymentMade(address indexed account, uint256 valueInCUSD);

  function setUp() public virtual {
    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);

    registry = IRegistry(REGISTRY_ADDRESS);
    odisPayments = new OdisPayments(true);
    odisPaymentsAddress = address(odisPayments);
    stableToken = new MockERC20("Celo Dollar", "cUSD", 18);

    sender = actor("sender");
    receiver = actor("receiver");

    odisPayments.initialize();
    registry.setAddressFor("StableToken", address(stableToken));

    // Initialize owner and sender with balances
    stableToken.mint(address(this), startingBalanceCUSD);
    stableToken.mint(sender, startingBalanceCUSD);
  }
}

contract OdisPaymentsFoundryTest_Initialize is OdisPaymentsFoundryTest {
  function setUp() public override {
    super.setUp();
  }

  function test_ShouldHaveSetOwner() public {
    assertEq(IOwnable(odisPaymentsAddress).owner(), address(this));
  }

  function test_ShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    odisPayments.initialize();
  }
}

contract OdisPaymentsFoundryTest_PayInCUSD is OdisPaymentsFoundryTest {
  uint256 valueApprovedForTransfer = 10;

  function setUp() public override {
    super.setUp();

    vm.prank(sender);
    stableToken.approve(address(odisPayments), valueApprovedForTransfer);

    assertEq(stableToken.balanceOf(sender), startingBalanceCUSD);
  }

  function checkStatecUSD(
    address cusdSender,
    address odisPaymentReceiver,
    uint256 totalValueSent
  ) public {
    assertEq(stableToken.balanceOf(cusdSender), startingBalanceCUSD - totalValueSent);
    assertEq(stableToken.balanceOf(address(odisPayments)), totalValueSent);
    assertEq(odisPayments.totalPaidCUSD(odisPaymentReceiver), totalValueSent);
  }

  function test_ShouldAllowSenderToMakeAPaymentOnTheirBehalf() public {
    vm.prank(sender);
    odisPayments.payInCUSD(sender, valueApprovedForTransfer);
    checkStatecUSD(sender, sender, valueApprovedForTransfer);
  }

  function test_ShouldAllowSenderToMakeAPaymentForAnotherAccount() public {
    vm.prank(sender);
    odisPayments.payInCUSD(receiver, valueApprovedForTransfer);
    checkStatecUSD(sender, receiver, valueApprovedForTransfer);
  }

  function test_ShouldAllowSenderToMakeMultiplePaymentToTheContract() public {
    uint256 valueForSecondTransfer = 5;
    uint256 valueForFirstTransfer = valueApprovedForTransfer - valueForSecondTransfer;

    vm.prank(sender);
    odisPayments.payInCUSD(sender, valueForFirstTransfer);
    checkStatecUSD(sender, sender, valueForFirstTransfer);

    vm.prank(sender);
    odisPayments.payInCUSD(sender, valueForSecondTransfer);
    checkStatecUSD(sender, sender, valueApprovedForTransfer);
  }

  function test_Emits_PaymentMadeEvent() public {
    vm.expectEmit(true, true, true, true);
    emit PaymentMade(receiver, valueApprovedForTransfer);

    vm.prank(sender);
    odisPayments.payInCUSD(receiver, valueApprovedForTransfer);
  }

  function test_ShouldRevertIfTransferFails() public {
    // OZ v4.x SafeERC20 bubbles up the token's own revert reason. The MockERC20
    // checks balance before allowance, so transferring more than the approved
    // amount (while the sender still has the funds) reverts on the allowance check.
    vm.expectRevert("MockERC20: insufficient allowance");
    vm.prank(sender);
    odisPayments.payInCUSD(sender, valueApprovedForTransfer + 1);

    assertEq(odisPayments.totalPaidCUSD(sender), 0);
  }
}

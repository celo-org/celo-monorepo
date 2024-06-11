// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/OdisPayments.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Freezer.sol";

contract OdisPaymentsFoundryTest is Test {
  uint256 FIXED1 = 1000000000000000000000000;
  uint256 SECONDS_IN_A_DAY = 60 * 60 * 24;
  uint256 startingBalanceCUSD = 1000;

  Registry registry;
  Freezer freezer;
  OdisPayments odisPayments;
  StableToken stableToken;

  address sender;
  address receiver;

  event PaymentMade(address indexed account, uint256 valueInCUSD);

  function setUp() public {
    address registryAddress = 0x000000000000000000000000000000000000ce10;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    registry = Registry(registryAddress);
    freezer = new Freezer(true);
    odisPayments = new OdisPayments(true);
    stableToken = new StableToken(true);

    sender = actor("sender");
    receiver = actor("receiver");

    odisPayments.initialize();
    registry.setAddressFor("StableToken", address(stableToken));

    address[] memory addresses = new address[](2);
    addresses[0] = address(this);
    addresses[1] = sender;

    uint256[] memory initBalances = new uint256[](2);
    initBalances[0] = startingBalanceCUSD;
    initBalances[1] = startingBalanceCUSD;

    stableToken.initialize(
      "Celo Dollar",
      "cUSD",
      18,
      address(registry),
      FIXED1,
      SECONDS_IN_A_DAY,
      // Initialize owner and sender with balances
      addresses,
      initBalances,
      "Exchange" // USD
    );

    freezer.initialize();
    registry.setAddressFor("Freezer", address(freezer));
  }
}

contract OdisPaymentsFoundryTest_Initialize is OdisPaymentsFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldHaveSetOwner() public {
    assertEq(odisPayments.owner(), address(this));
  }

  function test_ShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    odisPayments.initialize();
  }
}

contract OdisPaymentsFoundryTest_PayInCUSD is OdisPaymentsFoundryTest {
  uint256 valueApprovedForTransfer = 10;

  function setUp() public {
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
    vm.expectRevert("SafeERC20: low-level call failed");
    vm.prank(sender);
    odisPayments.payInCUSD(sender, valueApprovedForTransfer + 1);

    assertEq(odisPayments.totalPaidCUSD(sender), 0);
  }
}

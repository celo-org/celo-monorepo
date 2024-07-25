// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts/identity/OdisPayments.sol";
import "@celo-contracts-8/common/interfaces/IStableToken.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts-8/common/Freezer.sol";
import "@openzeppelin/contracts8/interfaces/IERC20.sol";

contract OdisPaymentsFoundryTest is Test {
  uint256 FIXED1 = 1000000000000000000000000;
  uint256 SECONDS_IN_A_DAY = 60 * 60 * 24;
  uint256 startingBalanceCUSD = 1000;

  IRegistry registry;
  Freezer freezer;
  OdisPayments odisPayments;
  IStableToken stableToken;

  address sender;
  address receiver;

  event PaymentMade(address indexed account, uint256 valueInCUSD);

  function setUp() public virtual {
    address registryAddress = 0x000000000000000000000000000000000000ce10;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    registry = IRegistry(registryAddress);
    freezer = new Freezer(true);
    odisPayments = new OdisPayments(true);

    address stableTokenAddress = actor("stableToken");
    deployCodeTo("StableToken.sol", abi.encode(true), stableTokenAddress);
    stableToken = IStableToken(stableTokenAddress);

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
  function setUp() public override {
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

  function setUp() public override {
    super.setUp();

    vm.prank(sender);
    IERC20(address(stableToken)).approve(address(odisPayments), valueApprovedForTransfer);

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
    vm.expectRevert("transfer value exceeded sender's allowance for recipient");
    vm.prank(sender);
    odisPayments.payInCUSD(sender, valueApprovedForTransfer + 1);

    assertEq(odisPayments.totalPaidCUSD(sender), 0);
  }
}

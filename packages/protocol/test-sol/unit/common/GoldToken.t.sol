// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { IGoldTokenTest } from "@test-sol/unit/common/interfaces/IGoldTokenTest.sol";

contract CeloTokenTest is TestWithUtils08 {
  // Named goldToken to avoid shadowing the inherited MockCeloToken08 `celoToken`
  // from TestWithUtils08; this is the real GoldToken under test.
  IGoldTokenTest goldToken;

  uint256 constant ONE_CELOTOKEN = 1000000000000000000;
  address receiver;
  address sender;
  address randomAddress;
  address celoTokenOwner;
  address celoUnreleasedTreasuryAddress;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event TransferComment(string comment);

  function setUp() public virtual override {
    super.setUp();
    celoTokenOwner = actor("celoTokenOwner");
    celoUnreleasedTreasuryAddress = actor("celoUnreleasedTreasury");
    deployCodeTo("CeloUnreleasedTreasury.sol", abi.encode(false), celoUnreleasedTreasuryAddress);

    address celoTokenAddress = actor("goldToken");
    deployCodeTo("GoldToken.sol", abi.encode(true), celoTokenAddress);
    goldToken = IGoldTokenTest(celoTokenAddress);
    goldToken.setRegistry(REGISTRY_ADDRESS);
    registry.setAddressFor(CeloUnreleasedTreasuryContract, celoUnreleasedTreasuryAddress);
    receiver = actor("receiver");
    sender = actor("sender");
    randomAddress = actor("random");

    vm.deal(receiver, ONE_CELOTOKEN);
    vm.deal(sender, ONE_CELOTOKEN);
    vm.deal(randomAddress, L1_MINTED_CELO_SUPPLY - (2 * ONE_CELOTOKEN)); // Increases balance.
    vm.deal(celoUnreleasedTreasuryAddress, L2_INITIAL_STASH_BALANCE);

    // This step is required, as `vm.prank` funds the address,
    // and causes a safeMath overflow when getting the circulating supply.
    vm.deal(address(0), 0);
    whenL2WithEpochManagerInitialization();
  }
}

contract CeloTokenTest_general is CeloTokenTest {
  function test_name() public {
    assertEq(goldToken.name(), "Celo native asset");
  }

  function test_symbol() public {
    assertEq(goldToken.symbol(), "CELO");
  }

  function test_decimals() public {
    assertEq(uint256(goldToken.decimals()), 18);
  }

  function test_balanceOf() public {
    assertEq(goldToken.balanceOf(receiver), receiver.balance);
  }

  function test_approve() public {
    vm.prank(sender);
    goldToken.approve(receiver, ONE_CELOTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_CELOTOKEN);
  }

  function test_increaseAllowance() public {
    vm.prank(sender);
    goldToken.increaseAllowance(receiver, ONE_CELOTOKEN);
    vm.prank(sender);
    goldToken.increaseAllowance(receiver, ONE_CELOTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_CELOTOKEN * 2);
  }

  function test_decreaseAllowance() public {
    vm.prank(sender);
    goldToken.approve(receiver, ONE_CELOTOKEN * 2);
    vm.prank(sender);
    goldToken.decreaseAllowance(receiver, ONE_CELOTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_CELOTOKEN);
  }

  function test_allowance() public {
    vm.prank(sender);
    goldToken.approve(receiver, ONE_CELOTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_transfer is CeloTokenTest {
  function setUp() public override {
    super.setUp();
  }

  function test_ShouldTransferBalanceFromOneUserToAnother() public {
    uint256 startBalanceFrom = goldToken.balanceOf(sender);
    uint256 startBalanceTo = goldToken.balanceOf(receiver);
    vm.prank(sender);
    goldToken.transfer(receiver, ONE_CELOTOKEN);
    assertEq(sender.balance, startBalanceFrom - ONE_CELOTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_CELOTOKEN);
  }

  function test_ShouldTransferBalanceWithAComment() public {
    string memory comment = "tacos at lunch";
    uint256 startBalanceFrom = goldToken.balanceOf(sender);
    uint256 startBalanceTo = goldToken.balanceOf(receiver);
    vm.prank(sender);
    vm.expectEmit(true, true, true, true);
    emit Transfer(sender, receiver, ONE_CELOTOKEN);
    vm.expectEmit(true, true, true, true);
    emit TransferComment(comment);
    goldToken.transferWithComment(receiver, ONE_CELOTOKEN, comment);
    assertEq(sender.balance, startBalanceFrom - ONE_CELOTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_CELOTOKEN);
  }

  function test_ShouldNotAllowToTransferToNullAddress() public {
    vm.prank(sender);
    vm.expectRevert();
    goldToken.transfer(address(0), ONE_CELOTOKEN);
  }

  function test_Succeeds_whenTransferingToCeloUnreleasedTreasury() public {
    vm.prank(sender);
    uint256 balanceBefore = goldToken.balanceOf(celoUnreleasedTreasuryAddress);

    goldToken.transfer(celoUnreleasedTreasuryAddress, ONE_CELOTOKEN);
    uint256 balanceAfter = goldToken.balanceOf(celoUnreleasedTreasuryAddress);
    assertGt(balanceAfter, balanceBefore);
  }

  function test_FailsWhenNativeTransferingToCeloUnreleasedTreasury() public payable {
    (bool success, ) = payable(celoUnreleasedTreasuryAddress).call{ value: ONE_CELOTOKEN }("");

    assertFalse(success);

    bool sent = payable(celoUnreleasedTreasuryAddress).send(ONE_CELOTOKEN);
    assertFalse(sent);
  }
}

contract CeloTokenTest_transferFrom is CeloTokenTest {
  function setUp() public override {
    super.setUp();
    vm.prank(sender);
    goldToken.approve(receiver, ONE_CELOTOKEN);
  }

  function test_ShouldTransferBalanceFromOneUserToAnother() public {
    uint256 startBalanceFrom = goldToken.balanceOf(sender);
    uint256 startBalanceTo = goldToken.balanceOf(receiver);
    vm.prank(receiver);
    goldToken.transferFrom(sender, receiver, ONE_CELOTOKEN);
    assertEq(sender.balance, startBalanceFrom - ONE_CELOTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_CELOTOKEN);
  }

  function test_Reverts_WhenTransferToNullAddress() public {
    vm.prank(receiver);
    vm.expectRevert();
    goldToken.transferFrom(sender, address(0), ONE_CELOTOKEN);
  }

  function test_Succeeds_whenTransferingToCeloUnreleasedTreasury() public {
    uint256 balanceBefore = goldToken.balanceOf(celoUnreleasedTreasuryAddress);
    vm.prank(receiver);
    goldToken.transferFrom(sender, celoUnreleasedTreasuryAddress, ONE_CELOTOKEN);
    uint256 balanceAfter = goldToken.balanceOf(celoUnreleasedTreasuryAddress);
    assertGt(balanceAfter, balanceBefore);
  }

  function test_Reverts_WhenTransferMoreThanSenderHas() public {
    uint256 value = sender.balance + ONE_CELOTOKEN * 4;

    vm.prank(receiver);
    vm.expectRevert();
    goldToken.transferFrom(sender, receiver, value);
  }

  function test_Reverts_WhenTransferringMoreThanTheSpenderIsAllowed() public {
    vm.prank(receiver);
    vm.expectRevert();
    goldToken.transferFrom(sender, receiver, ONE_CELOTOKEN + 1);
  }
}

contract CeloTokenTest_burn is CeloTokenTest {
  uint256 startBurn;
  address burnAddress = address(0x000000000000000000000000000000000000dEaD);

  function setUp() public override {
    super.setUp();
    startBurn = goldToken.getBurnedAmount();
  }

  function test_burn_address_starts_with_zero_balance() public {
    assertEq(goldToken.balanceOf(burnAddress), 0);
  }

  function test_burn_starts_as_start_burn_amount() public {
    assertEq(goldToken.getBurnedAmount(), startBurn);
  }

  function test_burn_amount_eq_the_balance_of_the_burn_address() public {
    assertEq(goldToken.getBurnedAmount(), goldToken.balanceOf(burnAddress));
  }

  function test_returns_right_burn_amount() public {
    goldToken.burn(ONE_CELOTOKEN);
    assertEq(goldToken.getBurnedAmount(), ONE_CELOTOKEN + startBurn);
  }
}

contract CeloTokenTest_AllocatedSupply is CeloTokenTest {
  function test_ShouldReturnTotalSupplyMinusCeloUnreleasedTreasuryBalance() public {
    assertEq(goldToken.allocatedSupply(), CELO_SUPPLY_CAP - L2_INITIAL_STASH_BALANCE);
    assertEq(goldToken.allocatedSupply(), goldToken.totalSupply() - L2_INITIAL_STASH_BALANCE);
  }

  function test_ShouldReturnTotalSupplyWhenCeloUnreleasedTreasuryHasReleasedAllBalance() public {
    deal(celoUnreleasedTreasuryAddress, 0);
    assertEq(goldToken.allocatedSupply(), goldToken.totalSupply());
  }
}

contract CeloTokenTest_TotalSupply is CeloTokenTest {
  function test_ShouldReturnSupplyCap() public {
    assertEq(goldToken.totalSupply(), CELO_SUPPLY_CAP);
  }
}

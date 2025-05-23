// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "@celo-contracts/common/GoldToken.sol";

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";
import "@test-sol/utils/WhenL2.sol";

contract CeloTokenTest is TestWithUtils {
  GoldToken celoToken;

  uint256 constant ONE_CELOTOKEN = 1000000000000000000;
  address receiver;
  address sender;
  address randomAddress;
  address celoTokenOwner;
  address celoUnreleasedTreasuryAddress;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event TransferComment(string comment);

  function setUp() public {
    super.setUp();
    celoTokenOwner = actor("celoTokenOwner");
    celoUnreleasedTreasuryAddress = actor("celoUnreleasedTreasury");
    deployCodeTo("CeloUnreleasedTreasury.sol", abi.encode(false), celoUnreleasedTreasuryAddress);

    vm.prank(celoTokenOwner);
    celoToken = new GoldToken(true);
    vm.prank(celoTokenOwner);
    celoToken.setRegistry(REGISTRY_ADDRESS);
    registry.setAddressFor(CeloUnreleasedTreasuryContract, celoUnreleasedTreasuryAddress);
    receiver = actor("receiver");
    sender = actor("sender");
    randomAddress = actor("random");

    vm.prank(address(0));
    celoToken.mint(receiver, ONE_CELOTOKEN); // Increase total supply.
    vm.prank(address(0));
    celoToken.mint(sender, ONE_CELOTOKEN);
    vm.prank(address(0));
    celoToken.mint(randomAddress, L1_MINTED_CELO_SUPPLY - (2 * ONE_CELOTOKEN)); // Increase total supply.

    vm.deal(receiver, ONE_CELOTOKEN);
    vm.deal(sender, ONE_CELOTOKEN);
    vm.deal(randomAddress, L1_MINTED_CELO_SUPPLY - (2 * ONE_CELOTOKEN)); // Increases balance.

    // This step is required, as `vm.prank` funds the address,
    // and causes a safeMath overflow when getting the circulating supply.
    vm.deal(address(0), 0);
  }
}

contract CeloTokenTest_PreL2 is CeloTokenTest {
  function setUp() public {
    super.setUp();

    vm.prank(address(0));
    celoToken.mint(celoUnreleasedTreasuryAddress, L2_INITIAL_STASH_BALANCE);
    vm.deal(celoUnreleasedTreasuryAddress, L2_INITIAL_STASH_BALANCE);

    vm.deal(address(0), 0);
  }
}
contract CeloTokenTest_L2 is CeloTokenTest_PreL2, WhenL2 {}

contract CeloTokenTest_general is CeloTokenTest {
  function test_name() public {
    assertEq(celoToken.name(), "Celo native asset");
  }

  function test_symbol() public {
    assertEq(celoToken.symbol(), "CELO");
  }

  function test_decimals() public {
    assertEq(uint256(celoToken.decimals()), 18);
  }

  function test_balanceOf() public {
    assertEq(celoToken.balanceOf(receiver), receiver.balance);
  }

  function test_approve() public {
    vm.prank(sender);
    celoToken.approve(receiver, ONE_CELOTOKEN);
    assertEq(celoToken.allowance(sender, receiver), ONE_CELOTOKEN);
  }

  function test_increaseAllowance() public {
    vm.prank(sender);
    celoToken.increaseAllowance(receiver, ONE_CELOTOKEN);
    vm.prank(sender);
    celoToken.increaseAllowance(receiver, ONE_CELOTOKEN);
    assertEq(celoToken.allowance(sender, receiver), ONE_CELOTOKEN * 2);
  }

  function test_decreaseAllowance() public {
    vm.prank(sender);
    celoToken.approve(receiver, ONE_CELOTOKEN * 2);
    vm.prank(sender);
    celoToken.decreaseAllowance(receiver, ONE_CELOTOKEN);
    assertEq(celoToken.allowance(sender, receiver), ONE_CELOTOKEN);
  }

  function test_allowance() public {
    vm.prank(sender);
    celoToken.approve(receiver, ONE_CELOTOKEN);
    assertEq(celoToken.allowance(sender, receiver), ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_general_L2 is CeloTokenTest_L2, CeloTokenTest_general {}

contract CeloTokenTest_transfer is CeloTokenTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldTransferBalanceFromOneUserToAnother() public {
    uint256 startBalanceFrom = celoToken.balanceOf(sender);
    uint256 startBalanceTo = celoToken.balanceOf(receiver);
    vm.prank(sender);
    celoToken.transfer(receiver, ONE_CELOTOKEN);
    assertEq(sender.balance, startBalanceFrom - ONE_CELOTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_CELOTOKEN);
  }

  function test_ShouldTransferBalanceWithAComment() public {
    string memory comment = "tacos at lunch";
    uint256 startBalanceFrom = celoToken.balanceOf(sender);
    uint256 startBalanceTo = celoToken.balanceOf(receiver);
    vm.prank(sender);
    vm.expectEmit(true, true, true, true);
    emit Transfer(sender, receiver, ONE_CELOTOKEN);
    vm.expectEmit(true, true, true, true);
    emit TransferComment(comment);
    celoToken.transferWithComment(receiver, ONE_CELOTOKEN, comment);
    assertEq(sender.balance, startBalanceFrom - ONE_CELOTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_CELOTOKEN);
  }

  function test_ShouldNotAllowToTransferToNullAddress() public {
    vm.prank(sender);
    vm.expectRevert();
    celoToken.transfer(address(0), ONE_CELOTOKEN);
  }

  function test_Succeeds_whenTransferingToCeloUnreleasedTreasury() public {
    vm.prank(sender);
    uint256 balanceBefore = celoToken.balanceOf(celoUnreleasedTreasuryAddress);

    celoToken.transfer(celoUnreleasedTreasuryAddress, ONE_CELOTOKEN);
    uint256 balanceAfter = celoToken.balanceOf(celoUnreleasedTreasuryAddress);
    assertGt(balanceAfter, balanceBefore);
  }

  function test_FailsWhenNativeTransferingToCeloUnreleasedTreasury() public payable {
    (bool success, ) = address(uint160(celoUnreleasedTreasuryAddress)).call.value(ONE_CELOTOKEN)(
      ""
    );

    assertFalse(success);

    bool sent = address(uint160(celoUnreleasedTreasuryAddress)).send(ONE_CELOTOKEN);
    assertFalse(sent);
  }
}

contract CeloTokenTest_transfer_L2 is CeloTokenTest_L2, CeloTokenTest_transfer {}

contract CeloTokenTest_transferFrom is CeloTokenTest {
  function setUp() public {
    super.setUp();
    vm.prank(sender);
    celoToken.approve(receiver, ONE_CELOTOKEN);
  }

  function test_ShouldTransferBalanceFromOneUserToAnother() public {
    uint256 startBalanceFrom = celoToken.balanceOf(sender);
    uint256 startBalanceTo = celoToken.balanceOf(receiver);
    vm.prank(receiver);
    celoToken.transferFrom(sender, receiver, ONE_CELOTOKEN);
    assertEq(sender.balance, startBalanceFrom - ONE_CELOTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_CELOTOKEN);
  }

  function test_Reverts_WhenTransferToNullAddress() public {
    vm.prank(receiver);
    vm.expectRevert();
    celoToken.transferFrom(sender, address(0), ONE_CELOTOKEN);
  }

  function test_Succeeds_whenTransferingToCeloUnreleasedTreasury() public {
    uint256 balanceBefore = celoToken.balanceOf(celoUnreleasedTreasuryAddress);
    vm.prank(receiver);
    celoToken.transferFrom(sender, celoUnreleasedTreasuryAddress, ONE_CELOTOKEN);
    uint256 balanceAfter = celoToken.balanceOf(celoUnreleasedTreasuryAddress);
    assertGt(balanceAfter, balanceBefore);
  }

  function test_Reverts_WhenTransferMoreThanSenderHas() public {
    uint256 value = sender.balance + ONE_CELOTOKEN * 4;

    vm.prank(receiver);
    vm.expectRevert();
    celoToken.transferFrom(sender, receiver, value);
  }

  function test_Reverts_WhenTransferringMoreThanTheSpenderIsAllowed() public {
    vm.prank(receiver);
    vm.expectRevert();
    celoToken.transferFrom(sender, receiver, ONE_CELOTOKEN + 1);
  }
}

contract CeloTokenTest_transferFrom_L2 is CeloTokenTest_L2, CeloTokenTest_transferFrom {}

contract CeloTokenTest_burn is CeloTokenTest {
  uint256 startBurn;
  address burnAddress = address(0x000000000000000000000000000000000000dEaD);

  function setUp() public {
    super.setUp();
    startBurn = celoToken.getBurnedAmount();
  }

  function test_burn_address_starts_with_zero_balance() public {
    assertEq(celoToken.balanceOf(burnAddress), 0);
  }

  function test_burn_starts_as_start_burn_amount() public {
    assertEq(celoToken.getBurnedAmount(), startBurn);
  }

  function test_burn_amount_eq_the_balance_of_the_burn_address() public {
    assertEq(celoToken.getBurnedAmount(), celoToken.balanceOf(burnAddress));
  }

  function test_returns_right_burn_amount() public {
    celoToken.burn(ONE_CELOTOKEN);
    assertEq(celoToken.getBurnedAmount(), ONE_CELOTOKEN + startBurn);
  }
}

contract CeloTokenTest_burn_L2 is CeloTokenTest_L2, CeloTokenTest_burn {}

contract CeloTokenTest_mint is CeloTokenTest {
  function test_Reverts_whenCalledByOtherThanVm() public {
    vm.prank(celoTokenOwner);
    vm.expectRevert("Only VM can call");
    celoToken.mint(receiver, ONE_CELOTOKEN);

    vm.prank(celoUnreleasedTreasuryAddress);
    vm.expectRevert("Only VM can call");
    celoToken.mint(receiver, ONE_CELOTOKEN);
  }

  function test_Should_increaseCeloTokenTotalSupplyWhencalledByVm() public {
    uint256 celoTokenSupplyBefore = celoToken.totalSupply();
    vm.prank(address(0));
    celoToken.mint(receiver, ONE_CELOTOKEN);
    uint256 celoTokenSupplyAfter = celoToken.totalSupply();
    assertGt(celoTokenSupplyAfter, celoTokenSupplyBefore);
  }

  function test_Emits_TransferEvent() public {
    vm.prank(address(0));
    vm.expectEmit(true, true, true, true);
    emit Transfer(address(0), receiver, ONE_CELOTOKEN);
    celoToken.mint(receiver, ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_mint_L2 is CeloTokenTest_L2 {
  function test_Reverts_whenL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    vm.prank(celoUnreleasedTreasuryAddress);
    celoToken.mint(receiver, ONE_CELOTOKEN);
    vm.expectRevert("This method is no longer supported in L2.");
    vm.prank(address(0));
    celoToken.mint(receiver, ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_increaseSupply is CeloTokenTest {
  function test_ShouldIncreaseTotalSupply() public {
    uint256 celoTokenSupplyBefore = celoToken.totalSupply();
    vm.prank(address(0));
    celoToken.increaseSupply(ONE_CELOTOKEN);
    uint256 celoTokenSupplyAfter = celoToken.totalSupply();
    assertGt(celoTokenSupplyAfter, celoTokenSupplyBefore);
  }

  function test_Reverts_WhenCalledByOtherThanVm() public {
    vm.prank(celoTokenOwner);
    vm.expectRevert("Only VM can call");
    celoToken.increaseSupply(ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_increaseSupply_L2 is CeloTokenTest_L2 {
  function test_Reverts_WhenL2() public {
    vm.prank(celoTokenOwner);
    vm.expectRevert("This method is no longer supported in L2.");
    celoToken.increaseSupply(ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_circulatingSupply is CeloTokenTest {
  function test_ShouldMatchCirculatingSupply_WhenNoBurn() public {
    assertEq(celoToken.circulatingSupply(), celoToken.allocatedSupply());
    assertEq(celoToken.circulatingSupply(), L1_MINTED_CELO_SUPPLY);
  }

  function test_ShouldDecreaseCirculatingSupply_WhenThereWasBurn() public {
    vm.prank(randomAddress);
    celoToken.burn(ONE_CELOTOKEN);
    assertEq(celoToken.circulatingSupply(), L1_MINTED_CELO_SUPPLY - ONE_CELOTOKEN);
    assertEq(celoToken.circulatingSupply(), celoToken.allocatedSupply() - ONE_CELOTOKEN);
  }
}

contract CeloTokenTest_circulatingSupply_L2 is CeloTokenTest_L2, CeloTokenTest_circulatingSupply {
  function test_ShouldBeLessThanTheTotalSupply() public {
    assertLt(celoToken.circulatingSupply(), celoToken.totalSupply());
  }
}

contract CeloTokenTest_AllocatedSupply is CeloTokenTest {
  function test_ShouldReturnTotalSupply() public {
    assertEq(celoToken.allocatedSupply(), L1_MINTED_CELO_SUPPLY);
    assertEq(celoToken.allocatedSupply(), celoToken.totalSupply());
  }
}

contract CeloTokenTest_AllocatedSupply_L2 is CeloTokenTest_L2 {
  function test_ShouldReturnTotalSupplyMinusCeloUnreleasedTreasuryBalance() public {
    assertEq(celoToken.allocatedSupply(), CELO_SUPPLY_CAP - L2_INITIAL_STASH_BALANCE);
    assertEq(celoToken.allocatedSupply(), celoToken.totalSupply() - L2_INITIAL_STASH_BALANCE);
  }

  function test_ShouldReturnTotalSupplyWhenCeloUnreleasedTreasuryHasReleasedAllBalance() public {
    deal(celoUnreleasedTreasuryAddress, 0);
    assertEq(celoToken.allocatedSupply(), celoToken.totalSupply());
  }
}

contract CeloTokenTest_TotalSupply is CeloTokenTest {
  function test_ShouldReturnL1MintedSupply() public {
    assertEq(celoToken.totalSupply(), L1_MINTED_CELO_SUPPLY);
  }
}

contract CeloTokenTest_TotalSupply_L2 is CeloTokenTest_L2 {
  function test_ShouldReturnSupplyCap_WhenL2() public {
    assertEq(celoToken.totalSupply(), CELO_SUPPLY_CAP);
  }
}

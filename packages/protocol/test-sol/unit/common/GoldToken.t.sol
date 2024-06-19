// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@test-sol/unit/common/GoldTokenMock.sol";

contract GoldTokenTest is Test, IsL2Check {
  GoldToken celoToken;

  uint256 constant ONE_CELOTOKEN = 1000000000000000000;
  address receiver;
  address sender;
  address celoTokenOwner;
  address celoTokenDistributionSchedule;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event TransferComment(string comment);
  event SetCeloTokenDistributionScheduleAddress(address indexed newScheduleAddress);

  modifier _whenL2() {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
    _;
  }

  function setUp() public {
    celoTokenOwner = actor("celoTokenOwner");
    celoTokenDistributionSchedule = actor("celoTokenDistributionSchedule");
    vm.prank(celoTokenOwner);
    celoToken = new GoldToken(true);
    deployCodeTo("MintGoldSchedule.sol", abi.encode(false), celoTokenDistributionSchedule);
    receiver = actor("receiver");
    sender = actor("sender");
    vm.deal(receiver, ONE_CELOTOKEN);
    vm.deal(sender, ONE_CELOTOKEN);
  }
}

contract GoldTokenTest_general is GoldTokenTest {
  function setUp() public {
    super.setUp();
  }

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

contract GoldTokenTest_transfer is GoldTokenTest {
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
}

contract GoldTokenTest_transferFrom is GoldTokenTest {
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

  function test_ShouldNotAllowToTransferToNullAddress() public {
    vm.prank(receiver);
    vm.expectRevert();
    celoToken.transferFrom(sender, address(0), ONE_CELOTOKEN);
  }

  function test_ShouldNotAllowTransferMoreThanSenderHas() public {
    uint256 value = sender.balance + ONE_CELOTOKEN * 4;

    vm.prank(receiver);
    vm.expectRevert();
    celoToken.transferFrom(sender, receiver, value);
  }

  function test_ShouldNotAllowTransferringMoreThanTheSpenderIsAllowed() public {
    vm.prank(receiver);
    vm.expectRevert();
    celoToken.transferFrom(sender, receiver, ONE_CELOTOKEN + 1);
  }
}

contract GoldTokenTest_burn is GoldTokenTest {
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

contract GoldTokenTest_mint is GoldTokenTest {
  function test_Reverts_whenCalledByOtherThanVm() public {
    vm.prank(celoTokenOwner);
    vm.expectRevert("Only VM can call");
    celoToken.mint(receiver, ONE_CELOTOKEN);

    vm.prank(celoTokenDistributionSchedule);
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

  function test_Reverts_whenL2() public _whenL2 {
    vm.expectRevert("This method is no longer supported in L2.");
    vm.prank(celoTokenDistributionSchedule);
    celoToken.mint(receiver, ONE_CELOTOKEN);
    vm.expectRevert("This method is no longer supported in L2.");
    vm.prank(address(0));
    celoToken.mint(receiver, ONE_CELOTOKEN);
  }
}

contract GoldTokenTest_setCeloTokenDistributionScheduleAddress is GoldTokenTest {
  function test_Reverts_whenCalledByOtherThanL2Governance() public _whenL2 {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(0));
    celoToken.setCeloTokenDistributionScheduleAddress(celoTokenDistributionSchedule);
  }

  function test_ShouldSucceedWhenCalledByOwner() public {
    vm.prank(celoTokenOwner);
    celoToken.setCeloTokenDistributionScheduleAddress(celoTokenDistributionSchedule);

    assertEq(address(celoToken.celoTokenDistributionSchedule()), celoTokenDistributionSchedule);
  }

  function test_ShouldSucceedWhenCalledByL2Governance() public _whenL2 {
    vm.prank(celoTokenOwner);
    celoToken.setCeloTokenDistributionScheduleAddress(celoTokenDistributionSchedule);

    assertEq(address(celoToken.celoTokenDistributionSchedule()), celoTokenDistributionSchedule);
  }

  function test_Emits_SetCeloTokenDistributionScheduleAddressEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SetCeloTokenDistributionScheduleAddress(celoTokenDistributionSchedule);
    vm.prank(celoTokenOwner);
    celoToken.setCeloTokenDistributionScheduleAddress(celoTokenDistributionSchedule);
  }
}

contract GoldTokenTest_increaseSupply is GoldTokenTest {
  function test_ShouldIncreaseTotalSupply() public {
    uint256 celoTokenSupplyBefore = celoToken.totalSupply();
    vm.prank(address(0));
    celoToken.increaseSupply(ONE_CELOTOKEN);
    uint256 celoTokenSupplyAfter = celoToken.totalSupply();
    assertGt(celoTokenSupplyAfter, celoTokenSupplyBefore);
  }

  function test_Reverts_WhenCalledByOtherThanVm() public {
    vm.prank(celoTokenOwner);
    vm.expectRevert("Only VM can call.");
    celoToken.increaseSupply(ONE_CELOTOKEN);
    vm.prank(celoTokenDistributionSchedule);
    vm.expectRevert("Only VM can call.");
    celoToken.increaseSupply(ONE_CELOTOKEN);
  }
}

contract GoldTokenTest_increaseSupply_L2 is GoldTokenTest {
  function setUp() public _whenL2 {
    super.setUp();
    vm.prank(celoTokenOwner);
    celoToken.setCeloTokenDistributionScheduleAddress(celoTokenDistributionSchedule);
  }

  function test_ShouldIncreaseTotalSupply() public {
    uint256 celoTokenSupplyBefore = celoToken.totalSupply();
    vm.prank(address(celoTokenDistributionSchedule));
    celoToken.increaseSupply(ONE_CELOTOKEN);
    uint256 celoTokenSupplyAfter = celoToken.totalSupply();
    assertGt(celoTokenSupplyAfter, celoTokenSupplyBefore);
  }

  function test_Reverts_WhenCalledByOtherThanSchedule() public {
    vm.prank(address(0));
    vm.expectRevert("Only CeloDistributionSchedule can call.");
    celoToken.increaseSupply(ONE_CELOTOKEN);
    vm.prank(celoTokenOwner);
    vm.expectRevert("Only CeloDistributionSchedule can call.");
    celoToken.increaseSupply(ONE_CELOTOKEN);
  }

  function test_ShouldNotIncreaseTotalSupply() public {
    uint256 celoTokenSupplyBefore = celoToken.totalSupply();
    vm.expectRevert("Only CeloDistributionSchedule can call.");
    vm.prank(celoTokenOwner);
    celoToken.increaseSupply(ONE_CELOTOKEN);

    uint256 celoTokenSupplyAfter = celoToken.totalSupply();
    assertEq(celoTokenSupplyAfter, celoTokenSupplyBefore);
  }
}

contract CeloTokenMockTest is Test {
  GoldTokenMock mockCeloToken;
  uint256 ONE_CELOTOKEN = 1000000000000000000;
  address burnAddress = address(0x000000000000000000000000000000000000dEaD);

  function setUp() public {
    mockCeloToken = new GoldTokenMock();
    mockCeloToken.setTotalSupply(ONE_CELOTOKEN * 1000);
  }
}

contract CeloTokenMock_circulatingSupply is CeloTokenMockTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldMatchCirculationSupply_WhenNoBurn() public {
    assertEq(mockCeloToken.circulatingSupply(), mockCeloToken.totalSupply());
  }

  function test_ShouldDecreaseCirculatingSupply_WhenThereWasBurn() public {
    mockCeloToken.setBalanceOf(burnAddress, ONE_CELOTOKEN);
    assertEq(mockCeloToken.circulatingSupply(), ONE_CELOTOKEN * 999);
    assertEq(mockCeloToken.circulatingSupply(), mockCeloToken.totalSupply() - ONE_CELOTOKEN);
  }
}

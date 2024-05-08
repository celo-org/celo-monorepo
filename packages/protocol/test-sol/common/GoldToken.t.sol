// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts/common/MintGoldSchedule.sol";
import "./GoldTokenMock.sol";

contract GoldTokenTest is Test, IsL2Check {
  GoldToken goldToken;
  MintGoldSchedule goldTokenMintingSchedule;

  uint256 constant ONE_GOLDTOKEN = 1000000000000000000;
  uint256 constant TWO_GOLDTOKEN = 2000000000000000000;
  uint256 constant THREE_GOLDTOKEN = 3000000000000000000;

  address receiver;
  address sender;
  address goldTokenOwner;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event TransferComment(string comment);

  modifier _whenL2() {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
    _;
  }

  function setUp() public {
    goldTokenOwner = actor("goldTokenOwner");
    vm.prank(goldTokenOwner);
    goldToken = new GoldToken(true);
    goldTokenMintingSchedule = new MintGoldSchedule(true);

    receiver = actor("receiver");
    sender = actor("sender");

    vm.deal(receiver, ONE_GOLDTOKEN);
    vm.deal(sender, ONE_GOLDTOKEN);

    if (isL1()) {
      vm.prank(address(0));
      goldToken.increaseSupply(TWO_GOLDTOKEN);
    } else {
      vm.prank(goldTokenOwner);
      goldToken.increaseSupply(TWO_GOLDTOKEN);
    }
  }
}

contract GoldTokenTest_General is GoldTokenTest {
  function setUp() public {
    super.setUp();
  }

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
    goldToken.approve(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_GOLDTOKEN);
  }

  function test_increaseAllowance() public {
    vm.prank(sender);
    goldToken.increaseAllowance(receiver, ONE_GOLDTOKEN);
    vm.prank(sender);
    goldToken.increaseAllowance(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_GOLDTOKEN * 2);
  }

  function test_decreaseAllowance() public {
    vm.prank(sender);
    goldToken.approve(receiver, ONE_GOLDTOKEN * 2);
    vm.prank(sender);
    goldToken.decreaseAllowance(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_GOLDTOKEN);
  }

  function test_allowance() public {
    vm.prank(sender);
    goldToken.approve(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.allowance(sender, receiver), ONE_GOLDTOKEN);
  }
}

contract GoldTokenTest_transfer is GoldTokenTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldTransferBalanceFromOneUserToAnother() public {
    uint256 startBalanceFrom = goldToken.balanceOf(sender);
    uint256 startBalanceTo = goldToken.balanceOf(receiver);
    vm.prank(sender);
    goldToken.transfer(receiver, ONE_GOLDTOKEN);
    assertEq(sender.balance, startBalanceFrom - ONE_GOLDTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_GOLDTOKEN);
  }

  function test_ShouldTransferBalanceWithAComment() public {
    string memory comment = "tacos at lunch";
    uint256 startBalanceFrom = goldToken.balanceOf(sender);
    uint256 startBalanceTo = goldToken.balanceOf(receiver);
    vm.prank(sender);
    vm.expectEmit(true, true, true, true);
    emit Transfer(sender, receiver, ONE_GOLDTOKEN);
    vm.expectEmit(true, true, true, true);
    emit TransferComment(comment);
    goldToken.transferWithComment(receiver, ONE_GOLDTOKEN, comment);
    assertEq(sender.balance, startBalanceFrom - ONE_GOLDTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_GOLDTOKEN);
  }

  function test_ShouldNotAllowToTransferToNullAddress() public {
    vm.prank(sender);
    vm.expectRevert();
    goldToken.transfer(address(0), ONE_GOLDTOKEN);
  }
}

contract GoldTokenTest_transferFrom is GoldTokenTest {
  function setUp() public {
    super.setUp();
    vm.prank(sender);
    goldToken.approve(receiver, ONE_GOLDTOKEN);
  }

  function test_ShouldTransferBalanceFromOneUserToAnother() public {
    uint256 startBalanceFrom = goldToken.balanceOf(sender);
    uint256 startBalanceTo = goldToken.balanceOf(receiver);
    vm.prank(receiver);
    goldToken.transferFrom(sender, receiver, ONE_GOLDTOKEN);
    assertEq(sender.balance, startBalanceFrom - ONE_GOLDTOKEN);
    assertEq(receiver.balance, startBalanceTo + ONE_GOLDTOKEN);
  }

  function test_ShouldNotAllowToTransferToNullAddress() public {
    vm.prank(receiver);
    vm.expectRevert();
    goldToken.transferFrom(sender, address(0), ONE_GOLDTOKEN);
  }

  function test_ShouldNotAllowTransferMoreThanSenderHas() public {
    uint256 value = sender.balance + ONE_GOLDTOKEN * 4;

    vm.prank(receiver);
    vm.expectRevert();
    goldToken.transferFrom(sender, receiver, value);
  }

  function test_ShouldNotAllowTransferringMoreThanTheSpenderIsAllowed() public {
    vm.prank(receiver);
    vm.expectRevert();
    goldToken.transferFrom(sender, receiver, ONE_GOLDTOKEN + 1);
  }
}

contract GoldTokenTest_burn is GoldTokenTest {
  uint256 startBurn;
  address burnAddress = address(0x000000000000000000000000000000000000dEaD);

  function setUp() public {
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
    goldToken.burn(ONE_GOLDTOKEN);
    assertEq(goldToken.getBurnedAmount(), ONE_GOLDTOKEN + startBurn);
  }
}

contract GoldTokenTest_mint is GoldTokenTest {
  function test_Reverts_whenCalledByOtherThanVm() public {
    vm.prank(goldTokenOwner);
    vm.expectRevert("Only VM can call");
    goldToken.mint(receiver, ONE_GOLDTOKEN);
  }

  function test_Should_increaseGoldTokenTotalSupplyWhencalledByVm() public {
    vm.prank(address(0));
    goldToken.mint(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.totalSupply(), THREE_GOLDTOKEN);
  }

  function test_Emits_TransferEvent() public {
    vm.prank(address(0));
    vm.expectEmit(true, true, true, true);
    emit Transfer(address(0), receiver, ONE_GOLDTOKEN);
    goldToken.mint(receiver, ONE_GOLDTOKEN);
  }
}

contract GoldTokenTest_mint_l2 is GoldTokenTest {
  function setUp() public _whenL2 {
    super.setUp();
    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(goldTokenMintingSchedule));
  }

  function test_Reverts_whenCalledByOtherThanL2Governance() public {
    vm.prank(address(0));

    vm.expectRevert("Only owner or goldTokenMintingSchedule can call");
    goldToken.mint(receiver, ONE_GOLDTOKEN);
  }

  function test_Should_increaseGoldTokenTotalSupply() public {
    vm.prank(goldTokenOwner);
    goldToken.mint(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.totalSupply(), THREE_GOLDTOKEN);
  }

  function test_Should_increaseGoldTokenBalanceWhenMintedByL2GovernanceOrGoldTokenMintingSchedule()
    public
  {
    assertEq(goldToken.balanceOf(receiver), ONE_GOLDTOKEN);
    vm.prank(goldTokenOwner);
    goldToken.mint(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.balanceOf(receiver), TWO_GOLDTOKEN);

    vm.prank(address(goldTokenMintingSchedule));
    goldToken.mint(receiver, ONE_GOLDTOKEN);
    assertEq(goldToken.balanceOf(receiver), THREE_GOLDTOKEN);
  }

  function test_Emits_TransferEvent() public {
    vm.prank(goldTokenOwner);
    vm.expectEmit(true, true, true, true);
    emit Transfer(address(0), receiver, ONE_GOLDTOKEN);
    goldToken.mint(receiver, ONE_GOLDTOKEN);
  }
}

contract GoldTokenTest_setGoldTokenMintingScheduleAddress is GoldTokenTest {
  function test_Reverts_whenCalledByOtherThanL2Governance() public _whenL2 {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(0));
    goldToken.setGoldTokenMintingScheduleAddress(address(goldTokenMintingSchedule));
  }

  function test_ShouldSucceedWhenCalledByOwner() public {
    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(goldTokenMintingSchedule));

    assertEq(address(goldToken.goldTokenMintingSchedule()), address(goldTokenMintingSchedule));
  }
  function test_ShouldSucceedWhenCalledByL2Governance() public _whenL2 {
    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(goldTokenMintingSchedule));

    assertEq(address(goldToken.goldTokenMintingSchedule()), address(goldTokenMintingSchedule));
  }
}

contract GoldTokenTest_increaseSupply is GoldTokenTest {
  function test_ShouldIncreaseTotalSupply() public {
    assertEq(goldToken.totalSupply(), TWO_GOLDTOKEN);
    vm.prank(address(0));
    goldToken.increaseSupply(ONE_GOLDTOKEN);
    assertEq(goldToken.totalSupply(), THREE_GOLDTOKEN);
  }

  function test_Reverts_WhenCalledByOtherThanVm() public {
    assertEq(goldToken.totalSupply(), TWO_GOLDTOKEN);
    vm.prank(goldTokenOwner);
    vm.expectRevert("Only VM can call");
    goldToken.increaseSupply(ONE_GOLDTOKEN);
    vm.prank(address(goldTokenMintingSchedule));
    vm.expectRevert("Only VM can call");
    goldToken.increaseSupply(ONE_GOLDTOKEN);
  }
}

contract GoldTokenTest_increaseSupply_l2 is GoldTokenTest {
  function setUp() public _whenL2 {
    super.setUp();
    vm.prank(goldTokenOwner);
    goldToken.setGoldTokenMintingScheduleAddress(address(goldTokenMintingSchedule));
  }

  function test_Reverts_WhenCalledByOtherThanL2Governance() public {
    assertEq(goldToken.totalSupply(), TWO_GOLDTOKEN);
    vm.prank(address(0));
    vm.expectRevert("Only owner can call");
    goldToken.increaseSupply(ONE_GOLDTOKEN);
    vm.prank(address(goldTokenMintingSchedule));
    vm.expectRevert("Only owner can call");
    goldToken.increaseSupply(ONE_GOLDTOKEN);
  }

  function test_ShouldIncreaseTotalSupply() public {
    assertEq(goldToken.totalSupply(), TWO_GOLDTOKEN);
    vm.prank(goldTokenOwner);
    goldToken.increaseSupply(ONE_GOLDTOKEN);
    assertEq(goldToken.totalSupply(), THREE_GOLDTOKEN);
  }
}

contract GoldTokenMockTest is Test {
  GoldTokenMock mockGoldToken;
  uint256 ONE_GOLDTOKEN = 1000000000000000000;
  address burnAddress = address(0x000000000000000000000000000000000000dEaD);

  function setUp() public {
    mockGoldToken = new GoldTokenMock();
    mockGoldToken.setTotalSupply(ONE_GOLDTOKEN * 1000);
  }
}

contract GoldTokenMock_circulatingSupply is GoldTokenMockTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldMatchCirculationSupply_WhenNoBurn() public {
    assertEq(mockGoldToken.circulatingSupply(), mockGoldToken.totalSupply());
  }

  function test_ShouldDecreaseCirculatingSupply_WhenThereWasBurn() public {
    mockGoldToken.setBalanceOf(burnAddress, ONE_GOLDTOKEN);
    assertEq(mockGoldToken.circulatingSupply(), ONE_GOLDTOKEN * 999);
    assertEq(mockGoldToken.circulatingSupply(), mockGoldToken.totalSupply() - ONE_GOLDTOKEN);
  }
}

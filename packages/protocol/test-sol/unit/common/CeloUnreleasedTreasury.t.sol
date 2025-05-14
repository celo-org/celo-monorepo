// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/common/interfaces/ICeloToken.sol";

import { CeloUnreleasedTreasury } from "@celo-contracts-8/common/CeloUnreleasedTreasury.sol";

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

contract CeloUnreleasedTreasuryTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  ICeloToken celoTokenContract;

  CeloUnreleasedTreasury celoUnreleasedTreasuryContract;

  address celoTokenAddress = actor("celoTokenAddress");

  address celoDistributionOwner = actor("celoDistributionOwner");

  address randomAddress = actor("randomAddress");

  uint256 constant l2StartTime = 1715808537; // Arbitary later date (May 15 2024)

  function setUp() public virtual override {
    super.setUp();
    deployCodeTo("GoldToken.sol", abi.encode(true), celoTokenAddress);
    celoTokenContract = ICeloToken(celoTokenAddress);
    celoTokenContract.initialize(REGISTRY_ADDRESS);

    registry.setAddressFor(CeloTokenContract, address(celoTokenContract));
    newCeloUnreleasedTreasury();
    whenL2WithEpochManagerInitialization();
  }

  function newCeloUnreleasedTreasury() internal {
    vm.warp(block.timestamp + l2StartTime);
    vm.prank(celoDistributionOwner);
    celoUnreleasedTreasuryContract = new CeloUnreleasedTreasury(true);
    registry.setAddressFor("CeloUnreleasedTreasury", address(celoUnreleasedTreasuryContract));

    vm.prank(celoDistributionOwner);
    celoUnreleasedTreasuryContract.initialize(REGISTRY_ADDRESS);
  }
}

contract CeloUnreleasedTreasuryTest_initialize is CeloUnreleasedTreasuryTest {
  function test_ShouldSetAnOwnerToCeloUnreleasedTreasuryInstance() public {
    assertEq(celoUnreleasedTreasuryContract.owner(), celoDistributionOwner);
  }

  function test_ShouldSetRegistryAddressToCeloUnreleasedTreasuryInstance() public {
    assertEq(address(celoUnreleasedTreasuryContract.registry()), REGISTRY_ADDRESS);
  }

  function test_Reverts_WhenRegistryIsTheNullAddress() public {
    celoUnreleasedTreasuryContract = new CeloUnreleasedTreasury(true);
    registry.setAddressFor("CeloUnreleasedTreasury", address(celoUnreleasedTreasuryContract));
    vm.expectRevert("Cannot register the null address");
    celoUnreleasedTreasuryContract.initialize(address(0));
  }

  function test_Reverts_WhenReceivingNativeTokens() public {
    (bool success, ) = address(celoUnreleasedTreasuryContract).call{ value: 1 ether }("");
    assertFalse(success);

    address payable payableAddress = payable((address(celoUnreleasedTreasuryContract)));

    bool success2 = payableAddress.send(1 ether);
    assertFalse(success2);

    vm.expectRevert();
    payableAddress.transfer(1 ether);
  }
}

contract CeloUnreleasedTreasuryTest_release is CeloUnreleasedTreasuryTest {
  function setUp() public override(CeloUnreleasedTreasuryTest) {
    super.setUp();
  }

  function test_ShouldTransferToRecepientAddress() public {
    uint256 _balanceBefore = randomAddress.balance;
    vm.prank(address(epochManager));

    celoUnreleasedTreasuryContract.release(randomAddress, 4);
    uint256 _balanceAfter = randomAddress.balance;
    assertGt(_balanceAfter, _balanceBefore);
  }

  function test_Reverts_WhenCalledByOtherThanEpochManager() public {
    vm.prank(randomAddress);

    vm.expectRevert("Only the EpochManager contract can call this function.");
    celoUnreleasedTreasuryContract.release(randomAddress, 4);
  }
}

contract CeloUnreleasedTreasuryTest_getRemainingBalanceToRelease is CeloUnreleasedTreasuryTest {
  uint256 _startingBalance;
  function setUp() public override(CeloUnreleasedTreasuryTest) {
    super.setUp();

    _startingBalance = address(celoUnreleasedTreasuryContract).balance;
  }

  function test_ShouldReturnRemainingBalanceToReleaseAfterFirstRelease() public {
    vm.prank(address(epochManager));

    celoUnreleasedTreasuryContract.release(randomAddress, 4);
    uint256 _remainingBalance = celoUnreleasedTreasuryContract.getRemainingBalanceToRelease();
    assertEq(_remainingBalance, _startingBalance - 4);
  }

  function test_RemainingBalanceToReleaseShouldRemainUnchangedAfterCeloTransferBackToContract()
    public
  {
    vm.prank(address(epochManager));

    celoUnreleasedTreasuryContract.release(randomAddress, 4);
    uint256 _remainingBalanceBeforeTransfer = celoUnreleasedTreasuryContract
      .getRemainingBalanceToRelease();
    assertEq(_remainingBalanceBeforeTransfer, _startingBalance - 4);
    // set the contract balance to mock a CELO token transfer
    vm.deal(address(celoUnreleasedTreasuryContract), L2_INITIAL_STASH_BALANCE);
    uint256 _remainingBalanceAfterTransfer = celoUnreleasedTreasuryContract
      .getRemainingBalanceToRelease();
    assertEq(_remainingBalanceAfterTransfer, _remainingBalanceBeforeTransfer);
  }
}

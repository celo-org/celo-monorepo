// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";

import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/governance/Proposals.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";

import "@celo-contracts/governance/GovernanceSlasher.sol";

contract GovernanceSlasherTest is Test {
  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, uint256 amount);

  IRegistry registry;
  Accounts accounts;
  MockLockedGold mockLockedGold;

  GovernanceSlasher public governanceSlasher;
  address owner;
  address nonOwner;
  address validator;
  address slashedAddress;
  address registryAddress = 0x000000000000000000000000000000000000ce10;

  function setUp() public {
    owner = address(this);
    nonOwner = actor("nonOwner");
    validator = actor("validator");
    slashedAddress = actor("slashedAddress");

    accounts = new Accounts(true);
    mockLockedGold = new MockLockedGold();
    governanceSlasher = new GovernanceSlasher(true);

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = IRegistry(registryAddress);
    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("LockedGold", address(mockLockedGold));

    governanceSlasher.initialize(registryAddress);
    mockLockedGold.setAccountTotalLockedGold(validator, 5000);
  }
}

contract GovernanceSlasherTest_initialize is GovernanceSlasherTest {
  function test_shouldHaveSetOwner() public {
    assertEq(governanceSlasher.owner(), owner);
  }

  function test_CanOnlyBeCalledOnce() public {
    vm.expectRevert("contract already initialized");
    governanceSlasher.initialize(registryAddress);
  }
}

contract GovernanceSlasherTest_approveSlashingTest is GovernanceSlasherTest {
  function test_ShouldSetSlashableAmount() public {
    governanceSlasher.approveSlashing(slashedAddress, 1000);
    assertEq(governanceSlasher.getApprovedSlashing(slashedAddress), 1000);
  }

  function test_ShouldIncrementSlashableAmountWhenApprovedTwice() public {
    governanceSlasher.approveSlashing(slashedAddress, 1000);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
    assertEq(governanceSlasher.getApprovedSlashing(slashedAddress), 2000);
  }

  function test_CanOnlyBeCalledByOnwer() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
  }

  function test_EmitsSlashingApprovedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SlashingApproved(slashedAddress, 1000);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
  }
}

contract GovernanceSlasherTest_slasherSlashTest is GovernanceSlasherTest {
  address[] lessers = new address[](0);
  address[] greaters = new address[](0);
  uint256[] indices = new uint256[](0);

  function test_ShouldFailIfThereIsNothingToSlash() public {
    vm.expectRevert("No penalty given by governance");
    governanceSlasher.slash(validator, lessers, greaters, indices);
  }

  function test_ShouldDecrementCelo() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.slash(validator, lessers, greaters, indices);
    assertEq(mockLockedGold.accountTotalLockedGold(validator), 4000);
  }

  function test_ShouldHaveSetTheApprovedSlashingToZero() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.slash(validator, lessers, greaters, indices);
    assertEq(governanceSlasher.getApprovedSlashing(validator), 0);
  }

  function test_EmitsGovernanceSlashPerformedEvent() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashPerformed(validator, 1000);
    governanceSlasher.slash(validator, lessers, greaters, indices);
  }
}

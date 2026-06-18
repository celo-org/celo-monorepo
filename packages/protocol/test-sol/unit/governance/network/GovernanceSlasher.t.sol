// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

import "@celo-contracts/common/interfaces/IAccountsTest.sol";
import "@celo-contracts/governance/interfaces/IGovernanceSlasher.sol";
import "@celo-contracts/governance/interfaces/IGovernanceSlasherInitializer.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";

import { MockLockedGold08 } from "@test-sol/unit/governance/voting/mocks/MockLockedGold08.sol";
import { MockValidators08Slasher } from "@test-sol/unit/governance/network/mocks/MockValidators08Slasher.sol";

// Force compilation of GovernanceSlasherCompile artifact for deployCodeTo
import "@test-sol/unit/governance/network/CompileGovernanceSlasher.t.sol";

contract GovernanceSlasherTest is TestWithUtils08 {
  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, address indexed group, uint256 amount);
  event HavelSlashingMultiplierHalved(address validator);
  event ValidatorDeaffiliatedCalled(address validator);

  IAccountsTest accounts;
  MockLockedGold08 mockLockedGold;

  IGovernanceSlasher public governanceSlasher;
  address governanceSlasherAddress;
  address owner;
  address nonOwner;
  address validator;
  address slashedAddress;

  address[] lessers;
  address[] greaters;
  uint256[] indices;
  address internal slasherExecuter;

  function setUp() public virtual override {
    super.setUp();
    whenL2WithEpochManagerInitialization();
    preSetup();
    IGovernanceSlasherInitializer(governanceSlasherAddress).initialize(REGISTRY_ADDRESS);
    mockLockedGold.setAccountTotalLockedGold(validator, 5000);
  }

  function preSetup() public {
    owner = address(this);
    nonOwner = actor("nonOwner");
    validator = actor("validator");
    slashedAddress = actor("slashedAddress");
    slasherExecuter = actor("slasherExecuter");

    address accountsAddress = actor("Accounts");
    deployCodeTo("Accounts.sol", abi.encode(true), accountsAddress);
    accounts = IAccountsTest(accountsAddress);
    mockLockedGold = new MockLockedGold08();
    governanceSlasherAddress = actor("governanceSlasher");
    deployCodeTo("GovernanceSlasherCompile", governanceSlasherAddress);
    governanceSlasher = IGovernanceSlasher(governanceSlasherAddress);

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("LockedGold", address(mockLockedGold));
  }
}

contract GovernanceSlasherTest_initialize is GovernanceSlasherTest {
  function test_shouldHaveSetOwner() public {
    assertEq(IOwnable(governanceSlasherAddress).owner(), owner);
  }

  function test_CanOnlyBeCalledOnce() public {
    vm.expectRevert("contract already initialized");
    IGovernanceSlasherInitializer(governanceSlasherAddress).initialize(REGISTRY_ADDRESS);
  }
}

contract GovernanceSlasherTest_approveSlashing is GovernanceSlasherTest {
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
    vm.expectRevert("Sender not authorized to slash");
    vm.prank(nonOwner);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
  }

  function test_Emits_SlashingApprovedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SlashingApproved(slashedAddress, 1000);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
  }

  function test_CanBeCalledBySlasherExecuter() public {
    governanceSlasher.setSlasherExecuter(slasherExecuter);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
    assertEq(governanceSlasher.getApprovedSlashing(slashedAddress), 1000);
  }
}

contract GovernanceSlasherTest_slash_WhenNotGroup is GovernanceSlasherTest {
  address group = address(0);

  function test_ShouldDecrementCelo() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
    assertEq(mockLockedGold.accountTotalLockedGold(validator), 4000);
  }

  function test_ShouldHaveSetTheApprovedSlashingToZero() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
    assertEq(governanceSlasher.getApprovedSlashing(validator), 0);
  }

  function test_Emits_GovernanceSlashPerformedEventWhenCallingSlashL2() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashPerformed(validator, group, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
  }

  function test_Emits_GovernanceSlashPerformedEventWhenCallingSlash() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashPerformed(validator, group, 1000);
    governanceSlasher.slash(validator, group, lessers, greaters, indices);
  }
}

contract GovernanceSlasherTest_slash_WhenGroup is GovernanceSlasherTest {
  address group;
  MockValidators08Slasher validators;

  function setUp() public override {
    super.setUp();

    validators = new MockValidators08Slasher();
    registry.setAddressFor("Validators", address(validators));
    (group, ) = actorWithPK("group");

    accounts.initialize(REGISTRY_ADDRESS);

    vm.prank(group);
    accounts.createAccount();
    vm.prank(validator);
    accounts.createAccount();
    vm.prank(validator);
    validators.affiliate(group);

    mockLockedGold.setAccountTotalLockedGold(group, 5000);
  }

  function test_ShouldDecrementCelo() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
    assertEq(mockLockedGold.accountTotalLockedGold(validator), 4000);
  }

  function test_ShouldHaveSetTheApprovedSlashingToZero() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
    assertEq(governanceSlasher.getApprovedSlashing(validator), 0);
  }

  function test_Emits_GovernanceSlashPerformedEvent() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashPerformed(validator, group, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
  }

  function test_Emits_GovernanceSlashPerformedEventWhenCallingSlash() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashPerformed(validator, group, 1000);
    governanceSlasher.slash(validator, group, lessers, greaters, indices);
  }

  function test_validatorDeAffiliatedAndScoreReduced() public {
    governanceSlasher.approveSlashing(validator, 100);

    vm.expectEmit(true, true, true, true);
    emit ValidatorDeaffiliatedCalled(validator);
    vm.expectEmit(true, true, true, true);
    emit HavelSlashingMultiplierHalved(group);

    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
    assertEq(mockLockedGold.accountTotalLockedGold(validator), 4900);
    assertEq(mockLockedGold.accountTotalLockedGold(group), 4900);
  }

  function test_CanBeCalledBySlasherExecuter() public {
    governanceSlasher.approveSlashing(validator, 1000);
    governanceSlasher.setSlasherExecuter(slasherExecuter);
    governanceSlasher.approveSlashing(slashedAddress, 1000);
    vm.prank(slasherExecuter);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
  }
}

contract GovernanceSlasherTest_setSlasherExecuter is GovernanceSlasherTest {
  function test_onlyOwnwerCanSetSlasherExecuter() public {
    vm.prank(nonOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    governanceSlasher.setSlasherExecuter(owner);
  }

  function test_setSlasherExecuter() public {
    governanceSlasher.setSlasherExecuter(nonOwner);
    assertEq(governanceSlasher.getSlasherExecuter(), nonOwner, "Score Manager not set");
  }
}

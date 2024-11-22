// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";
import "@test-sol/utils/WhenL2.sol";

import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/governance/Proposals.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/governance/GovernanceSlasher.sol";

contract GovernanceSlasherTest is TestWithUtils {
  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, uint256 amount);
  event GovernanceSlashL2Performed(address indexed account, address indexed group, uint256 amount);
  event HavelSlashingMultiplierHalved(address validator);
  event ValidatorDeaffiliatedCalled(address validator);

  Accounts accounts;
  MockLockedGold mockLockedGold;

  GovernanceSlasher public governanceSlasher;
  address owner;
  address nonOwner;
  address validator;
  address slashedAddress;

  address[] lessers = new address[](0);
  address[] greaters = new address[](0);
  uint256[] indices = new uint256[](0);
  address internal slasherExecuter;

  function setUp() public {
    super.setUp();
    owner = address(this);
    nonOwner = actor("nonOwner");
    validator = actor("validator");
    slashedAddress = actor("slashedAddress");
    slasherExecuter = actor("slasherExecuter");

    accounts = new Accounts(true);
    mockLockedGold = new MockLockedGold();
    governanceSlasher = new GovernanceSlasher(true);

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("LockedGold", address(mockLockedGold));

    governanceSlasher.initialize(REGISTRY_ADDRESS);
    mockLockedGold.setAccountTotalLockedGold(validator, 5000);
  }
}

contract GovernanceSlasherTest_L2 is GovernanceSlasherTest, WhenL2 {}

contract GovernanceSlasherTest_initialize is GovernanceSlasherTest {
  function test_shouldHaveSetOwner() public {
    assertEq(governanceSlasher.owner(), owner);
  }

  function test_CanOnlyBeCalledOnce() public {
    vm.expectRevert("contract already initialized");
    governanceSlasher.initialize(REGISTRY_ADDRESS);
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

  function test_EmitsSlashingApprovedEvent() public {
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

contract GovernanceSlasherTest_approveSlashing_L2 is
  GovernanceSlasherTest_L2,
  GovernanceSlasherTest_approveSlashing
{}

// contract GovernanceSlasherTest_slash_setup is GovernanceSlasherTest {}

contract GovernanceSlasherTest_slash is GovernanceSlasherTest {
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

contract GovernanceSlasherTest_slash_L2 is GovernanceSlasherTest_L2 {
  function test_Reverts_WhenL2() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectRevert("This method is no longer supported in L2.");
    governanceSlasher.slash(validator, lessers, greaters, indices);
  }
}

contract GovernanceSlasherTest_slashL2_WhenL1 is GovernanceSlasherTest {
  function test_Reverts() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectRevert("This method is not supported in L1.");
    governanceSlasher.slashL2(
      validator,
      validator,
      new address[](0),
      new address[](0),
      new uint256[](0)
    );
  }
}

// should work just like the deprecated version
contract GovernanceSlasherTest_slashL2_WhenNotGroup_L2 is GovernanceSlasherTest_L2 {
  address group = address(0);

  // only onwer or multisig can call

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

  function test_EmitsGovernanceSlashPerformedEvent() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashL2Performed(validator, group, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
  }
}

// should work just like the deprecated version
contract GovernanceSlasherTest_slashL2_WhenGroup_L2 is GovernanceSlasherTest_L2 {
  address group;
  MockValidators validators;

  function setUp() public {
    super.setUp();

    validators = new MockValidators();
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

  // functions should be decreased as usual
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

  function test_EmitsGovernanceSlashPerformedEvent() public {
    governanceSlasher.approveSlashing(validator, 1000);
    vm.expectEmit(true, true, true, true);
    emit GovernanceSlashL2Performed(validator, group, 1000);
    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
  }

  function test_validatorDeAffiliatedAndScoreReduced() public {
    governanceSlasher.approveSlashing(validator, 100);

    // functions to affect validator called
    vm.expectEmit(true, true, true, true);
    emit ValidatorDeaffiliatedCalled(validator);
    vm.expectEmit(true, true, true, true);
    emit HavelSlashingMultiplierHalved(group);

    governanceSlasher.slashL2(validator, group, lessers, greaters, indices);
    // assets removed, slashing called
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

contract GovernanceSlasherTest_setSlasherExecuter_L2 is
  GovernanceSlasherTest_L2,
  GovernanceSlasherTest_setSlasherExecuter
{}

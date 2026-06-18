// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@test-sol/unit/governance/validators/mocks/MockValidators08.sol";
import "@test-sol/unit/governance/validators/mocks/MockLockedGold08.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@test-sol/unit/governance/validators/mocks/DoubleSigningSlasherMock08.sol";

contract DoubleSigningSlasherBaseTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  SlashingIncentives public expectedSlashingIncentives;

  MockValidators08 validators;
  MockLockedGold08 lockedGold;
  DoubleSigningSlasherMock08 public slasher;

  address nonOwner;

  address validator;
  address group;

  address otherValidator;
  address otherGroup;

  uint256 public slashingPenalty = 10000;
  uint256 public slashingReward = 100;

  uint256 nonOwnerPK;
  uint256 validatorPK;
  uint256 groupPK;

  uint256 otherValidatorPK;
  uint256 otherGroupPK;

  address caller2;
  uint256 caller2PK;

  DoubleSigningSlasherMock08.SlashParams params;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);
  event DoubleSigningSlashPerformed(address indexed validator, uint256 indexed blockNumber);

  function setUp() public override {
    super.setUp();
    ph.setEpochSize(100);
    (nonOwner, nonOwnerPK) = actorWithPK("nonOwner");
    (validator, validatorPK) = actorWithPK("validator");
    (group, groupPK) = actorWithPK("group");
    (otherValidator, otherValidatorPK) = actorWithPK("otherValidator");
    (otherGroup, groupPK) = actorWithPK("otherGroup");
    (caller2, caller2PK) = actorWithPK("caller2");

    validators = new MockValidators08();
    lockedGold = new MockLockedGold08();
    slasher = new DoubleSigningSlasherMock08();

    // Register additional accounts in the existing Accounts contract from super.setUp()
    vm.prank(nonOwner);
    accountsContract.createAccount();

    vm.prank(group);
    accountsContract.createAccount();

    vm.prank(otherGroup);
    accountsContract.createAccount();

    // Register mocks in the existing registry (validator/caller2 accounts already
    // created by _registerAndElectValidatorsForL2 via whenL2WithEpochManagerInitialization)
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));

    vm.prank(validator);
    validators.affiliate(group);

    vm.prank(otherValidator);
    validators.affiliate(otherGroup);

    expectedSlashingIncentives.penalty = slashingPenalty;
    expectedSlashingIncentives.reward = slashingReward;

    slasher.initialize(REGISTRY_ADDRESS, slashingPenalty, slashingReward);

    lockedGold.setAccountTotalLockedGold(address(this), 50000);
    lockedGold.setAccountTotalLockedGold(nonOwner, 50000);
    lockedGold.setAccountTotalLockedGold(validator, 50000);
    lockedGold.setAccountTotalLockedGold(otherValidator, 50000);
    lockedGold.setAccountTotalLockedGold(group, 50000);
    lockedGold.setAccountTotalLockedGold(otherGroup, 50000);
    whenL2WithEpochManagerInitialization();
  }
}

contract DoubleSigningSlasherInitialize is DoubleSigningSlasherBaseTest {
  function test_ShouldHaveSetOwner() public {
    assertEq(IOwnable(address(slasher)).owner(), address(this));
  }

  function test_ShouldHaveSetSlashingIncentives() public {
    (uint256 actualPenalty, uint256 actualReward) = slasher.slashingIncentives();
    assertEq(actualPenalty, slashingPenalty);
    assertEq(actualReward, slashingReward);
  }

  function test_RevertWhen_CalledTwice() public {
    vm.expectRevert("contract already initialized");
    slasher.initialize(REGISTRY_ADDRESS, slashingPenalty, slashingReward);
  }
}

contract DoubleSigningSlasherSetSlashingIncentives is DoubleSigningSlasherBaseTest {
  function test_ShouldRevert_WhenInL2() public {
    uint256 newPenalty = 123;
    uint256 newReward = 67;

    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setSlashingIncentives(newPenalty, newReward);
  }
}

contract DoubleSigningSlasherSlash is DoubleSigningSlasherBaseTest {
  uint256 epoch;
  uint256 blockNumber = 17290; // blocks in epoch + 10
  uint256 validatorIndex = 5;
  uint256 otherValidatorIndex = 6;
  bytes headerA = "0x121212";
  bytes headerB = "0x131313";
  bytes headerC = "0x111314";

  bytes32 bitmap = 0x000000000000000000000000000000000000000000000000000000000000003f;

  address[] validatorElectionLessers = new address[](0);
  address[] validatorElectionGreaters = new address[](0);
  uint256[] validatorElectionIndices = new uint256[](0);
  address[] groupElectionLessers = new address[](0);
  address[] groupElectionGreaters = new address[](0);
  uint256[] groupElectionIndices = new uint256[](0);

  function test_Reverts_WhenL2() public {
    params = DoubleSigningSlasherMock08.SlashParams({
      signer: validator,
      index: validatorIndex,
      headerA: headerA,
      headerB: headerC,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.mockSlash(params, validator);
  }
}

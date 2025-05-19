// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/DoubleSigningSlasher.sol";
import "@celo-contracts/governance/test/MockUsingPrecompiles.sol";

contract DoubleSigningSlasherTest is
  DoubleSigningSlasher(true),
  MockUsingPrecompiles,
  TestWithUtils
{
  struct SlashParams {
    address signer;
    uint256 index;
    bytes headerA;
    bytes headerB;
    uint256 groupMembershipHistoryIndex;
    address[] validatorElectionLessers;
    address[] validatorElectionGreaters;
    uint256[] validatorElectionIndices;
    address[] groupElectionLessers;
    address[] groupElectionGreaters;
    uint256[] groupElectionIndices;
  }

  function mockSlash(SlashParams calldata slashParams, address _validator) external {
    ph.mockReturn(
      ph.GET_VALIDATOR(),
      abi.encodePacked(slashParams.index, getBlockNumberFromHeader(slashParams.headerA)),
      abi.encode(_validator)
    );

    slash(
      slashParams.signer,
      slashParams.index,
      slashParams.headerA,
      slashParams.headerB,
      slashParams.groupMembershipHistoryIndex,
      slashParams.validatorElectionLessers,
      slashParams.validatorElectionGreaters,
      slashParams.validatorElectionIndices,
      slashParams.groupElectionLessers,
      slashParams.groupElectionGreaters,
      slashParams.groupElectionIndices
    );
  }
}

contract DoubleSigningSlasherBaseTest is TestWithUtils {
  using FixidityLib for FixidityLib.Fraction;

  SlashingIncentives public expectedSlashingIncentives;

  Accounts accounts;
  MockValidators validators;
  MockLockedGold lockedGold;
  DoubleSigningSlasherTest slasher;

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

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  DoubleSigningSlasherTest.SlashParams params;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);
  event DoubleSigningSlashPerformed(address indexed validator, uint256 indexed blockNumber);

  function setUp() public {
    super.setUp();
    ph.setEpochSize(100);
    (nonOwner, nonOwnerPK) = actorWithPK("nonOwner");
    (validator, validatorPK) = actorWithPK("validator");
    (group, groupPK) = actorWithPK("group");
    (otherValidator, otherValidatorPK) = actorWithPK("otherValidator");
    (otherGroup, groupPK) = actorWithPK("otherGroup");
    (caller2, caller2PK) = actorWithPK("caller2");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);

    accounts = new Accounts(true);
    validators = new MockValidators();
    lockedGold = new MockLockedGold();
    slasher = new DoubleSigningSlasherTest();

    accounts.createAccount();

    vm.prank(nonOwner);
    accounts.createAccount();

    vm.prank(validator);
    accounts.createAccount();

    vm.prank(otherValidator);
    accounts.createAccount();

    vm.prank(group);
    accounts.createAccount();

    vm.prank(otherGroup);
    accounts.createAccount();

    accounts.initialize(REGISTRY_ADDRESS);

    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("Accounts", address(accounts));

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
    assertEq(slasher.owner(), address(this));
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
    params = DoubleSigningSlasherTest.SlashParams({
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

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/DowntimeSlasher.sol";
import "@celo-contracts/governance/test/MockUsingPrecompiles.sol";
import { Utils } from "@test-sol/utils.sol";

contract DowntimeSlasherMock is DowntimeSlasher(true), MockUsingPrecompiles {
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

  // function mockSlash(SlashParams calldata slashParams) external {
  //     slash(
  //         slashParams.signer,
  //         slashParams.index,
  //         slashParams.headerA,
  //         slashParams.headerB,
  //         slashParams.groupMembershipHistoryIndex,
  //         slashParams.validatorElectionLessers,
  //         slashParams.validatorElectionGreaters,
  //         slashParams.validatorElectionIndices,
  //         slashParams.groupElectionLessers,
  //         slashParams.groupElectionGreaters,
  //         slashParams.groupElectionIndices
  //     );
  // }

}

contract DowntimeSlasherTest is Test, Utils {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  SlashingIncentives public expectedSlashingIncentives;

  Registry registry;
  Accounts accounts;
  MockValidators validators;
  MockLockedGold lockedGold;
  DowntimeSlasherMock public slasher;

  address nonOwner;

  address validator;
  address group;

  address otherValidator0;
  address otherValidator1;
  address otherGroup;

  uint256 public slashingPenalty = 10000;
  uint256 public slashingReward = 100;
  uint256 public slashableDowntime = 12;

  uint256 nonOwnerPK;
  uint256 validatorPK;
  uint256 groupPK;

  uint256 otherValidator0PK;
  uint256 otherValidator1PK;
  uint256 otherGroupPK;

  address caller2;
  uint256 caller2PK;
  address public registryAddress = 0x000000000000000000000000000000000000ce10;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  DowntimeSlasherMock.SlashParams params;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);
  event SlashableDowntimeSet(uint256 interval);
  event DowntimeSlashPerformed(
    address indexed validator,
    uint256 indexed startBlock,
    uint256 indexed endBlock
  );
  event BitmapSetForInterval(
    address indexed sender,
    uint256 indexed startBlock,
    uint256 indexed endBlock,
    bytes32 bitmap
  );

  function setUp() public {
    ph.setEpochSize(100);
    (nonOwner, nonOwnerPK) = actorWithPK("nonOwner");
    (validator, validatorPK) = actorWithPK("validator");
    (group, groupPK) = actorWithPK("group");
    (otherValidator0, otherValidator0PK) = actorWithPK("otherValidator0");
    (otherValidator1, otherValidator1PK) = actorWithPK("otherValidator1");
    (otherGroup, groupPK) = actorWithPK("otherGroup");
    (caller2, caller2PK) = actorWithPK("caller2");

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    accounts = new Accounts(true);
    validators = new MockValidators();
    lockedGold = new MockLockedGold();
    slasher = new DowntimeSlasherMock();

    registry = Registry(registryAddress);

    accounts.createAccount();

    vm.prank(nonOwner);
    accounts.createAccount();

    vm.prank(validator);
    accounts.createAccount();

    vm.prank(otherValidator0);
    accounts.createAccount();
    vm.prank(otherValidator1);
    accounts.createAccount();

    vm.prank(group);
    accounts.createAccount();

    vm.prank(otherGroup);
    accounts.createAccount();

    accounts.initialize(registryAddress);

    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("Accounts", address(accounts));

    vm.prank(validator);
    validators.affiliate(group);

    vm.prank(otherValidator0);
    validators.affiliate(group);

    vm.prank(otherValidator1);
    validators.affiliate(otherGroup);

    expectedSlashingIncentives.penalty = slashingPenalty;
    expectedSlashingIncentives.reward = slashingReward;

    slasher.initialize(registryAddress, slashingPenalty, slashingReward, slashableDowntime);

    lockedGold.setAccountTotalLockedGold(address(this), 50000);
    lockedGold.setAccountTotalLockedGold(nonOwner, 50000);
    lockedGold.setAccountTotalLockedGold(validator, 50000);
    lockedGold.setAccountTotalLockedGold(otherValidator0, 50000);
    lockedGold.setAccountTotalLockedGold(otherValidator1, 50000);
    lockedGold.setAccountTotalLockedGold(group, 50000);
    lockedGold.setAccountTotalLockedGold(otherGroup, 50000);
  }
}

contract DowntimeSlasherTestInitialize is DowntimeSlasherTest {
  function test_ShouldHaveSetOwner() public {
    assertEq(slasher.owner(), address(this));
  }

  function test_ShouldHaveSetSlashingIncentives() public {
    (uint256 _penalty, uint256 _reward) = slasher.slashingIncentives();

    assertEq(_penalty, slashingPenalty);
    assertEq(_reward, slashingReward);
  }

  function test_ShouldHaveSetSlashableDowntime() public {
    uint256 _slashableDowntime = slasher.slashableDowntime();

    assertEq(_slashableDowntime, slashableDowntime);
  }

  function test_Reverts_WhenCalledTwice() public {
    vm.expectRevert("contract already initialized");
    slasher.initialize(registryAddress, slashingPenalty, slashingReward, slashableDowntime);
  }
}

contract DowntimeSlasherTestSetIncentives is DowntimeSlasherTest {
  function test_CanOnlyBeCalledByOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");

    vm.prank(nonOwner);
    slasher.setSlashingIncentives(slashingPenalty, slashingReward);
  }

  function test_ShouldHaveSetSlashingIncentives() public {
    uint256 _newPenalty = 123;
    uint256 _newReward = 67;
    slasher.setSlashingIncentives(_newPenalty, _newReward);

    (uint256 _penalty, uint256 _reward) = slasher.slashingIncentives();

    assertEq(_penalty, _newPenalty);
    assertEq(_reward, _newReward);
  }

  function test_Reverts_WhenRewardLargerThanPenalty() public {
    vm.expectRevert("Penalty has to be larger than reward");
    slasher.setSlashingIncentives(123, 678);
  }

  function test_Emits_SlashingIncentivesSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SlashingIncentivesSet(123, 67);

    slasher.setSlashingIncentives(123, 67);
  }
}

contract DowntimeSlasherTestSetSlashableDowntime is DowntimeSlasherTest {
  function test_CanOnlyBeCalledByOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");

    vm.prank(nonOwner);
    slasher.setSlashableDowntime(slashableDowntime);
  }

  function test_ShouldHaveSetSlashableDowntime() public {
    uint256 _newSlashableDowntime = 23;

    slasher.setSlashableDowntime(_newSlashableDowntime);

    uint256 _slashableDowntime = slasher.slashableDowntime();

    assertEq(_slashableDowntime, _newSlashableDowntime);
  }

  function test_Emits_SlashableDowntimeSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SlashableDowntimeSet(23);

    slasher.setSlashableDowntime(23);
  }
}

contract DowntimeSlasherTestGetBitmapForInterval is DowntimeSlasherTest {
  uint256 epoch;
  uint256 blockNumber;

  function setUp() public {
    super.setUp();
    uint256 epoch0 = slasher.getEpochNumber();

    ph.setEpochSize(17280);

    slasher.setNumberValidators(2);
    blockTravel(ph.epochSize());

    blockNumber = block.number;
    epoch = slasher.getEpochNumber();

    slasher.setEpochSigner(epoch, 0, validator);
  }

  function test_Reverts_IfEndBlockIsLessThanStartBlock() public {
    vm.expectRevert("endBlock must be greater or equal than startBlock");
    slasher.getBitmapForInterval(3, 2);
  }

  function test_Reverts_IfCurrentBlockIsPartOfInterval() public {
    vm.expectRevert("the signature bitmap for endBlock is not yet available");
    slasher.getBitmapForInterval(blockNumber, blockNumber);
  }

  function test_Reverts_IfBlockIsOlderThan4Epochs() public {
    uint256 _epochSize = ph.epochSize();
    blockTravel(_epochSize.mul(4).add(2));
    console2.log("###Epoch:", slasher.getEpochNumber());

    uint256 _blockNumber = block.number.sub(_epochSize.mul(4));
    console2.log("###_blockNumber:", _blockNumber);

    vm.expectRevert("startBlock must be within 4 epochs of the current head");
    slasher.getBitmapForInterval(_blockNumber, _blockNumber);
  }

  function test_Reverts_IfStartBlockAndEndBlockAreNotFromSameEpoch() public {
    blockTravel(ph.epochSize());

    uint256 _blockNumber = block.number.sub(2);

    // uint256 epoch0 = slasher.getEpochNumber();
    // console2.log("###_blockNumber0:", _blockNumber.sub(ph.epochSize()));
    // console2.log("###_blockNumber:", _blockNumber);
    // console2.log("###epoch1:", epoch0);

    // XXX  Issue with foundry thinking the precompile return is the test not reverting.
    vm.expectRevert("startBlock and endBlock must be in the same epoch");
    slasher.getBitmapForInterval(_blockNumber.sub(ph.epochSize()), _blockNumber);
  }
}

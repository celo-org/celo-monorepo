// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/DowntimeSlasher.sol";
import "@celo-contracts/governance/test/MockUsingPrecompiles.sol";
import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

contract DowntimeSlasherMock is DowntimeSlasher(true), MockUsingPrecompiles, TestWithUtils {
  struct SlashParams {
    uint256[] startBlocks;
    uint256[] endBlocks;
    uint256[] signerIndices;
    uint256 groupMembershipHistoryIndex;
    address[] validatorElectionLessers;
    address[] validatorElectionGreaters;
    uint256[] validatorElectionIndices;
    address[] groupElectionLessers;
    address[] groupElectionGreaters;
    uint256[] groupElectionIndices;
  }

  function mockSlash(SlashParams calldata slashParams, address[] calldata _validators) external {
    require(
      slashParams.signerIndices.length == _validators.length,
      "validators list and signerIndices list length are different."
    );

    ph.mockReturn(
      ph.GET_VALIDATOR(),
      abi.encodePacked(slashParams.signerIndices[0], slashParams.startBlocks[0]),
      abi.encode(_validators[0])
    );

    if (slashParams.signerIndices.length > 1) {
      for (uint256 i = 0; i < slashParams.startBlocks.length; i = i.add(1)) {
        if (i > 0) {
          if (slashParams.startBlocks[i].mod(17280) == 1) {
            ph.mockReturn(
              ph.GET_VALIDATOR(),
              abi.encodePacked(
                slashParams.signerIndices[i.sub(1)],
                slashParams.startBlocks[i].sub(1)
              ),
              abi.encode(_validators[0])
            );
            ph.mockReturn(
              ph.GET_VALIDATOR(),
              abi.encodePacked(slashParams.signerIndices[i], slashParams.startBlocks[i]),
              abi.encode(_validators[1])
            );
          }
        }
      }
    }
    slash(
      slashParams.startBlocks,
      slashParams.endBlocks,
      slashParams.signerIndices,
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

contract DowntimeSlasherTest is TestWithUtils {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

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
  uint256 public intervalSize = 4;

  uint256 nonOwnerPK;
  uint256 validatorPK;
  uint256 groupPK;

  uint256 otherValidator0PK;
  uint256 otherValidator1PK;
  uint256 otherGroupPK;

  address caller2;
  uint256 caller2PK;

  uint256 epochSize;
  uint256 epoch;
  uint256 blockNumber;

  uint256[] public _startingBlocks;
  uint256[] public _endingBlocks;

  // Signed by validators 0 and 1
  bytes32 bitmapVI01 = bytes32(0x0000000000000000000000000000000000000000000000000000000000000003);
  // Signed by validator 1
  bytes32 bitmapVI1 = bytes32(0x0000000000000000000000000000000000000000000000000000000000000002);
  // Signed by validator 0
  bytes32 bitmapVI0 = bytes32(0x0000000000000000000000000000000000000000000000000000000000000001);
  // Signed by validator 99
  bytes32 bitmapVI99 = bytes32(0x0000000000000000000000000000000000000008000000000000000000000000);

  uint256 validatorIndexInEpoch = 0;
  bytes32[] bitmapWithoutValidator = [bitmapVI1, bitmapVI0];

  address[] public validatorElectionLessers = new address[](0);
  address[] public validatorElectionGreaters = new address[](0);
  uint256[] public validatorElectionIndices = new uint256[](0);
  address[] public groupElectionLessers = new address[](0);
  address[] public groupElectionGreaters = new address[](0);
  uint256[] public groupElectionIndices = new uint256[](0);

  DowntimeSlasherMock.SlashParams slashParams;
  SlashingIncentives public expectedSlashingIncentives;

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
    super.setUp();
    ph.setEpochSize(100);
    (nonOwner, nonOwnerPK) = actorWithPK("nonOwner");
    (validator, validatorPK) = actorWithPK("validator");
    (group, groupPK) = actorWithPK("group");
    (otherValidator0, otherValidator0PK) = actorWithPK("otherValidator0");
    (otherValidator1, otherValidator1PK) = actorWithPK("otherValidator1");
    (otherGroup, groupPK) = actorWithPK("otherGroup");
    (caller2, caller2PK) = actorWithPK("caller2");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);

    accounts = new Accounts(true);
    validators = new MockValidators();
    lockedGold = new MockLockedGold();
    slasher = new DowntimeSlasherMock();

    registry = Registry(REGISTRY_ADDRESS);

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

    accounts.initialize(REGISTRY_ADDRESS);

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

    slasher.initialize(REGISTRY_ADDRESS, slashingPenalty, slashingReward, slashableDowntime);

    lockedGold.setAccountTotalLockedGold(address(this), 50000);
    lockedGold.setAccountTotalLockedGold(nonOwner, 50000);
    lockedGold.setAccountTotalLockedGold(validator, 50000);
    lockedGold.setAccountTotalLockedGold(otherValidator0, 50000);
    lockedGold.setAccountTotalLockedGold(otherValidator1, 50000);
    lockedGold.setAccountTotalLockedGold(group, 50000);
    lockedGold.setAccountTotalLockedGold(otherGroup, 50000);
    whenL2WithEpochManagerInitialization();
  }

  // This function will wait until the middle of a new epoch is reached.
  // We consider blocks are "safe" if the test could perform a slash, without
  // the context of the other tests.
  // This property ensures that each test has an epoch to work with (not depends
  // on previous tests), and there are enough blocks on that epoch to have a validator
  // down for a possible slash.
  function _waitUntilSafeBlocks(uint256 _safeEpoch) internal {
    uint256 blockStableBetweenTests = _getFirstBlockNumberOfEpoch(_safeEpoch).sub(1);

    while (block.number < blockStableBetweenTests || block.number % epochSize <= epochSize.div(2)) {
      blockTravel(1);
    }
  }

  function _presetParentSealForBlock(
    uint256 fromBlock,
    uint256 numberOfBlocks,
    bytes32[] memory _bitmaps
  ) internal {
    uint256 startEpoch = slasher.getEpochNumberOfBlock(fromBlock);
    uint256 nextEpochStart = _getFirstBlockNumberOfEpoch(startEpoch.add(1));
    for (uint256 i = fromBlock; i < fromBlock.add(numberOfBlocks); i++) {
      slasher.setParentSealBitmap(i.add(1), i < nextEpochStart ? _bitmaps[0] : _bitmaps[1]);
    }
  }

  function _calculateEverySlot(
    uint256 _startBlock
  ) internal returns (uint256[] memory, uint256[] memory) {
    delete _startingBlocks;
    delete _endingBlocks;
    uint256 actualSlashableDowntime = slasher.slashableDowntime();
    uint256 startEpoch = _getFirstBlockNumberOfEpoch(_startBlock);
    uint256 nextEpochStart = _getFirstBlockNumberOfEpoch(startEpoch);
    uint256 endBlock = _startBlock.add(actualSlashableDowntime).sub(1);

    for (uint256 i = _startBlock; i <= endBlock; ) {
      uint256 endBlockForSlot = i.add(intervalSize.sub(1));
      endBlockForSlot = endBlockForSlot > endBlock ? endBlock : endBlockForSlot;

      // avoid crossing epoch

      endBlockForSlot = endBlockForSlot >= nextEpochStart && i < nextEpochStart
        ? nextEpochStart.sub(1)
        : endBlockForSlot;

      _startingBlocks.push(i);

      _endingBlocks.push(endBlockForSlot);

      slasher.setBitmapForInterval(i, endBlockForSlot);
      i = endBlockForSlot.add(1);
    }

    return (_startingBlocks, _endingBlocks);
  }

  function _ensureValidatorIsSlashable(
    uint256 startBlock,
    uint256[] memory validatorIndices
  ) internal returns (uint256[] memory, uint256[] memory) {
    bytes32[] memory bitmapMasks = new bytes32[](validatorIndices.length);
    bytes32[] memory _bitmaps = new bytes32[](1);
    _bitmaps[0] = bitmapVI01;
    for (uint256 i = 0; i < validatorIndices.length; i++) {
      bitmapMasks[i] = bitmapWithoutValidator[validatorIndices[i]];
    }

    _presetParentSealForBlock(startBlock, slashableDowntime, bitmapMasks);
    _presetParentSealForBlock(startBlock.sub(1), 1, _bitmaps);
    _presetParentSealForBlock(startBlock.add(slashableDowntime), 1, _bitmaps);
    return _calculateEverySlot(startBlock);
  }

  function _setEpochSettings() internal {
    ph.setEpochSize(17280);
    epochSize = ph.epochSize();

    blockTravel(epochSize);
    blockNumber = block.number;
    epoch = slasher.getEpochNumberOfBlock(blockNumber);

    _waitUntilSafeBlocks(epoch);
    slasher.setNumberValidators(2);
  }

  function _getFirstBlockNumberOfEpoch(uint256 _epochNumber) internal view returns (uint256) {
    if (_epochNumber == 0) {
      return 0;
    }
    return (_epochNumber.sub(1)).mul(epochSize).add(1);
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
    slasher.initialize(REGISTRY_ADDRESS, slashingPenalty, slashingReward, slashableDowntime);
  }
}

contract DowntimeSlasherTestSetIncentives is DowntimeSlasherTest {
  function test_Reverts_WhenInL2() public {
    uint256 _newPenalty = 123;
    uint256 _newReward = 67;

    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setSlashingIncentives(_newPenalty, _newReward);
  }
}

contract DowntimeSlasherTestSetSlashableDowntime is DowntimeSlasherTest {
  function test_Reverts_WhenInL2() public {
    uint256 _newSlashableDowntime = 23;

    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setSlashableDowntime(_newSlashableDowntime);
  }
}

contract DowntimeSlasherTestGetBitmapForInterval is DowntimeSlasherTest {
  function setUp() public {
    super.setUp();

    ph.setEpochSize(17280);
    blockTravel(ph.epochSize());
    blockNumber = block.number;
    epoch = slasher.getEpochNumber();
    slasher.setNumberValidators(2);
    slasher.setEpochSigner(epoch, 0, validator);
  }

  function test_Reverts_WhenL2() public {
    epochSize = ph.epochSize();
    blockTravel(epochSize.mul(4).add(2));

    uint256 _blockNumber = block.number.sub(epochSize.mul(4));

    vm.expectRevert("This method is no longer supported in L2.");
    slasher.getBitmapForInterval(_blockNumber, _blockNumber);
  }
}

contract DowntimeSlasherTestSetBitmapForInterval is DowntimeSlasherTest {
  function setUp() public {
    super.setUp();

    ph.setEpochSize(17280);

    epochSize = ph.epochSize();

    blockTravel(epochSize);
    slasher.setNumberValidators(2);
    blockNumber = block.number;
    blockNumber = blockNumber.sub(3);
    blockNumber = blockNumber % epochSize == 0 ? blockNumber.sub(1) : blockNumber;

    epoch = slasher.getEpochNumberOfBlock(blockNumber);

    slasher.setEpochSigner(epoch, 0, validator);

    slasher.setParentSealBitmap(
      blockNumber.add(1),
      bytes32(0x0000000000000000000000000000000000000000000000000000000000000001)
    );
    slasher.setParentSealBitmap(
      blockNumber.add(2),
      bytes32(0x0000000000000000000000000000000000000000000000000000000000000002)
    );
  }

  function test_Reverts_WhenInL2_SetBitmapForInterval() public {
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setBitmapForInterval(blockNumber, blockNumber.add(1));
  }
}

contract DowntimeSlasherTestSlash_WhenSlashing is DowntimeSlasherTest {
  uint256[] private _signerIndices = new uint256[](1);
  address[] private _validatorsList = new address[](1);
  bytes32[] private _bitmaps0 = new bytes32[](1);
  bytes32[] private _bitmaps1 = new bytes32[](1);

  function setUp() public {
    super.setUp();

    _signerIndices[0] = validatorIndexInEpoch;
    _validatorsList[0] = validator;

    _setEpochSettings();
  }

  function _generateProofs(uint256[] memory startBlocks, uint256[] memory endBlocks) public {
    for (uint256 i = 0; i < startBlocks.length; i++) {
      slasher.setBitmapForInterval(startBlocks[i], endBlocks[i]);
    }
  }

  function _setupSlashTest() public {
    slasher.setEpochSigner(epoch, 0, validator);
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    uint256[] memory validatorIndices = new uint256[](1);
    validatorIndices[0] = validatorIndexInEpoch;
    (uint256[] memory _startBlocks, uint256[] memory _endBlocks) = _ensureValidatorIsSlashable(
      startBlock,
      _signerIndices
    );

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: _startBlocks,
      endBlocks: _endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });
    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_WhenL2_IfIntervalsOverlap_WhenIntervalCoverSlashableDowntimeWindow()
    public
  {
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime, _bitmaps0);

    uint256[] memory _startBlocks = new uint256[](2);
    uint256[] memory _endBlocks = new uint256[](2);
    _startBlocks[0] = startBlock;
    _startBlocks[1] = startBlock.add(2);
    _endBlocks[0] = startBlock.add(slashableDowntime.sub(3));
    _endBlocks[1] = startBlock.add(slashableDowntime.sub(1));

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: _startBlocks,
      endBlocks: _endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("This method is no longer supported in L2.");
    slasher.mockSlash(slashParams, _validatorsList);
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import "@celo-contracts/common/FixidityLib.sol";
import "@test-sol/unit/governance/validators/mocks/MockValidators08.sol";
import "@test-sol/unit/governance/validators/mocks/MockLockedGold08.sol";
import "@celo-contracts/common/interfaces/IOwnable.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import "@test-sol/unit/governance/validators/mocks/DowntimeSlasherMock08.sol";

contract DowntimeSlasherTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

  MockValidators08 validators;
  MockLockedGold08 lockedGold;
  DowntimeSlasherMock08 public slasher;

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

  DowntimeSlasherMock08.SlashParams slashParams;
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

  function setUp() public virtual override {
    super.setUp();
    ph.setEpochSize(100);
    (nonOwner, nonOwnerPK) = actorWithPK("nonOwner");
    (validator, validatorPK) = actorWithPK("validator");
    (group, groupPK) = actorWithPK("group");
    (otherValidator0, otherValidator0PK) = actorWithPK("otherValidator0");
    (otherValidator1, otherValidator1PK) = actorWithPK("otherValidator1");
    (otherGroup, groupPK) = actorWithPK("otherGroup");
    (caller2, caller2PK) = actorWithPK("caller2");

    validators = new MockValidators08();
    lockedGold = new MockLockedGold08();
    slasher = new DowntimeSlasherMock08();

    // Register additional accounts in the existing Accounts contract from super.setUp()
    vm.prank(nonOwner);
    accountsContract.createAccount();

    vm.prank(otherValidator0);
    accountsContract.createAccount();

    vm.prank(otherValidator1);
    accountsContract.createAccount();

    vm.prank(group);
    accountsContract.createAccount();

    vm.prank(otherGroup);
    accountsContract.createAccount();

    // Register mocks in the existing registry (validator account created by
    // _registerAndElectValidatorsForL2 via whenL2WithEpochManagerInitialization)
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));

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
  function _waitUntilSafeBlocks(uint256 _safeEpoch) internal {
    uint256 blockStableBetweenTests = _getFirstBlockNumberOfEpoch(_safeEpoch) - 1;
    if (block.number < blockStableBetweenTests) {
      blockTravel(blockStableBetweenTests - block.number + 1);
    }
    uint256 posInEpoch = block.number % epochSize;
    if (posInEpoch <= epochSize / 2) {
      blockTravel(epochSize / 2 + 1 - posInEpoch);
    }
  }

  function _presetParentSealForBlock(
    uint256 fromBlock,
    uint256 numberOfBlocks,
    bytes32[] memory _bitmaps
  ) internal {
    uint256 startEpoch = slasher.getEpochNumberOfBlock(fromBlock);
    uint256 nextEpochStart = _getFirstBlockNumberOfEpoch(startEpoch + 1);
    for (uint256 i = fromBlock; i < fromBlock + numberOfBlocks; i++) {
      slasher.setParentSealBitmap(i + 1, i < nextEpochStart ? _bitmaps[0] : _bitmaps[1]);
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
    uint256 endBlock = _startBlock + actualSlashableDowntime - 1;

    for (uint256 i = _startBlock; i <= endBlock; ) {
      uint256 endBlockForSlot = i + intervalSize - 1;
      endBlockForSlot = endBlockForSlot > endBlock ? endBlock : endBlockForSlot;

      // avoid crossing epoch
      endBlockForSlot = endBlockForSlot >= nextEpochStart && i < nextEpochStart
        ? nextEpochStart - 1
        : endBlockForSlot;

      _startingBlocks.push(i);
      _endingBlocks.push(endBlockForSlot);

      slasher.setBitmapForInterval(i, endBlockForSlot);
      i = endBlockForSlot + 1;
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
    _presetParentSealForBlock(startBlock - 1, 1, _bitmaps);
    _presetParentSealForBlock(startBlock + slashableDowntime, 1, _bitmaps);
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
    return (_epochNumber - 1) * epochSize + 1;
  }
}

contract DowntimeSlasherTestInitialize is DowntimeSlasherTest {
  function test_ShouldHaveSetOwner() public {
    assertEq(IOwnable(address(slasher)).owner(), address(this));
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
  function setUp() public override {
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
    blockTravel(epochSize * 4 + 2);

    uint256 _blockNumber = block.number - epochSize * 4;

    vm.expectRevert("This method is no longer supported in L2.");
    slasher.getBitmapForInterval(_blockNumber, _blockNumber);
  }
}

contract DowntimeSlasherTestSetBitmapForInterval is DowntimeSlasherTest {
  function setUp() public override {
    super.setUp();

    ph.setEpochSize(17280);

    epochSize = ph.epochSize();

    blockTravel(epochSize);
    slasher.setNumberValidators(2);
    blockNumber = block.number;
    blockNumber = blockNumber - 3;
    blockNumber = blockNumber % epochSize == 0 ? blockNumber - 1 : blockNumber;

    epoch = slasher.getEpochNumberOfBlock(blockNumber);

    slasher.setEpochSigner(epoch, 0, validator);

    slasher.setParentSealBitmap(
      blockNumber + 1,
      bytes32(0x0000000000000000000000000000000000000000000000000000000000000001)
    );
    slasher.setParentSealBitmap(
      blockNumber + 2,
      bytes32(0x0000000000000000000000000000000000000000000000000000000000000002)
    );
  }

  function test_Reverts_WhenInL2_SetBitmapForInterval() public {
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setBitmapForInterval(blockNumber, blockNumber + 1);
  }
}

contract DowntimeSlasherTestSlash_WhenSlashing is DowntimeSlasherTest {
  uint256[] private _signerIndices = new uint256[](1);
  address[] private _validatorsList = new address[](1);
  bytes32[] private _bitmaps0 = new bytes32[](1);
  bytes32[] private _bitmaps1 = new bytes32[](1);

  function setUp() public override {
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

    slashParams = DowntimeSlasherMock08.SlashParams({
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
    _startBlocks[1] = startBlock + 2;
    _endBlocks[0] = startBlock + slashableDowntime - 3;
    _endBlocks[1] = startBlock + slashableDowntime - 1;

    slashParams = DowntimeSlasherMock08.SlashParams({
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

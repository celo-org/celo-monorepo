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

contract DowntimeSlasherMock is DowntimeSlasher(true), MockUsingPrecompiles, Test {
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

contract DowntimeSlasherTest is Test, Utils {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  struct SlashingIncentives {
    // Value of LockedGold to slash from the account.
    uint256 penalty;
    // Value of LockedGold to send to the observer.
    uint256 reward;
  }

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
  uint256 public intervalSize = 4;

  uint256 nonOwnerPK;
  uint256 validatorPK;
  uint256 groupPK;

  uint256 otherValidator0PK;
  uint256 otherValidator1PK;
  uint256 otherGroupPK;

  address caller2;
  uint256 caller2PK;
  address public registryAddress = 0x000000000000000000000000000000000000ce10;
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

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

  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
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

  function test_Reverts_WhenInL2() public {
    uint256 _newPenalty = 123;
    uint256 _newReward = 67;
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setSlashingIncentives(_newPenalty, _newReward);
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

  function test_Reverts_WhenInL2() public {
    uint256 _newSlashableDowntime = 23;

    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setSlashableDowntime(_newSlashableDowntime);
  }

  function test_Emits_SlashableDowntimeSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SlashableDowntimeSet(23);

    slasher.setSlashableDowntime(23);
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

  function test_Reverts_IfEndBlockIsLessThanStartBlock() public {
    vm.expectRevert("endBlock must be greater or equal than startBlock");
    slasher.getBitmapForInterval(3, 2);
  }

  function test_Reverts_IfCurrentBlockIsPartOfInterval() public {
    vm.expectRevert("the signature bitmap for endBlock is not yet available");
    slasher.getBitmapForInterval(blockNumber, blockNumber);
  }

  function test_Reverts_IfBlockIsOlderThan4Epochs() public {
    epochSize = ph.epochSize();
    blockTravel(epochSize.mul(4).add(2));

    uint256 _blockNumber = block.number.sub(epochSize.mul(4));

    vm.expectRevert("startBlock must be within 4 epochs of the current head");
    slasher.getBitmapForInterval(_blockNumber, _blockNumber);
  }

  function test_Reverts_IfStartBlockAndEndBlockAreNotFromSameEpoch() public {
    blockTravel(ph.epochSize());

    uint256 _currentEpoch = ph.epochSize();
    uint256 _blockNumber = block.number.sub(2);

    vm.expectRevert("startBlock and endBlock must be in the same epoch");
    slasher.getBitmapForInterval(_blockNumber.sub(_currentEpoch), _blockNumber);
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

  function test_Reverts_IfIntervalWasAlreadySet() public {
    slasher.setBitmapForInterval(blockNumber, blockNumber.add(1));
    vm.expectRevert("bitmap already set");

    slasher.setBitmapForInterval(blockNumber, blockNumber.add(1));
  }

  function test_Emits_BitmapSetForIntervalEvent() public {
    vm.expectEmit(true, true, true, true);
    emit BitmapSetForInterval(
      address(this),
      blockNumber,
      blockNumber.add(1),
      bytes32(0x0000000000000000000000000000000000000000000000000000000000000003)
    );
    slasher.setBitmapForInterval(blockNumber, blockNumber.add(1));
  }

  function test_Reverts_WhenInL2_SetBitmapForInterval() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.setBitmapForInterval(blockNumber, blockNumber.add(1));
  }
}

contract DowntimeSlasherTestSlash_WhenIntervalInSameEpoch is DowntimeSlasherTest {
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

  function test_Reverts_IfFirstBlockWasSigned_WhenSlashableIntervalInSameEpoch() public {
    slasher.setEpochSigner(epoch, validatorIndexInEpoch, validator);
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);

    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock.add(1), slashableDowntime.sub(1), _bitmaps0);
    // First block with every validator signatures
    _bitmaps1[0] = bitmapVI01;
    _presetParentSealForBlock(startBlock, 1, _bitmaps1);

    (uint256[] memory startBlocks, uint256[] memory endBlocks) = _calculateEverySlot(startBlock);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: startBlocks,
      endBlocks: endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("not down");

    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_IfLastBlockWasSigned() public {
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);

    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime.sub(1), _bitmaps0);

    // Last block with every validator signatures
    _bitmaps1[0] = bitmapVI01;
    _presetParentSealForBlock(startBlock.add(slashableDowntime.sub(1)), 1, _bitmaps1);

    (uint256[] memory startBlocks, uint256[] memory endBlocks) = _calculateEverySlot(startBlock);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: startBlocks,
      endBlocks: endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("not down");

    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_IfOneBlockInTheMiddleWasSigned() public {
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);

    // Set the parentSeal bitmaps for every block without the validator's signature
    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime, _bitmaps0);

    // Middle block with every validator signatures
    _bitmaps1[0] = bitmapVI01;
    _presetParentSealForBlock(startBlock.add(intervalSize), 1, _bitmaps1);

    (uint256[] memory startBlocks, uint256[] memory endBlocks) = _calculateEverySlot(startBlock);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: startBlocks,
      endBlocks: endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("not down");

    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_IfFirstBlockSignedUsingBigIndex() public {
    slasher.setNumberValidators(100);
    slasher.setEpochSigner(epoch, 99, otherValidator1);

    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    _signerIndices[0] = 99;
    _validatorsList[0] = otherValidator1;
    // Set the parentSeal bitmaps for every block without the validator's signature
    _bitmaps0[0] = bitmapVI0;
    _presetParentSealForBlock(startBlock.add(1), slashableDowntime.sub(1), _bitmaps0);

    // Middle block with every validator signatures
    _bitmaps1[0] = bitmapVI99;
    _presetParentSealForBlock(startBlock, 1, _bitmaps1);

    (uint256[] memory startBlocks, uint256[] memory endBlocks) = _calculateEverySlot(startBlock);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: startBlocks,
      endBlocks: endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("not down");

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

    _generateProofs(_startBlocks, _endBlocks);

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

    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_SucceedsIfIntervalsOverlap_WhenIntervalCoverSlashableDowntimeWindow() public {
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime, _bitmaps0);

    uint256[] memory _startBlocks = new uint256[](2);
    uint256[] memory _endBlocks = new uint256[](2);
    _startBlocks[0] = startBlock;
    _startBlocks[1] = startBlock.add(2);
    _endBlocks[0] = startBlock.add(slashableDowntime.sub(3));
    _endBlocks[1] = startBlock.add(slashableDowntime.sub(1));

    _generateProofs(_startBlocks, _endBlocks);

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

    uint256 balance = lockedGold.accountTotalLockedGold(validator);

    assertEq(balance, 40000);
  }

  function test_SucceedsIfIntervalsCoverMoreThanSlashableDowntimeWindow() public {
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime, _bitmaps0);

    uint256[] memory _startBlocks = new uint256[](2);
    uint256[] memory _endBlocks = new uint256[](2);
    _startBlocks[0] = startBlock;
    _startBlocks[1] = startBlock.add(intervalSize);
    _endBlocks[0] = startBlock.add(intervalSize.sub(1));
    _endBlocks[1] = startBlock.add(slashableDowntime.add(3));

    for (uint256 i = 0; i < _startBlocks.length; i++) {
      _presetParentSealForBlock(_startBlocks[i], _endBlocks[i].sub(_startBlocks[i]), _bitmaps0);
    }
    _generateProofs(_startBlocks, _endBlocks);

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

    uint256 balance = lockedGold.accountTotalLockedGold(validator);

    assertEq(balance, 40000);
  }

  function test_Reverts_IfIntervalsAreNotContinuous() public {
    // The slashableDowntime is covered with interval(0) and interval(2), but
    // interval(1) breaks the interval contiguity.
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime, _bitmaps0);

    uint256[] memory _startBlocks = new uint256[](3);
    uint256[] memory _endBlocks = new uint256[](3);
    _startBlocks[0] = startBlock;
    _startBlocks[1] = startBlock.add(intervalSize.mul(2));
    _startBlocks[2] = startBlock.add(intervalSize);
    _endBlocks[0] = _startBlocks[0].add(intervalSize.sub(1));
    _endBlocks[1] = _startBlocks[1].add(intervalSize.add(1));
    _endBlocks[2] = startBlock.add(slashableDowntime.sub(1));

    for (uint256 i = 0; i < _startBlocks.length; i++) {
      _presetParentSealForBlock(
        _startBlocks[i],
        _endBlocks[i].sub(_startBlocks[i].add(1)),
        _bitmaps0
      );
    }

    _generateProofs(_startBlocks, _endBlocks);

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

    vm.expectRevert(
      "each interval must start at most one block after the end of the previous interval"
    );
    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_WhenIntervalDontCoverSlashableDowntimeWindow() public {
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);
    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _presetParentSealForBlock(startBlock, slashableDowntime, _bitmaps0);

    uint256[] memory _startBlocks = new uint256[](2);
    uint256[] memory _endBlocks = new uint256[](3);
    _startBlocks[0] = startBlock;
    _startBlocks[1] = startBlock.add(intervalSize);
    _endBlocks[0] = _startBlocks[0].add(intervalSize.sub(1));
    _endBlocks[1] = _startBlocks[1].add(intervalSize.add(1));
    _endBlocks[2] = startBlock.add(slashableDowntime.sub(1));

    for (uint256 i = 0; i < _startBlocks.length; i++) {
      _presetParentSealForBlock(
        _startBlocks[i],
        _endBlocks[i].sub(_startBlocks[i].add(1)),
        _bitmaps0
      );
    }

    _generateProofs(_startBlocks, _endBlocks);

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

    vm.expectRevert("startBlocks and endBlocks must have the same length");
    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Emits_DowntimeSlashPerformedEvent() public {
    slasher.setEpochSigner(epoch, 0, validator);
    uint256 startBlock = _getFirstBlockNumberOfEpoch(epoch);

    (uint256[] memory _startBlocks, uint256[] memory _endBlocks) = _ensureValidatorIsSlashable(
      startBlock,
      _signerIndices
    );

    uint256 endBlock = _endBlocks[_endBlocks.length.sub(1)];

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

    vm.expectEmit(true, true, true, true);
    emit DowntimeSlashPerformed(validator, startBlock, endBlock);

    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_ShouldDecrementGold() public {
    _setupSlashTest();
    uint256 _balance = lockedGold.accountTotalLockedGold(validator);
    assertEq(_balance, 40000);
  }

  function test_AlsoSlashesGroup() public {
    _setupSlashTest();
    uint256 _balance = lockedGold.accountTotalLockedGold(group);
    assertEq(_balance, 40000);
  }
  function test_ItCanBeSlashedTwiceInSameEpoch() public {
    _setupSlashTest();
    uint256 _balance = lockedGold.accountTotalLockedGold(validator);
    assertEq(_balance, 40000);

    uint256 newStartBlock = _getFirstBlockNumberOfEpoch(epoch).add(slashableDowntime.mul(2));

    uint256[] memory validatorIndices = new uint256[](2);
    validatorIndices[0] = validatorIndexInEpoch;
    validatorIndices[1] = validatorIndexInEpoch;
    (uint256[] memory _startBlocks, uint256[] memory _endBlocks) = _ensureValidatorIsSlashable(
      newStartBlock,
      validatorIndices
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

    _balance = lockedGold.accountTotalLockedGold(validator);
    assertEq(_balance, 30000);
  }
}

contract DowntimeSlasherTestSlash_WhenIntervalCrossingEpoch is DowntimeSlasherTest {
  uint256 startBlock;

  uint256[] private _signerIndices = new uint256[](2);
  bytes32[] private _bitmaps0 = new bytes32[](2);
  bytes32[] private _bitmaps1 = new bytes32[](1);
  address[] private _validatorsList = new address[](2);

  function setUp() public {
    super.setUp();

    _signerIndices[0] = validatorIndexInEpoch;
    _signerIndices[1] = validatorIndexInEpoch;

    _validatorsList[0] = validator;
    _validatorsList[1] = validator;

    _setEpochSettings();

    epoch = epoch.add(1);

    _waitUntilSafeBlocks(epoch);
    slasher.setEpochSigner(epoch, validatorIndexInEpoch, validator);
    startBlock = _getFirstBlockNumberOfEpoch(epoch).sub(intervalSize);

    slasher.setEpochSigner(epoch, validatorIndexInEpoch, validator);
  }

  function test_Reverts_IfItDidNotSwitchIndices_WhenLastBlockWasSigned() public {
    slasher.setEpochSigner(epoch.sub(1), validatorIndexInEpoch, validator);

    _bitmaps0[0] = bitmapWithoutValidator[validatorIndexInEpoch];
    _bitmaps0[1] = bitmapWithoutValidator[validatorIndexInEpoch];
    _bitmaps1[0] = bitmapVI01;

    _presetParentSealForBlock(startBlock, slashableDowntime.sub(1), _bitmaps0);

    _presetParentSealForBlock(startBlock.add(slashableDowntime).sub(1), 1, _bitmaps1);

    (uint256[] memory startBlocks, uint256[] memory endBlocks) = _calculateEverySlot(startBlock);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: startBlocks,
      endBlocks: endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("not down");

    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_IfSwitchedIndices_WhenLastBlockWasSigned() public {
    slasher.setEpochSigner(epoch.sub(1), 1, validator);

    _bitmaps0[0] = bitmapWithoutValidator[1];
    _bitmaps0[1] = bitmapWithoutValidator[validatorIndexInEpoch];
    _bitmaps1[0] = bitmapVI01;

    _presetParentSealForBlock(startBlock, slashableDowntime.sub(1), _bitmaps0);

    _presetParentSealForBlock(startBlock.add(slashableDowntime).sub(1), 1, _bitmaps1);

    (uint256[] memory startBlocks, uint256[] memory endBlocks) = _calculateEverySlot(startBlock);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: startBlocks,
      endBlocks: endBlocks,
      signerIndices: _signerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert("not down");

    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_SucceedsWithValidatorIndexChange_WhenValidatorWasDown() public {
    slasher.setEpochSigner(epoch.sub(1), validatorIndexInEpoch, validator);

    _signerIndices[0] = 1;
    _signerIndices[1] = validatorIndexInEpoch;

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

    uint256 balance = lockedGold.accountTotalLockedGold(validator);

    assertEq(balance, 40000);
  }

  function test_SucceedsWithoutValidatorIndexChange_WhenValidatorWasDown() public {
    slasher.setEpochSigner(epoch.sub(1), validatorIndexInEpoch, validator);

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

    uint256 balance = lockedGold.accountTotalLockedGold(validator);

    assertEq(balance, 40000);
  }

  function test_Reverts_IfIndicesDontMatchSameValidato_WhenValidatorWasDown() public {
    slasher.setEpochSigner(epoch.sub(1), 1, validator);
    slasher.setEpochSigner(epoch, 1, otherValidator0);

    _validatorsList[0] = validator;
    _validatorsList[1] = otherValidator0;

    _signerIndices[0] = 1;
    _signerIndices[1] = validatorIndexInEpoch;

    (uint256[] memory _startBlocks, uint256[] memory _endBlocks) = _ensureValidatorIsSlashable(
      startBlock,
      _signerIndices
    );
    uint256[] memory _wrongSignerIndices = new uint256[](2);
    _wrongSignerIndices[0] = 1;
    _wrongSignerIndices[1] = 1;

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: _startBlocks,
      endBlocks: _endBlocks,
      signerIndices: _wrongSignerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });
    vm.expectRevert("indices do not point to the same validator");
    slasher.mockSlash(slashParams, _validatorsList);
  }

  function test_Reverts_IfValidatorHasNewerSlash_WhenSlashingSucceeds() public {
    slasher.setEpochSigner(epoch.sub(1), validatorIndexInEpoch, validator);
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

    uint256 newStartBlock = _getFirstBlockNumberOfEpoch(epoch.sub(1)).add(1);
    // Just to make sure that it was slashed
    uint256 balance = lockedGold.accountTotalLockedGold(validator);

    assertEq(balance, 40000);

    uint256[] memory _newSignerIndices = new uint256[](1);
    _newSignerIndices[0] = validatorIndexInEpoch;
    address[] memory newValidatorsList = new address[](1);
    newValidatorsList[0] = validator;

    (
      uint256[] memory _newStartBlocks,
      uint256[] memory _newEndBlocks
    ) = _ensureValidatorIsSlashable(newStartBlock, _newSignerIndices);

    slashParams = DowntimeSlasherMock.SlashParams({
      startBlocks: _newStartBlocks,
      endBlocks: _newEndBlocks,
      signerIndices: _newSignerIndices,
      groupMembershipHistoryIndex: 0,
      validatorElectionLessers: validatorElectionLessers,
      validatorElectionGreaters: validatorElectionGreaters,
      validatorElectionIndices: validatorElectionIndices,
      groupElectionLessers: groupElectionLessers,
      groupElectionGreaters: groupElectionGreaters,
      groupElectionIndices: groupElectionIndices
    });

    vm.expectRevert(
      "cannot slash validator for downtime for which they may already have been slashed"
    );
    slasher.mockSlash(slashParams, newValidatorsList);
  }
}

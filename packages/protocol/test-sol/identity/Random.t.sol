// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import { Utils } from "@test-sol/utils.sol";

import "@celo-contracts/identity/Random.sol";
import "@celo-contracts/identity/test/RandomTest.sol";

contract RandomnessTest_SetRandomnessRetentionWindow is Test, IsL2Check {
  event RandomnessBlockRetentionWindowSet(uint256 value);

  RandomTest random;

  function setUp() public {
    random = new RandomTest();
    random.initialize(256);
  }

  function test_ShouldSetTheVariable() public {
    random.setRandomnessBlockRetentionWindow(1000);
    assertEq(random.randomnessBlockRetentionWindow(), 1000);
  }

  function test_Emits_TheEvent() public {
    vm.expectEmit(true, true, true, true);
    emit RandomnessBlockRetentionWindowSet(1000);
    random.setRandomnessBlockRetentionWindow(1000);
  }

  function testRevert_OnlyOwnerCanSet() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(0x45));
    random.setRandomnessBlockRetentionWindow(1000);
  }

  function test_Reverts_WhenCalledOnL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
    vm.expectRevert("This method is no longer supported in L2.");
    random.setRandomnessBlockRetentionWindow(1000);
  }
}

contract RandomnessTest_AddTestRandomness is Test, Utils, IsL2Check {
  uint256 constant RETENTION_WINDOW = 5;
  uint256 constant EPOCH_SIZE = 10;

  RandomTest random;

  function setUp() public {
    random = new RandomTest();
    random.initialize(256);
  }

  function test_ShouldBeAbleToSimulateAddingRandomness() public {
    random.addTestRandomness(1, 0x0000000000000000000000000000000000000000000000000000000000000001);
    random.addTestRandomness(2, 0x0000000000000000000000000000000000000000000000000000000000000002);
    random.addTestRandomness(3, 0x0000000000000000000000000000000000000000000000000000000000000003);
    random.addTestRandomness(4, 0x0000000000000000000000000000000000000000000000000000000000000004);
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000001,
      random.getTestRandomness(1, 4)
    );
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000002,
      random.getTestRandomness(2, 4)
    );
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000003,
      random.getTestRandomness(3, 4)
    );
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000004,
      random.getTestRandomness(4, 4)
    );
  }

  function setUpWhenChangingHistorySmaller() private {
    random.addTestRandomness(1, 0x0000000000000000000000000000000000000000000000000000000000000001);
    random.addTestRandomness(2, 0x0000000000000000000000000000000000000000000000000000000000000002);
    random.addTestRandomness(3, 0x0000000000000000000000000000000000000000000000000000000000000003);
    random.addTestRandomness(4, 0x0000000000000000000000000000000000000000000000000000000000000004);
    random.setRandomnessBlockRetentionWindow(2);
  }

  function test_canStillAddRandomness_whenChangingHistorySmaller() public {
    setUpWhenChangingHistorySmaller();
    random.addTestRandomness(5, 0x0000000000000000000000000000000000000000000000000000000000000005);
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000005,
      random.getTestRandomness(5, 5)
    );
  }

  function test_cannotReadOldBlocks_whenChangingHistorySmaller() public {
    setUpWhenChangingHistorySmaller();
    vm.expectRevert("Cannot query randomness older than the stored history");
    random.getTestRandomness(3, 5);
  }

  function setUpWhenChangingHistoryLarger() private {
    random.setRandomnessBlockRetentionWindow(2);
    random.addTestRandomness(1, 0x0000000000000000000000000000000000000000000000000000000000000001);
    random.addTestRandomness(2, 0x0000000000000000000000000000000000000000000000000000000000000002);
    random.addTestRandomness(3, 0x0000000000000000000000000000000000000000000000000000000000000003);
    random.addTestRandomness(4, 0x0000000000000000000000000000000000000000000000000000000000000004);
    random.setRandomnessBlockRetentionWindow(4);
  }

  function test_CanStillAddRandomness_WhenChangingHistoryLarger() public {
    setUpWhenChangingHistoryLarger();
    random.addTestRandomness(5, 0x0000000000000000000000000000000000000000000000000000000000000005);
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000005,
      random.getTestRandomness(5, 5)
    );
  }

  function test_CannotReadOldBlocks_WhenChangingHistoryLarger() public {
    setUpWhenChangingHistoryLarger();
    vm.expectRevert("Cannot query randomness older than the stored history");
    random.getTestRandomness(1, 5);
  }

  function test_OldValuesArePreserved_WhenChangingHistoryLarger() public {
    setUpWhenChangingHistoryLarger();
    random.addTestRandomness(5, 0x0000000000000000000000000000000000000000000000000000000000000005);
    random.addTestRandomness(6, 0x0000000000000000000000000000000000000000000000000000000000000006);
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000003,
      random.getTestRandomness(3, 6)
    );
  }

  function setUpWhenRelyingOnTheLastBlockOfEachEpochsRandomness()
    private
    returns (uint256 lastBlockOfEpoch)
  {
    bytes32 defaultValue = 0x0000000000000000000000000000000000000000000000000000000000000002;
    bytes32 valueForLastBlockOfEpoch = 0x0000000000000000000000000000000000000000000000000000000000000001;

    ph.setEpochSize(EPOCH_SIZE);
    random.setRandomnessBlockRetentionWindow(RETENTION_WINDOW);

    // Epoch
    // [1         , 2                           , 2             , 3                                                        ]
    // Blocks
    // [EPOCH_SIZE, EPOCH_SIZE+1... EPOCH_SIZE+n, 2 * EPOCH_SIZE, 2 * EPOCH_SIZE + 1... 2 * EPOCH_SIZE + RETENTION_WINDOW-1]

    // go to last block of epoch 1
    vm.roll(EPOCH_SIZE);
    // Add randomness to epoch's last block
    random.addTestRandomness(block.number, valueForLastBlockOfEpoch);

    // Add a different randomness to all but last epoch blocks
    for (uint256 i = 0; i < EPOCH_SIZE - 1; i++) {
      blockTravel(1);
      random.addTestRandomness(block.number, defaultValue);
    }

    // Add randomness to epoch's last block
    blockTravel(1);
    random.addTestRandomness(block.number, valueForLastBlockOfEpoch);

    // Now we add `RETENTION_WINDOW` worth of blocks' randomness to flush out the new lastEpochBlock
    // This means we can test `lastEpochBlock` stores epoch i+1's last block,
    // and we test that epoch i's last block is not retained.
    for (uint256 i = 0; i < RETENTION_WINDOW + 1; i++) {
      blockTravel(1);
      random.addTestRandomness(block.number, defaultValue);
    }

    return EPOCH_SIZE * 2;
  }

  function test_shouldRetainTheLastEpochBlocksRandomness_WhenRelyingOnTheLastBlockOfEachEpochsRandomness()
    public
  {
    uint256 lastBlockOfEpoch = setUpWhenRelyingOnTheLastBlockOfEachEpochsRandomness();

    // Get start of epoch and then subtract one for last block of previous epoch
    assertEq(
      0x0000000000000000000000000000000000000000000000000000000000000001,
      random.getTestRandomness(lastBlockOfEpoch, block.number)
    );
  }

  function test_shouldRetainTheUsualRetentionWindowWorthOfBlocks_WhenRelyingOnTheLastBlockOfEachEpochsRandomness()
    public
  {
    setUpWhenRelyingOnTheLastBlockOfEachEpochsRandomness();

    for (uint256 i = 0; i < RETENTION_WINDOW; i++) {
      assertEq(
        random.getTestRandomness(block.number - i, block.number),
        0x0000000000000000000000000000000000000000000000000000000000000002
      );
    }
  }

  function test_shouldStillNotRetainOtherBlocksNotCoveredByTheRetentionWindow_WhenRelyingOnTheLastBlockOfEachEpochsRandomness()
    public
  {
    setUpWhenRelyingOnTheLastBlockOfEachEpochsRandomness();
    vm.expectRevert("Cannot query randomness older than the stored history");
    random.getTestRandomness(block.number - RETENTION_WINDOW, block.number);
  }

  function test_shouldNotRetainTheLastEpochBlockOfPreviousEpochs_WhenRelyingOnTheLastBlockOfEachEpochsRandomness()
    public
  {
    uint256 lastBlockOfEpoch = setUpWhenRelyingOnTheLastBlockOfEachEpochsRandomness();

    vm.expectRevert("Cannot query randomness older than the stored history");
    random.getTestRandomness(lastBlockOfEpoch - EPOCH_SIZE, block.number);
  }

  function test_Reverts_WhenCalledOnL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
    vm.expectRevert("This method is no longer supported in L2.");
    random.addTestRandomness(1, 0x0000000000000000000000000000000000000000000000000000000000000001);
    vm.expectRevert("This method is no longer supported in L2.");
    random.getTestRandomness(1, 4);
  }
}

contract RandomnessTest_RevealAndCommit is Test, Utils, IsL2Check {
  address constant ACCOUNT = address(0x01);
  bytes32 constant RANDONMESS = bytes32(uint256(0x00));

  RandomTest random;

  function setUp() public {
    random = new RandomTest();
    random.initialize(256);
    random.setRandomnessBlockRetentionWindow(256);
  }

  function commitmentFor(uint256 value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes32(value)));
  }

  function testRevert_CannotAddZeroCommitment() public {
    vm.expectRevert("cannot commit zero randomness");
    random.testRevealAndCommit(RANDONMESS, commitmentFor(0x00), ACCOUNT);
  }

  function test_CanAddInitialCommitment() public {
    random.testRevealAndCommit(RANDONMESS, commitmentFor(0x01), ACCOUNT);
  }

  function test_CanRevealInitialCommitment() public {
    blockTravel(2);
    random.testRevealAndCommit(RANDONMESS, commitmentFor(0x01), ACCOUNT);
    blockTravel(1);
    random.testRevealAndCommit(bytes32(uint256(0x01)), commitmentFor(0x02), ACCOUNT);

    bytes32 lastRandomness = random.getBlockRandomness(block.number - 1);
    bytes32 expected = keccak256(abi.encodePacked(lastRandomness, bytes32(uint256(0x01))));

    assertEq(random.getBlockRandomness(block.number), expected);
  }

  function test_Reverts_WhenCalledOnL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
    vm.expectRevert("This method is no longer supported in L2.");
    blockTravel(2);
    random.testRevealAndCommit(RANDONMESS, commitmentFor(0x01), ACCOUNT);
  }
}

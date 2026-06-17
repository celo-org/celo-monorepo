// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

import "@celo-contracts/identity/interfaces/IRandomMock.sol";

// Random was migrated to contracts-0.8; the deployable mocks (MockRandom08, RandomTest08)
// live in test-sol/unit/identity/CompileRandom.t.sol and are deployed via deployCodeTo.

contract RandomTest_ is TestWithUtils {
  IRandomMock random;

  event RandomnessBlockRetentionWindowSet(uint256 value);

  function setUp() public {
    super.setUp();
    address randomAddress = actor("random");
    deployCodeTo("RandomTest08", randomAddress);
    random = IRandomMock(randomAddress);
    random.initialize(256);
    whenL2WithEpochManagerInitialization();
  }

  function commitmentFor(uint256 value) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes32(value)));
  }
}

contract RandomTest_SetRandomnessRetentionWindow is RandomTest_ {
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    random.setRandomnessBlockRetentionWindow(1000);
  }
}

contract RandomTest_AddTestRandomness is RandomTest_ {
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    random.addTestRandomness(1, 0x0000000000000000000000000000000000000000000000000000000000000001);
    vm.expectRevert("This method is no longer supported in L2.");
    random.getTestRandomness(1, 4);
  }
}

contract RandomTest_RevealAndCommit is RandomTest_ {
  address constant ACCOUNT = address(0x01);
  bytes32 constant RANDONMESS = bytes32(uint256(0x00));

  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    blockTravel(2);
    random.revealAndCommitForTest(RANDONMESS, commitmentFor(0x01), ACCOUNT);
  }
}

contract RandomTest_Commitments is RandomTest_ {
  address constant ACCOUNT = address(0x01);

  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    random.commitments(ACCOUNT);
  }
}

contract RandomTest_RandomnessBlockRetentionWindow is RandomTest_ {
  function test_Reverts_WhenCalledOnL2() public {
    vm.expectRevert("This method is no longer supported in L2.");
    random.randomnessBlockRetentionWindow();
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

import { RandomTest08 } from "@test-sol/unit/identity/mocks/RandomMocks08.sol";

// Random was migrated to contracts-0.8; the deployable test helper (RandomTest08)
// lives in test-sol/unit/identity/mocks/RandomMocks08.sol and is now instantiated
// directly as a concrete 0.8 type.

contract RandomTest_ is TestWithUtils08 {
  RandomTest08 random;

  event RandomnessBlockRetentionWindowSet(uint256 value);

  function setUp() public override {
    super.setUp();
    random = new RandomTest08();
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

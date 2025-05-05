// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";

import "@celo-contracts/identity/Random.sol";
import "@celo-contracts/identity/test/RandomTest.sol";

contract RandomTest_ is TestWithUtils {
  RandomTest random;

  event RandomnessBlockRetentionWindowSet(uint256 value);

  function setUp() public {
    super.setUp();
    random = new RandomTest();
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
    random.testRevealAndCommit(RANDONMESS, commitmentFor(0x01), ACCOUNT);
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

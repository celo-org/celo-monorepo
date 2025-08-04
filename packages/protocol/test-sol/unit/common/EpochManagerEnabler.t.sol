// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.8.20;

import { ICeloUnreleasedTreasury } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

import { CeloUnreleasedTreasury } from "@celo-contracts-8/common/CeloUnreleasedTreasury.sol";
import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { EpochManagerEnablerMock } from "@test-sol/mocks/EpochManagerEnablerMock.sol";
import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import "@test-sol/utils/WhenL2-08.sol";

contract EpochManagerEnablerTest is TestWithUtils08 {
  EpochManagerEnablerMock epochManagerEnablerContract;
  EpochManager_WithMocks public epochManagerContract;

  address nonOwner;

  event LastKnownEpochNumberSet(uint256 lastKnownEpochNumber);
  event LastKnownFirstBlockOfEpochSet(uint256 lastKnownFirstBlockOfEpoch);
  event LastKnownElectedAccountsSet();

  function setUp() public virtual override {
    super.setUp();

    epochManagerEnablerContract = new EpochManagerEnablerMock();

    nonOwner = actor("nonOwner");

    registry.setAddressFor(EpochManagerEnablerContract, address(epochManagerEnablerContract));

    epochManagerEnablerContract.initialize(REGISTRY_ADDRESS);
  }
}

contract EpochManagerEnablerTest_L2 is EpochManagerEnablerTest, WhenL2NoInitialization {
  function setUp() public override(EpochManagerEnablerTest, WhenL2NoInitialization) {
    super.setUp();
  }
}
contract EpochManagerEnablerTest_L2_NoCapture is EpochManagerEnablerTest, WhenL2NoCapture {
  function setUp() public override(EpochManagerEnablerTest, WhenL2NoCapture) {
    super.setUp();
  }
}

contract EpochManagerEnablerTest_initialize is EpochManagerEnablerTest {
  function test_initialize() public {
    assertEq(address(epochManagerEnablerContract.registry()), REGISTRY_ADDRESS);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManagerEnablerContract.initialize(REGISTRY_ADDRESS);
  }
}

contract EpochManagerEnablerTest_initEpochManager is EpochManagerEnablerTest {
  function test_Reverts_whenL1() public {
    vm.expectRevert("This method is not supported in L1.");

    epochManagerEnablerContract.initEpochManager();
  }
}

contract EpochManagerEnablerTest_initEpochManager_L2 is EpochManagerEnablerTest_L2 {
  function test_CanBeCalledByAnyone() public {
    vm.prank(nonOwner);
    epochManagerEnablerContract.initEpochManager();

    assertGt(epochManager.getElectedAccounts().length, 0);
    assertTrue(epochManager.systemAlreadyInitialized());
  }
}

contract EpochManagerEnablerTest_initEpochManager_L2_NoCapture is
  EpochManagerEnablerTest_L2_NoCapture
{
  function test_Reverts_ifEpochAndValidatorsAreNotCaptured() public {
    vm.expectRevert("lastKnownEpochNumber not set.");

    epochManagerEnablerContract.initEpochManager();
  }
}

contract EpochManagerEnablerTest_captureEpochAndValidators is EpochManagerEnablerTest {
  function setUp() public override {
    super.setUp();
    _registerAndElectValidatorsForL2();
  }

  function test_shouldSetLastKnownElectedAccounts() public {
    epochManagerEnablerContract.captureEpochAndValidators();

    assertEq(epochManagerEnablerContract.getlastKnownElectedAccounts().length, numberValidators);
  }

  function test_shouldSetLastKnownEpochNumber() public {
    epochManagerEnablerContract.captureEpochAndValidators();

    assertEq(epochManagerEnablerContract.lastKnownEpochNumber(), 3);
  }

  function test_shouldSetLastKnownFirstBlockOfEpoch() public {
    epochManagerEnablerContract.captureEpochAndValidators();

    assertEq(epochManagerEnablerContract.lastKnownFirstBlockOfEpoch(), 17280 * 2);
  }

  function test_Emits_LastKnownEpochNumberSet() public {
    vm.expectEmit(true, true, true, true);
    emit LastKnownEpochNumberSet(3);

    epochManagerEnablerContract.captureEpochAndValidators();
  }

  function test_Emits_LastKnownElectedAccountsSet() public {
    vm.expectEmit(true, true, true, true);
    emit LastKnownElectedAccountsSet();

    epochManagerEnablerContract.captureEpochAndValidators();
  }

  function test_Emits_LastKnownFirstBlockOfEpochSet() public {
    vm.expectEmit(true, true, true, true);
    emit LastKnownFirstBlockOfEpochSet(34560);

    epochManagerEnablerContract.captureEpochAndValidators();
  }
}

contract EpochManagerEnablerTest_captureEpochAndValidators_L2 is EpochManagerEnablerTest_L2 {
  function test_Reverts_whenL2() public {
    whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    epochManagerEnablerContract.captureEpochAndValidators();
  }
}

contract EpochManagerEnablerTest_getFirstBlockOfEpoch is EpochManagerEnablerTest {
  function test_blockIsEpockBlock() public {
    vm.roll(27803520);
    epochManagerEnablerContract.setFirstBlockOfEpoch();
    assertEq(epochManagerEnablerContract.lastKnownFirstBlockOfEpoch(), 27803520);
  }

  function test_blockIsNotEpochBlock() public {
    vm.roll(27817229);
    epochManagerEnablerContract.setFirstBlockOfEpoch();
    assertEq(epochManagerEnablerContract.lastKnownFirstBlockOfEpoch(), 27803520);
  }
}

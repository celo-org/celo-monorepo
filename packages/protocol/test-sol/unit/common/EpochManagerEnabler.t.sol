// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/EpochManager.sol";

import { EpochManagerEnablerMock } from "@test-sol/mocks/EpochManagerEnablerMock.sol";

import { CeloUnreleasedTreasure } from "@celo-contracts-8/common/CeloUnreleasedTreasure.sol";
import { ICeloUnreleasedTreasure } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasure.sol";
import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";

import { TestConstants } from "@test-sol/constants.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import { ValidatorsMock } from "@test-sol/unit/governance/validators/mocks/ValidatorsMock.sol";
import { MockCeloUnreleasedTreasure } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasure.sol";

contract EpochManagerEnablerTest is Test, TestConstants, Utils08 {
  EpochManager epochManager;
  EpochManagerEnablerMock epochManagerEnabler;
  MockCeloUnreleasedTreasure celoUnreleasedTreasure;

  IRegistry registry;
  IAccounts accounts;

  address accountsAddress;
  address nonOwner;

  uint256 epochDuration = DAY;
  uint256 numberValidators = 100;

  function setUp() public virtual {
    epochManager = new EpochManager(true);
    epochManagerEnabler = new EpochManagerEnablerMock();

    celoUnreleasedTreasure = new MockCeloUnreleasedTreasure();

    accountsAddress = actor("accountsAddress");

    nonOwner = actor("nonOwner");

    deployCodeTo("MockRegistry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("Accounts.sol", abi.encode(false), accountsAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
    accounts = IAccounts(accountsAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManager));
    registry.setAddressFor(EpochManagerEnablerContract, address(epochManagerEnabler));
    registry.setAddressFor(AccountsContract, address(accounts));

    registry.setAddressFor(CeloUnreleasedTreasureContract, address(celoUnreleasedTreasure));

    vm.deal(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);

    epochManagerEnabler.initialize(REGISTRY_ADDRESS);
    epochManager.initialize(REGISTRY_ADDRESS, epochDuration);

    _setupValidators();
    travelEpochL1(vm);
    travelEpochL1(vm);
  }

  function _setupValidators() internal {
    for (uint256 i = 0; i < numberValidators; i++) {
      vm.prank(vm.addr(i + 1));
      accounts.createAccount();

      epochManagerEnabler.addValidator(vm.addr(i + 1));
    }
  }
}

contract EpochManagerEnablerTest_initialize is EpochManagerEnablerTest {
  function test_initialize() public {
    assertEq(address(epochManagerEnabler.registry()), REGISTRY_ADDRESS);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManagerEnabler.initialize(REGISTRY_ADDRESS);
  }
}

contract EpochManagerEnablerTest_initEpochManager is EpochManagerEnablerTest {
  function test_CanBeCalledByAnyone() public {
    travelEpochL1(vm);
    travelEpochL1(vm);
    epochManagerEnabler.captureEpochAndValidators();

    whenL2(vm);
    vm.prank(nonOwner);
    epochManagerEnabler.initEpochManager();

    assertGt(epochManager.getElected().length, 0);
    assertTrue(epochManager.systemAlreadyInitialized());
  }

  function test_Reverts_ifEpochAndValidatorsAreNotCaptured() public {
    whenL2(vm);
    vm.expectRevert("lastKnownEpochNumber not set.");

    epochManagerEnabler.initEpochManager();
  }

  function test_Reverts_whenL1() public {
    vm.expectRevert("This method is not supported in L1.");

    epochManagerEnabler.initEpochManager();
  }
}

contract EpochManagerEnablerTest_captureEpochAndValidators is EpochManagerEnablerTest {
  function test_Reverts_whenL2() public {
    travelEpochL1(vm);
    whenL2(vm);
    vm.expectRevert("This method is no longer supported in L2.");
    epochManagerEnabler.captureEpochAndValidators();
  }

  function test_shouldSetLastKnownElectedAccounts() public {
    travelEpochL1(vm);
    epochManagerEnabler.captureEpochAndValidators();

    assertEq(epochManagerEnabler.getlastKnownElectedAccounts().length, numberValidators);
  }

  function test_shouldSetLastKnownEpochNumber() public {
    travelEpochL1(vm);
    epochManagerEnabler.captureEpochAndValidators();

    assertEq(epochManagerEnabler.lastKnownEpochNumber(), 4);
  }

  function test_shouldSetLastKnownFirstBlockOfEpoch() public {
    travelEpochL1(vm);
    epochManagerEnabler.captureEpochAndValidators();

    assertEq(epochManagerEnabler.lastKnownFirstBlockOfEpoch(), 17280 * 3);
  }
}

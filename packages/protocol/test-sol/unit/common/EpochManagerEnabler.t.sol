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
import "@celo-contracts-8/common/test/MockCeloToken.sol";

contract EpochManagerEnablerTest is Test, TestConstants, Utils08 {
  EpochManager epochManager;
  EpochManagerEnablerMock epochManagerEnabler;
  MockCeloUnreleasedTreasure celoUnreleasedTreasure;
  MockCeloToken08 celoToken;

  IRegistry registry;
  IAccounts accounts;

  address accountsAddress;
  address nonOwner;

  uint256 epochDuration = DAY;
  uint256 numberValidators = 100;

  event LastKnownEpochNumberSet(uint256 lastKnownEpochNumber);
  event LastKnownFirstBlockOfEpochSet(uint256 lastKnownFirstBlockOfEpoch);
  event LastKnownElectedAccountsSet();

  function setUp() public virtual {
    ph.setEpochSize(17280);
    epochManager = new EpochManager(true);
    epochManagerEnabler = new EpochManagerEnablerMock();
    celoToken = new MockCeloToken08();

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
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(CeloUnreleasedTreasureContract, address(celoUnreleasedTreasure));

    celoToken.setTotalSupply(CELO_SUPPLY_CAP);
    celoToken.setBalanceOf(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);

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
    whenL2(vm);
    vm.expectRevert("This method is no longer supported in L2.");
    epochManagerEnabler.captureEpochAndValidators();
  }

  function test_shouldSetLastKnownElectedAccounts() public {
    epochManagerEnabler.captureEpochAndValidators();

    assertEq(epochManagerEnabler.getlastKnownElectedAccounts().length, numberValidators);
  }

  function test_shouldSetLastKnownEpochNumber() public {
    epochManagerEnabler.captureEpochAndValidators();

    assertEq(epochManagerEnabler.lastKnownEpochNumber(), 3);
  }

  function test_shouldSetLastKnownFirstBlockOfEpoch() public {
    epochManagerEnabler.captureEpochAndValidators();

    assertEq(epochManagerEnabler.lastKnownFirstBlockOfEpoch(), 17280 * 2);
  }

  function test_Emits_LastKnownEpochNumberSet() public {
    vm.expectEmit(true, true, true, true);
    emit LastKnownEpochNumberSet(3);

    epochManagerEnabler.captureEpochAndValidators();
  }

  function test_Emits_LastKnownElectedAccountsSet() public {
    vm.expectEmit(true, true, true, true);
    emit LastKnownElectedAccountsSet();

    epochManagerEnabler.captureEpochAndValidators();
  }

  function test_Emits_LastKnownFirstBlockOfEpochSet() public {
    vm.expectEmit(true, true, true, true);
    emit LastKnownFirstBlockOfEpochSet(34560);

    epochManagerEnabler.captureEpochAndValidators();
  }
}

contract EpochManagerEnablerTest_getFirstBlockOfEpoch is EpochManagerEnablerTest {
  function test_blockIsEpockBlock() public {
    vm.roll(27803520);
    epochManagerEnabler.setFirstBlockOfEpoch();
    assertEq(epochManagerEnabler.lastKnownFirstBlockOfEpoch(), 27803520);
  }

  function test_blockIsNotEpochBlock() public {
    vm.roll(27817229);
    epochManagerEnabler.setFirstBlockOfEpoch();
    assertEq(epochManagerEnabler.lastKnownFirstBlockOfEpoch(), 27803520);
  }
}

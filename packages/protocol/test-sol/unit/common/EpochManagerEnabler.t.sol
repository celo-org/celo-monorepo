// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.8.20;

import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";
import { ICeloUnreleasedTreasury } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

import { CeloUnreleasedTreasury } from "@celo-contracts-8/common/CeloUnreleasedTreasury.sol";
import "@celo-contracts-8/common/test/MockCeloToken.sol";
import { MockCeloUnreleasedTreasury } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasury.sol";
import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";

import { Utils08 } from "@test-sol/utils08.sol";
import { EpochManagerEnablerMock } from "@test-sol/mocks/EpochManagerEnablerMock.sol";
import { ValidatorsMock } from "@test-sol/unit/governance/validators/mocks/ValidatorsMock.sol";

contract EpochManagerEnablerTest is Utils08 {
  EpochManagerEnablerMock epochManagerEnablerContract;
  MockCeloUnreleasedTreasury celoUnreleasedTreasury;
  MockCeloToken08 celoToken;

  IAccounts accounts;

  address accountsAddress;
  address nonOwner;
  address oracle;

  uint256 epochDuration = DAY;
  uint256 numberValidators = 100;

  event LastKnownEpochNumberSet(uint256 lastKnownEpochNumber);
  event LastKnownFirstBlockOfEpochSet(uint256 lastKnownFirstBlockOfEpoch);
  event LastKnownElectedAccountsSet();

  function setUp() public virtual override {
    super.setUp();
    // used by test that uses L1 epochSize()
    ph.setEpochSize(17280);

    epochManagerEnablerContract = new EpochManagerEnablerMock();
    celoToken = new MockCeloToken08();

    celoUnreleasedTreasury = new MockCeloUnreleasedTreasury();

    accountsAddress = actor("accountsAddress");

    nonOwner = actor("nonOwner");
    oracle = actor("oracle");

    deployCodeTo("Accounts.sol", abi.encode(false), accountsAddress);
    accounts = IAccounts(accountsAddress);

    registry.setAddressFor(EpochManagerEnablerContract, address(epochManagerEnablerContract));
    registry.setAddressFor(AccountsContract, address(accounts));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(SortedOraclesContract, oracle);
    registry.setAddressFor(CeloUnreleasedTreasuryContract, address(celoUnreleasedTreasury));

    celoToken.setTotalSupply(CELO_SUPPLY_CAP);
    celoToken.setBalanceOf(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);

    epochManagerEnablerContract.initialize(REGISTRY_ADDRESS);
    epochManager.initialize(REGISTRY_ADDRESS, epochDuration);

    _setupValidators();
    travelEpochL1();
    travelEpochL1();
  }

  function _setupValidators() internal {
    for (uint256 i = 0; i < numberValidators; i++) {
      vm.prank(vm.addr(i + 1));
      accounts.createAccount();

      epochManagerEnablerContract.addValidator(vm.addr(i + 1));
    }
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
  function test_CanBeCalledByAnyone() public {
    epochManagerEnablerContract.captureEpochAndValidators();

    whenL2();
    vm.prank(nonOwner);
    epochManagerEnablerContract.initEpochManager();

    assertGt(epochManager.getElectedAccounts().length, 0);
    assertTrue(epochManager.systemAlreadyInitialized());
  }

  function test_Reverts_ifEpochAndValidatorsAreNotCaptured() public {
    whenL2();
    vm.expectRevert("lastKnownEpochNumber not set.");

    epochManagerEnablerContract.initEpochManager();
  }

  function test_Reverts_whenL1() public {
    vm.expectRevert("This method is not supported in L1.");

    epochManagerEnablerContract.initEpochManager();
  }
}

contract EpochManagerEnablerTest_captureEpochAndValidators is EpochManagerEnablerTest {
  function test_Reverts_whenL2() public {
    whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    epochManagerEnablerContract.captureEpochAndValidators();
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

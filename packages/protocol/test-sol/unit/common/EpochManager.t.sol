// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";
import "@celo-contracts-8/common/interfaces/ICeloToken.sol";
import "@celo-contracts-8/common/ScoreManager.sol";
import { CeloUnreleasedTreasure } from "@celo-contracts-8/common/CeloUnreleasedTreasure.sol";
import { ICeloUnreleasedTreasure } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasure.sol";

import { TestConstants } from "@test-sol/constants.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { IMockValidators } from "@celo-contracts/governance/test/IMockValidators.sol";

import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import { ValidatorsMock08 } from "@celo-contracts-8/governance/test/ValidatorsMock.sol";
import { MockAccounts } from "@celo-contracts-8/common/mocks/MockAccounts.sol";

contract EpochManagerTest is Test, TestConstants, Utils08 {
  EpochManager_WithMocks epochManager;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  EpochRewardsMock08 epochRewards;
  ValidatorsMock08 validators;

  address epochManagerInitializer;
  address carbonOffsettingPartner;
  address communityRewardFund;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  address[] firstElected;

  IRegistry registry;
  ICeloToken celoToken;
  CeloUnreleasedTreasure celoUnreleasedTreasure;
  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  uint256 constant L1_MINTED_CELO_SUPPLY = 692702432463315819704447326; // as of May 15 2024

  uint256 constant CELO_SUPPLY_CAP = 1000000000 ether; // 1 billion Celo
  uint256 constant GENESIS_CELO_SUPPLY = 600000000 ether; // 600 million Celo

  uint256 constant FIFTEEN_YEAR_LINEAR_REWARD = (CELO_SUPPLY_CAP - GENESIS_CELO_SUPPLY) / 2; // 200 million Celo

  uint256 constant FIFTEEN_YEAR_CELO_SUPPLY = GENESIS_CELO_SUPPLY + FIFTEEN_YEAR_LINEAR_REWARD; // 800 million Celo (includes GENESIS_CELO_SUPPLY)

  uint256 constant MAX_L2_DISTRIBUTION = FIFTEEN_YEAR_CELO_SUPPLY - L1_MINTED_CELO_SUPPLY; // 107.2 million Celo

  uint256 constant L2_INITIAL_STASH_BALANCE = FIFTEEN_YEAR_LINEAR_REWARD + MAX_L2_DISTRIBUTION; // leftover from L1 target supply plus the 2nd 15 year term.

  function setUp() public virtual {
    epochManager = new EpochManager_WithMocks();
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = new ValidatorsMock08();
    stableToken = new MockStableToken08();
    celoUnreleasedTreasure = new CeloUnreleasedTreasure(false);

    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    address celoTokenAddress = actor("celoTokenAddress");
    address scoreManagerAddress = actor("scoreManagerAddress");
    address reserveAddress = actor("reserve");

    epochManagerInitializer = actor("initializer");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("Registry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("GoldToken.sol", abi.encode(false), celoTokenAddress);
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
    celoToken = ICeloToken(celoTokenAddress);
    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManager));
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(CeloUnreleasedTreasureContract, address(celoUnreleasedTreasure));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(ReserveContract, reserveAddress);

    vm.deal(address(celoUnreleasedTreasure), L2_INITIAL_STASH_BALANCE);

    bool res1 = sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    (uint256 res0, uint256 res00) = sortedOracles.medianRate(address(stableToken));

    scoreManager.setValidatorScore(actor("validator1"), 1);
    uint256 res = scoreManager.getValidatorScore(actor("validator1"));
    uint256 res2 = epochRewards.getCommunityRewardFraction();

    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, epochManagerInitializer);

    blockTravel(vm, firstEpochBlock);
  }
}

contract EpochManagerTest_initialize is EpochManagerTest {
  function test_initialize() public virtual {
    assertEq(address(epochManager.registry()), REGISTRY_ADDRESS);
    assertEq(epochManager.epochDuration(), 10);
    assertEq(epochManager.carbonOffsettingPartner(), carbonOffsettingPartner);
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManager.initialize(REGISTRY_ADDRESS, 10, carbonOffsettingPartner, epochManagerInitializer);
  }
}

contract EpochManagerTest_initializeSystem is EpochManagerTest {
  function test_processCanBeStarted() public virtual {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    vm.prank(address(0));
    vm.expectRevert("Epoch system already initialized");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_WhenSystemInitializedByOtherContract() public virtual {
    vm.expectRevert("msg.sender is not Initializer");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }
}

contract EpochManagerTest_startNextEpochProcess is EpochManagerTest {
  function test_Reverts_whenSystemNotInitialized() public {
    uint256 _currentEpoch = epochManager.currentEpochNumber();
    (, , , uint256 _currentEpochEndTimestamp, ) = epochManager.getCurrentEpoch();

    vm.expectRevert("Epoch system not initialized");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.prank(epochManagerInitializer);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    uint256 _currentEpoch = epochManager.currentEpochNumber();
    (, , , uint256 _currentEpochEndTimestamp, ) = epochManager.getCurrentEpoch();

    vm.expectRevert("Epoch is not ready to start");
    epochManager.startNextEpochProcess();
  }
}

contract EpochManagerTest_sendValidatorPayment is EpochManagerTest {
  address group = actor("group");

  address validator1 = actor("validator1");
  address validator2 = actor("validator2");
  address validator3 = actor("validator3");

  address beneficiary = actor("beneficiary");

  uint256 paymentAmount = 4 ether;
  uint256 quarterOfPayment = paymentAmount / 4;
  uint256 halfOfPayment = paymentAmount / 2;
  uint256 threeQuartersOfPayment = (paymentAmount / 4) * 3;
  uint256 twentyFivePercent = 250000000000000000000000;
  uint256 fiftyPercent = 500000000000000000000000;
  uint256 epochManagerBalanceBefore;

  // TODO: unify mocks
  IMockValidators mockValidators = IMockValidators(actor("MockValidators05"));

  MockAccounts accounts;

  function setUp() public override {
    super.setUp();

    deployCodeTo("MockValidators.sol", abi.encode(false), address(mockValidators));
    registry.setAddressFor(ValidatorsContract, address(mockValidators));

    accounts = new MockAccounts();
    registry.setAddressFor(AccountsContract, address(accounts));

    mockValidators.setValidatorGroup(group);
    mockValidators.setValidator(validator1);
    mockValidators.setValidator(validator2);
    mockValidators.setValidator(validator3);

    address[] memory members = new address[](3);
    members[0] = validator1;
    members[1] = validator2;
    members[2] = validator3;
    mockValidators.setMembers(group, members);

    stableToken.mint(address(epochManager), paymentAmount * 2);
    epochManagerBalanceBefore = stableToken.balanceOf(address(epochManager));
    epochManager._setPaymentAllocation(validator1, paymentAmount);
    epochManager._setPaymentAllocation(validator3, paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidator() public {
    epochManager.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManager));

    assertEq(validatorBalanceAfter, paymentAmount);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidatorAndGroup() public {
    mockValidators.setCommission(group, twentyFivePercent);

    epochManager.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 groupBalanceAfter = stableToken.balanceOf(group);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManager));

    assertEq(validatorBalanceAfter, threeQuartersOfPayment);
    assertEq(groupBalanceAfter, quarterOfPayment);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidatorAndBeneficiary() public {
    accounts.setPaymentDelegationFor(validator1, beneficiary, twentyFivePercent);

    epochManager.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 beneficiaryBalanceAfter = stableToken.balanceOf(beneficiary);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManager));

    assertEq(validatorBalanceAfter, threeQuartersOfPayment);
    assertEq(beneficiaryBalanceAfter, quarterOfPayment);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidatorAndGroupAndBeneficiary() public {
    mockValidators.setCommission(group, fiftyPercent);
    accounts.setPaymentDelegationFor(validator1, beneficiary, fiftyPercent);

    epochManager.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 groupBalanceAfter = stableToken.balanceOf(group);
    uint256 beneficiaryBalanceAfter = stableToken.balanceOf(beneficiary);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManager));

    assertEq(validatorBalanceAfter, quarterOfPayment);
    assertEq(groupBalanceAfter, halfOfPayment);
    assertEq(beneficiaryBalanceAfter, quarterOfPayment);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_worksWhenCalledByAnyone() public {}

  function test_doesNothingIfNotAllocated() public {}
}

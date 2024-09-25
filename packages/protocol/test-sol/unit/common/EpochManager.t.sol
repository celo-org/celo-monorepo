// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";
import "@celo-contracts-8/common/test/MockCeloToken.sol";
import "@celo-contracts/common/interfaces/ICeloToken.sol";
import "@celo-contracts-8/common/ScoreManager.sol";
import { CeloUnreleasedTreasury } from "@celo-contracts-8/common/CeloUnreleasedTreasury.sol";
import { ICeloUnreleasedTreasury } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

import { TestConstants } from "@test-sol/constants.sol";
import { Utils08 } from "@test-sol/utils08.sol";

import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

import { IMockValidators } from "@celo-contracts-8/governance/test/IMockValidators.sol";

import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";

import { MockAccounts } from "@celo-contracts-8/common/mocks/MockAccounts.sol";
import { ValidatorsMock } from "@test-sol/unit/governance/validators/mocks/ValidatorsMock.sol";
import { MockCeloUnreleasedTreasury } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasury.sol";

contract EpochManagerTest is Test, TestConstants, Utils08 {
  EpochManager_WithMocks epochManager;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  EpochRewardsMock08 epochRewards;
  ValidatorsMock validators;

  address epochManagerEnabler;
  address carbonOffsettingPartner;
  address communityRewardFund;
  address reserveAddress;
  address scoreManagerAddress;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  uint256 epochDuration = DAY;
  address[] firstElected;

  IRegistry registry;
  MockCeloToken08 celoToken;
  MockCeloUnreleasedTreasury celoUnreleasedTreasury;
  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  event ValidatorEpochPaymentDistributed(
    address indexed validator,
    uint256 validatorPayment,
    address indexed group,
    uint256 groupPayment,
    address indexed beneficiary,
    uint256 delegatedPayment
  );

  event EpochProcessingStarted(uint256 indexed epochNumber);
  event EpochDurationSet(uint256 indexed newEpochDuration);
  event OracleAddressSet(address indexed newOracleAddress);

  function setUp() public virtual {
    epochManager = new EpochManager_WithMocks();
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = new ValidatorsMock();
    stableToken = new MockStableToken08();
    celoToken = new MockCeloToken08();
    celoUnreleasedTreasury = new MockCeloUnreleasedTreasury();

    firstElected.push(actor("validator1"));
    firstElected.push(actor("validator2"));

    scoreManagerAddress = actor("scoreManagerAddress");

    reserveAddress = actor("reserve");

    epochManagerEnabler = actor("epochManagerEnabler");
    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("MockRegistry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);

    registry = IRegistry(REGISTRY_ADDRESS);
    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManager));
    registry.setAddressFor(EpochManagerEnablerContract, epochManagerEnabler);
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(CeloUnreleasedTreasuryContract, address(celoUnreleasedTreasury));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(ReserveContract, reserveAddress);

    celoToken.setTotalSupply(CELO_SUPPLY_CAP);
    vm.deal(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);
    celoToken.setBalanceOf(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);

    celoUnreleasedTreasury.setRegistry(REGISTRY_ADDRESS);
    validators.setRegistry(REGISTRY_ADDRESS);

    sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);

    scoreManager.setValidatorScore(actor("validator1"), 1);

    epochManager.initialize(REGISTRY_ADDRESS, 10);

    blockTravel(vm, firstEpochBlock);
  }

  function initializeEpochManagerSystem() public {
    deployCodeTo("MockRegistry.sol", abi.encode(false), PROXY_ADMIN_ADDRESS);
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    blockTravel(vm, 43200);
    timeTravel(vm, DAY);
  }
}

contract EpochManagerTest_initialize is EpochManagerTest {
  function test_initialize() public virtual {
    assertEq(address(epochManager.registry()), REGISTRY_ADDRESS);
    assertEq(epochManager.epochDuration(), 10);
    assertEq(epochManager.oracleAddress(), address(sortedOracles));
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManager.initialize(REGISTRY_ADDRESS, 10);
  }
}

contract EpochManagerTest_initializeSystem is EpochManagerTest {
  function test_processCanBeStarted() public virtual {
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    (
      uint256 _firstEpochBlock,
      uint256 _lastEpochBlock,
      uint256 _startTimestamp,
      uint256 _currentRewardsBlock
    ) = epochManager.getCurrentEpoch();
    assertGt(epochManager.getElected().length, 0);
    assertEq(epochManager.firstKnownEpoch(), firstEpochNumber);
    assertEq(_firstEpochBlock, firstEpochBlock);
    assertEq(_lastEpochBlock, 0);
    assertEq(_startTimestamp, block.timestamp);
    assertEq(_currentRewardsBlock, 0);
    assertEq(epochManager.getElected(), firstElected);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    vm.prank(epochManagerEnabler);
    vm.expectRevert("Epoch system already initialized");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_WhenSystemInitializedByOtherContract() public virtual {
    vm.expectRevert("msg.sender is not Enabler");
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }
}

contract EpochManagerTest_startNextEpochProcess is EpochManagerTest {
  function test_Reverts_whenSystemNotInitialized() public {
    vm.expectRevert("Epoch system not initialized");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    vm.expectRevert("Epoch is not ready to start");
    epochManager.startNextEpochProcess();
  }

  function test_Reverts_WhenEpochProcessingAlreadyStarted() public {
    initializeEpochManagerSystem();

    epochManager.startNextEpochProcess();
    vm.expectRevert("Epoch process is already started");
    epochManager.startNextEpochProcess();
  }

  function test_Emits_EpochProcessingStartedEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit EpochProcessingStarted(firstEpochNumber);
    epochManager.startNextEpochProcess();
  }

  function test_SetsTheEpochRewardBlock() public {
    initializeEpochManagerSystem();

    epochManager.startNextEpochProcess();
    (, , , uint256 _currentRewardsBlock) = epochManager.getCurrentEpoch();
    assertEq(_currentRewardsBlock, block.number);
  }

  function test_SetsTheEpochRewardAmounts() public {
    initializeEpochManagerSystem();

    epochManager.startNextEpochProcess();
    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVoter,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManager.getEpochProcessingState();
    assertEq(status, 1);
    assertEq(perValidatorReward, 5);
    assertEq(totalRewardsVoter, 5);
    assertEq(totalRewardsCommunity, 5);
    assertEq(totalRewardsCarbonFund, 5);
  }

  function test_ShouldMintTotalValidatorStableRewardsToEpochManager() public {
    initializeEpochManagerSystem();
    uint256 beforeBalance = stableToken.balanceOf(address(epochManager));
    epochManager.startNextEpochProcess();

    uint256 afterBalance = stableToken.balanceOf(address(epochManager));
    assertEq(afterBalance, 2);
  }

  function test_ShouldReleaseCorrectAmountToReserve() public {
    initializeEpochManagerSystem();
    uint256 reserveBalanceBefore = celoToken.balanceOf(reserveAddress);
    epochManager.startNextEpochProcess();
    uint256 reserveBalanceAfter = celoToken.balanceOf(reserveAddress);
    assertEq(reserveBalanceAfter, reserveBalanceBefore + 4);
  }
}

contract EpochManagerTest_setEpochDuration is EpochManagerTest {
  uint256 newEpochDuration = 5 * DAY;

  function test_setsNewEpochDuration() public {
    initializeEpochManagerSystem();
    epochManager.setEpochDuration(newEpochDuration);
    assertEq(epochManager.epochDuration(), newEpochDuration);
  }

  function test_Emits_EpochDurationSetEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit EpochDurationSet(newEpochDuration);
    epochManager.setEpochDuration(newEpochDuration);
  }

  function test_Reverts_WhenIsOnEpochProcess() public {
    initializeEpochManagerSystem();
    epochManager.startNextEpochProcess();
    vm.expectRevert("Cannot change epoch duration during processing.");
    epochManager.setEpochDuration(newEpochDuration);
  }

  function test_Reverts_WhenNewEpochDurationIsZero() public {
    initializeEpochManagerSystem();

    vm.expectRevert("New epoch duration must be greater than zero.");
    epochManager.setEpochDuration(0);
  }
}

contract EpochManagerTest_setOracleAddress is EpochManagerTest {
  address newOracleAddress = actor("newOarcle");

  function test_setsNewOracleAddress() public {
    initializeEpochManagerSystem();
    epochManager.setOracleAddress(newOracleAddress);
    assertEq(epochManager.oracleAddress(), newOracleAddress);
  }

  function test_Emits_OracleAddressSetEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit OracleAddressSet(newOracleAddress);
    epochManager.setOracleAddress(newOracleAddress);
  }

  function test_Reverts_WhenIsOnEpochProcess() public {
    initializeEpochManagerSystem();
    epochManager.startNextEpochProcess();
    vm.expectRevert("Cannot change oracle address during epoch processing.");
    epochManager.setOracleAddress(newOracleAddress);
  }

  function test_Reverts_WhenNewOracleAddressIsZero() public {
    initializeEpochManagerSystem();

    vm.expectRevert("Cannot set address zero as the Oracle.");
    epochManager.setOracleAddress(address(0));
  }

  function test_Reverts_WhenNewOracleAddressIsunchanged() public {
    initializeEpochManagerSystem();

    vm.expectRevert("Oracle address cannot be the same.");
    epochManager.setOracleAddress(address(sortedOracles));
  }
}

contract EpochManagerTest_sendValidatorPayment is EpochManagerTest {
  address group = actor("group");
  address validator1 = actor("validator1");
  address signer1 = actor("signer1");
  address validator2 = actor("validator2");
  address signer2 = actor("signer2");
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
    accounts.setValidatorSigner(validator1, signer1);
    mockValidators.setValidator(validator2);
    accounts.setValidatorSigner(validator2, signer2);

    address[] memory members = new address[](3);
    members[0] = validator1;
    members[1] = validator2;
    mockValidators.setMembers(group, members);

    vm.prank(epochManagerEnabler);
    epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    stableToken.mint(address(epochManager), paymentAmount * 2);
    epochManagerBalanceBefore = stableToken.balanceOf(address(epochManager));
    epochManager._setPaymentAllocation(validator1, paymentAmount);
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

  function test_emitsAValidatorEpochPaymentDistributedEvent() public {
    mockValidators.setCommission(group, fiftyPercent);
    accounts.setPaymentDelegationFor(validator1, beneficiary, fiftyPercent);

    vm.expectEmit(true, true, true, true, address(epochManager));
    emit ValidatorEpochPaymentDistributed(
      validator1,
      quarterOfPayment,
      group,
      halfOfPayment,
      beneficiary,
      quarterOfPayment
    );
    epochManager.sendValidatorPayment(validator1);
  }

  function test_doesNothingIfNotAllocated() public {
    mockValidators.setCommission(group, fiftyPercent);
    accounts.setPaymentDelegationFor(validator2, beneficiary, fiftyPercent);

    epochManager.sendValidatorPayment(validator2);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 groupBalanceAfter = stableToken.balanceOf(group);
    uint256 beneficiaryBalanceAfter = stableToken.balanceOf(beneficiary);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManager));

    assertEq(validatorBalanceAfter, 0);
    assertEq(groupBalanceAfter, 0);
    assertEq(beneficiaryBalanceAfter, 0);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore);
  }

  function test_doesntAllowDoubleSending() public {
    epochManager.sendValidatorPayment(validator1);
    epochManager.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManager));

    assertEq(validatorBalanceAfter, paymentAmount);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }
}

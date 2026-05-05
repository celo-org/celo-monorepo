// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/interfaces/ICeloToken.sol";
import { ICeloUnreleasedTreasury } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";
import { MockElection } from "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts-8/common/ScoreManager.sol";
import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import "@celo-contracts-8/common/test/MockCeloToken.sol";
import { MockCeloUnreleasedTreasury } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasury.sol";
import { IMockValidators } from "@celo-contracts-8/governance/test/IMockValidators.sol";
import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";

import { Ownable } from "@openzeppelin/contracts8/access/Ownable.sol";

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

contract EpochManagerTest is TestWithUtils08 {
  EpochManager_WithMocks epochManagerContract;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  EpochRewardsMock08 epochRewards;
  MockElection election;
  IMockValidators validators;

  address carbonOffsettingPartner;
  address communityRewardFund;
  address reserveAddress;
  address scoreManagerAddress;

  uint256 firstEpochNumber = 3;
  uint256 epochDuration = DAY;
  address[] firstElected;

  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  uint256 validator1Reward = 42e18;
  uint256 validator2Reward = 43e18;

  address validator1;
  address validator2;

  address group = actor("group");

  address validator3 = actor("validator3");
  address validator4 = actor("validator4");

  address group2 = actor("group2");

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
  event GroupMarkedForProcessing(address indexed group, uint256 indexed epochNumber);
  event GroupProcessed(address indexed group, uint256 indexed epochNumber);
  event ValidatorEpochRewardAllocated(
    address indexed validator,
    uint256 validatorReward,
    address indexed group,
    uint256 indexed epochNumber
  );
  event VoterRewardCommissionDistributed(
    address indexed group,
    uint256 commission,
    uint256 indexed epochNumber
  );

  function setUp() public virtual override {
    super.setUp();
    epochManagerContract = new EpochManager_WithMocks();
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = IMockValidators(actor("validators05"));
    stableToken = new MockStableToken08();
    election = new MockElection();

    validator1 = actor("validator");
    validator2 = actor("otherValidator");

    firstElected.push(validator1);
    firstElected.push(validator2);

    scoreManagerAddress = actor("scoreManagerAddress");

    reserveAddress = actor("reserve");

    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("MockRegistry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);
    deployCodeTo("MockValidators.sol", abi.encode(false), address(validators));

    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManagerContract));
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(ReserveContract, reserveAddress);
    registry.setAddressFor(ElectionContract, address(election));

    celoUnreleasedTreasury.setRegistry(REGISTRY_ADDRESS);

    sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);

    scoreManager.setValidatorScore(validator1, 1);

    epochManagerContract.initialize(REGISTRY_ADDRESS, 10, address(sortedOracles));
    epochRewards.setCarbonOffsettingPartner(carbonOffsettingPartner);

    validators.setEpochRewards(validator1, validator1Reward);
    validators.setEpochRewards(validator2, validator2Reward);

    // change ownership to epochManagerEnabler to allow initialization
    epochManagerContract.transferOwnership(address(epochManagerEnabler));
    whenL2WithEpochManagerInitialization();
    revertOwnershipEpochManager();
  }

  function revertOwnershipEpochManager() internal {
    vm.prank(Ownable(address(epochManagerContract)).owner());
    epochManagerContract.transferOwnership(address(this));
  }

  function setupAndElectValidators() public {
    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    validators.setValidator(validator2);
    validators.setValidatorGroup(group2);
    validators.setValidator(validator3);
    validators.setValidator(validator4);

    address[] memory members = new address[](100);
    address[] memory group2Members = new address[](3);
    members[0] = validator1;
    members[1] = validator2;

    for (uint256 i = 2; i < numberValidators; i++) {
      address _currentValidator = vm.addr(i + 1);
      members[i] = _currentValidator;
    }

    validators.setMembers(group, members);

    group2Members[0] = validator3;
    group2Members[1] = validator4;
    validators.setMembers(group2, group2Members);

    election.setElectedValidators(members);

    travelNL2Epoch(1);
  }

  function _travelAndProcess_N_L2Epoch(uint256 n) public {
    for (uint256 i = 0; i < n; i++) {
      travelNL2Epoch(1);
      epochManagerContract.startNextEpochProcess();

      (
        address[] memory groups,
        address[] memory lessers,
        address[] memory greaters
      ) = getGroupsWithLessersAndGreaters();

      epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
    }
  }

  function getGroupsWithLessersAndGreaters()
    public
    view
    returns (address[] memory, address[] memory, address[] memory)
  {
    address[] memory groups = new address[](1);
    groups[0] = group;

    address[] memory lessers = new address[](1);
    lessers[0] = address(0);

    address[] memory greaters = new address[](1);
    greaters[0] = address(0);

    return (groups, lessers, greaters);
  }
}

contract EpochManagerTest_initialize is EpochManagerTest {
  function test_initialize() public virtual {
    assertEq(address(epochManagerContract.registry()), REGISTRY_ADDRESS);
    assertEq(epochManagerContract.epochDuration(), 10);
    assertEq(epochManagerContract.oracleAddress(), address(sortedOracles));
  }

  function test_Reverts_WhenAlreadyInitialized() public virtual {
    vm.expectRevert("contract already initialized");
    epochManagerContract.initialize(REGISTRY_ADDRESS, 10, address(sortedOracles));
  }
}

// XXX: No explicit L2 test for this function, as the L1 check happens on the EpochManagerEnabler contract
// This test spoofs the EpochManagerEnabler to execute the function.
contract EpochManagerTest_initializeSystem is EpochManagerTest {
  uint256 lastKnownEpochNumber;
  uint256 lastKnownFirstBlockOfEpoch;
  address[] lastKnownElectedAccounts;

  function setUp() public override {
    super.setUp();

    lastKnownEpochNumber = epochManagerEnabler.lastKnownEpochNumber();
    lastKnownFirstBlockOfEpoch = epochManagerEnabler.lastKnownFirstBlockOfEpoch();
    lastKnownElectedAccounts = epochManagerEnabler.getlastKnownElectedAccounts();
  }
  function test_processCanBeStarted() public virtual {
    (
      uint256 _firstEpochBlock,
      uint256 _lastEpochBlock,
      uint256 _startTimestamp,
      uint256 _currentRewardsBlock
    ) = epochManagerContract.getCurrentEpoch();
    assertGt(epochManagerContract.getElectedAccounts().length, 0);
    assertEq(epochManagerContract.firstKnownEpoch(), lastKnownEpochNumber);
    assertEq(_firstEpochBlock, lastKnownFirstBlockOfEpoch);
    assertEq(_lastEpochBlock, 0);
    assertEq(_startTimestamp, block.timestamp);
    assertEq(_currentRewardsBlock, 0);
    assertEq(epochManagerContract.getElectedAccounts(), lastKnownElectedAccounts);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.expectRevert("Epoch system already initialized");
    epochManagerContract.initializeSystem(
      lastKnownEpochNumber,
      lastKnownFirstBlockOfEpoch,
      lastKnownElectedAccounts
    );
  }

  function test_Reverts_WhenSystemInitializedByNotOwner() public virtual {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(actor("otherContract"));
    epochManagerContract.initializeSystem(
      lastKnownEpochNumber,
      lastKnownFirstBlockOfEpoch,
      lastKnownElectedAccounts
    );
  }
}

contract EpochManagerTest_startNextEpochProcess is EpochManagerTest {
  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.expectRevert("Epoch is not ready to start");
    epochManagerContract.startNextEpochProcess();
  }

  function test_Reverts_WhenEpochProcessingAlreadyStarted() public {
    setupAndElectValidators();

    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("Epoch process is already started");
    epochManagerContract.startNextEpochProcess();
  }

  function test_Emits_EpochProcessingStartedEvent() public {
    setupAndElectValidators();

    vm.expectEmit(true, true, true, true);
    emit EpochProcessingStarted(firstEpochNumber);
    epochManagerContract.startNextEpochProcess();
  }

  function test_SetsTheEpochRewardBlock() public {
    setupAndElectValidators();

    epochManagerContract.startNextEpochProcess();
    (, , , uint256 _currentRewardsBlock) = epochManagerContract.getCurrentEpoch();
    assertEq(_currentRewardsBlock, block.number);
  }

  function test_SetsTheEpochRewardAmounts() public {
    setupAndElectValidators();

    epochManagerContract.startNextEpochProcess();
    (
      uint256 status,
      uint256 perValidatorReward,
      uint256 totalRewardsVoter,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = epochManagerContract.getEpochProcessingState();
    assertEq(status, 1);
    assertEq(perValidatorReward, 5);
    assertEq(totalRewardsVoter, 6);
    assertEq(totalRewardsCommunity, 7);
    assertEq(totalRewardsCarbonFund, 8);
  }

  function test_ShouldMintTotalValidatorStableRewardsToEpochManager() public {
    setupAndElectValidators();
    epochManagerContract.startNextEpochProcess();

    assertEq(validators.mintedStable(), validator1Reward + validator2Reward);
  }

  function test_ShouldReleaseCorrectAmountToReserve() public {
    setupAndElectValidators();
    epochManagerContract.startNextEpochProcess();
    (uint256 numerator, uint256 denominator) = sortedOracles.getExchangeRate(address(stableToken));
    uint256 reserveBalanceAfter = celoToken.balanceOf(reserveAddress);
    uint256 CELOequivalent = (denominator * (validator1Reward + validator2Reward)) / numerator;

    assertEq(reserveBalanceAfter, CELOequivalent);
  }

  function test_Emits_ValidatorEpochRewardAllocatedEvent() public {
    setupAndElectValidators();

    // Expect events for both validators with their respective rewards and correct group
    vm.expectEmit(true, true, true, true);
    emit ValidatorEpochRewardAllocated(validator1, validator1Reward, group, firstEpochNumber);
    vm.expectEmit(true, true, true, true);
    emit ValidatorEpochRewardAllocated(validator2, validator2Reward, group, firstEpochNumber);

    epochManagerContract.startNextEpochProcess();
  }
}

contract EpochManagerTest_setEpochDuration is EpochManagerTest {
  uint256 newEpochDuration = 5 * DAY;

  function test_setsNewEpochDuration() public {
    setupAndElectValidators();
    epochManagerContract.setEpochDuration(newEpochDuration);
    assertEq(epochManagerContract.epochDuration(), newEpochDuration);
  }

  function test_Emits_EpochDurationSetEvent() public {
    setupAndElectValidators();

    vm.expectEmit(true, true, true, true);
    emit EpochDurationSet(newEpochDuration);
    epochManagerContract.setEpochDuration(newEpochDuration);
  }

  function test_Reverts_WhenNewEpochDurationIsZero() public {
    setupAndElectValidators();

    vm.expectRevert("New epoch duration must be greater than zero.");
    epochManagerContract.setEpochDuration(0);
  }

  function test_Reverts_WhenIsOnEpochProcess() public {
    setupAndElectValidators();
    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("Cannot change epoch duration during processing.");
    epochManagerContract.setEpochDuration(newEpochDuration);
  }
}

contract EpochManagerTest_setOracleAddress is EpochManagerTest {
  address newOracleAddress = actor("newOarcle");

  function test_setsNewOracleAddress() public {
    setupAndElectValidators();
    epochManagerContract.setOracleAddress(newOracleAddress);
    assertEq(epochManagerContract.oracleAddress(), newOracleAddress);
  }

  function test_Emits_OracleAddressSetEvent() public {
    setupAndElectValidators();

    vm.expectEmit(true, true, true, true);
    emit OracleAddressSet(newOracleAddress);
    epochManagerContract.setOracleAddress(newOracleAddress);
  }

  function test_Reverts_WhenNewOracleAddressIsZero() public {
    setupAndElectValidators();

    vm.expectRevert("Cannot set address zero as the Oracle.");
    epochManagerContract.setOracleAddress(address(0));
  }

  function test_Reverts_WhenNewOracleAddressIsunchanged() public {
    setupAndElectValidators();

    vm.expectRevert("Oracle address cannot be the same.");
    epochManagerContract.setOracleAddress(address(sortedOracles));
  }

  function test_Reverts_WhenIsOnEpochProcess() public {
    setupAndElectValidators();
    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("Cannot change oracle address during epoch processing.");
    epochManagerContract.setOracleAddress(newOracleAddress);
  }
}

contract EpochManagerTest_sendValidatorPayment is EpochManagerTest {
  address beneficiary = actor("beneficiary");

  uint256 paymentAmount = 4 ether;
  uint256 quarterOfPayment = paymentAmount / 4;
  uint256 halfOfPayment = paymentAmount / 2;
  uint256 threeQuartersOfPayment = (paymentAmount / 4) * 3;
  uint256 twentyFivePercent = 250000000000000000000000;
  uint256 fiftyPercent = 500000000000000000000000;

  uint256 epochManagerBalanceBefore;

  function setUp() public override(EpochManagerTest) {
    super.setUp();

    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    validators.setValidator(validator2);

    address[] memory members = new address[](2);
    members[0] = validator1;
    members[1] = validator2;
    validators.setMembers(group, members);

    stableToken.mint(address(epochManagerContract), paymentAmount * 2);
    epochManagerBalanceBefore = stableToken.balanceOf(address(epochManagerContract));
    epochManagerContract._setPaymentAllocation(validator1, paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidator() public {
    epochManagerContract.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManagerContract));

    assertEq(validatorBalanceAfter, paymentAmount);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidatorAndGroup() public {
    validators.setCommission(group, twentyFivePercent);

    epochManagerContract.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 groupBalanceAfter = stableToken.balanceOf(group);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManagerContract));

    assertEq(validatorBalanceAfter, threeQuartersOfPayment);
    assertEq(groupBalanceAfter, quarterOfPayment);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidatorAndBeneficiary() public {
    vm.prank(validator1);
    accountsContract.setPaymentDelegation(beneficiary, twentyFivePercent);

    epochManagerContract.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 beneficiaryBalanceAfter = stableToken.balanceOf(beneficiary);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManagerContract));

    assertEq(validatorBalanceAfter, threeQuartersOfPayment);
    assertEq(beneficiaryBalanceAfter, quarterOfPayment);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_sendsCUsdFromEpochManagerToValidatorAndGroupAndBeneficiary() public {
    validators.setCommission(group, fiftyPercent);
    vm.prank(validator1);
    accountsContract.setPaymentDelegation(beneficiary, fiftyPercent);

    epochManagerContract.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 groupBalanceAfter = stableToken.balanceOf(group);
    uint256 beneficiaryBalanceAfter = stableToken.balanceOf(beneficiary);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManagerContract));

    assertEq(validatorBalanceAfter, quarterOfPayment);
    assertEq(groupBalanceAfter, halfOfPayment);
    assertEq(beneficiaryBalanceAfter, quarterOfPayment);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }

  function test_emitsAValidatorEpochPaymentDistributedEvent() public {
    validators.setCommission(group, fiftyPercent);
    vm.prank(validator1);
    accountsContract.setPaymentDelegation(beneficiary, fiftyPercent);

    vm.expectEmit(true, true, true, true, address(epochManagerContract));
    emit ValidatorEpochPaymentDistributed(
      validator1,
      quarterOfPayment,
      group,
      halfOfPayment,
      beneficiary,
      quarterOfPayment
    );
    epochManagerContract.sendValidatorPayment(validator1);
  }

  function test_doesNothingIfNotAllocated() public {
    validators.setCommission(group, fiftyPercent);
    vm.prank(validator2);
    accountsContract.setPaymentDelegation(beneficiary, fiftyPercent);

    epochManagerContract.sendValidatorPayment(validator2);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 groupBalanceAfter = stableToken.balanceOf(group);
    uint256 beneficiaryBalanceAfter = stableToken.balanceOf(beneficiary);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManagerContract));

    assertEq(validatorBalanceAfter, 0);
    assertEq(groupBalanceAfter, 0);
    assertEq(beneficiaryBalanceAfter, 0);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore);
  }

  function test_doesntAllowDoubleSending() public {
    epochManagerContract.sendValidatorPayment(validator1);
    epochManagerContract.sendValidatorPayment(validator1);

    uint256 validatorBalanceAfter = stableToken.balanceOf(validator1);
    uint256 epochManagerBalanceAfter = stableToken.balanceOf(address(epochManagerContract));

    assertEq(validatorBalanceAfter, paymentAmount);
    assertEq(epochManagerBalanceAfter, epochManagerBalanceBefore - paymentAmount);
  }
}

contract EpochManagerTest_finishNextEpochProcess is EpochManagerTest {
  uint256 groupEpochRewards = 44e18;

  function setUp() public override(EpochManagerTest) {
    super.setUp();

    setupAndElectValidators();

    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  function test_Reverts_WhenNotStarted() public {
    address[] memory groups = new address[](0);

    vm.expectRevert("Epoch process is not started");
    epochManagerContract.finishNextEpochProcess(groups, groups, groups);
  }

  function test_Reverts_WhenGroupsDoNotMatch() public {
    address[] memory groups = new address[](0);
    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("number of groups does not match");
    epochManagerContract.finishNextEpochProcess(groups, groups, groups);
  }

  function test_Reverts_WhenGroupsNotFromElected() public {
    address[] memory groups = new address[](1);
    groups[0] = group2;
    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("group not from current elected set");
    epochManagerContract.finishNextEpochProcess(groups, groups, groups);
  }

  function test_TransfersToCommunityAndCarbonOffsetting() public {
    (
      address[] memory groups,
      address[] memory lessers,
      address[] memory greaters
    ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(celoToken.balanceOf(communityRewardFund), epochRewards.totalRewardsCommunity());
    assertEq(celoToken.balanceOf(carbonOffsettingPartner), epochRewards.totalRewardsCarbonFund());
  }

  function test_TransfersToValidatorGroup() public {
    (
      address[] memory groups,
      address[] memory lessers,
      address[] memory greaters
    ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    assertEq(election.distributedEpochRewards(group), groupEpochRewards);
  }

  function test_SetsNewlyElectedCorrectly() public {
    (
      address[] memory groups,
      address[] memory lessers,
      address[] memory greaters
    ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();

    address[] memory newElected = new address[](2);
    newElected[0] = validator3;
    newElected[1] = validator4;
    election.setElectedValidators(newElected);

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    address[] memory afterElected = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < newElected.length; i++) {
      assertEq(newElected[i], afterElected[i]);
    }
  }

  function test_Emits_GroupProcessedEvent() public {
    (
      address[] memory groups,
      address[] memory lessers,
      address[] memory greaters
    ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();

    for (uint i = 0; i < groups.length; i++) {
      vm.expectEmit(true, true, true, true);
      emit GroupProcessed(groups[i], firstEpochNumber);
    }

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);
  }
}

contract EpochManagerTest_setToProcessGroups is EpochManagerTest {
  uint256 groupEpochRewards = 44e18;

  function setUp() public override(EpochManagerTest) {
    super.setUp();

    setupAndElectValidators();

    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  function test_Reverts_WhenNotStarted() public {
    vm.expectRevert("Epoch process is not started");
    epochManagerContract.setToProcessGroups();
  }

  function test_setsToProcessGroups() public {
    (address[] memory groups, , ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    assertEq(EpochManager(address(epochManagerContract)).toProcessGroups(), groups.length);
  }

  function test_blocksChilds() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    assertTrue(epochManagerContract.isBlocked());
  }

  function test_Reverts_startEpochAgain() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    vm.expectRevert("Epoch process is already started");
    epochManagerContract.startNextEpochProcess();
  }

  function test_Reverts_WhenSetToProcessGroups() public {
    vm.expectRevert("Epoch process is not started");
    epochManagerContract.setToProcessGroups();
  }

  function test_setsGroupRewards() public {
    (address[] memory groups, , ) = getGroupsWithLessersAndGreaters();
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    for (uint256 i = 0; i < groups.length; i++) {
      assertEq(
        EpochManager(address(epochManagerContract)).processedGroups(group),
        groupEpochRewards
      );
    }
  }

  function test_Emits_GroupMarkedForProcessingEvent() public {
    (address[] memory groups, , ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();

    for (uint i = 0; i < groups.length; i++) {
      vm.expectEmit(true, true, true, true);
      emit GroupMarkedForProcessing(groups[i], firstEpochNumber);
    }

    epochManagerContract.setToProcessGroups();
  }
}

contract EpochManagerTest_processGroup is EpochManagerTest {
  uint256 groupEpochRewards = 44e18;

  function setUp() public override(EpochManagerTest) {
    super.setUp();

    setupAndElectValidators();

    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  function test_Reverts_WhenNotStarted() public {
    vm.expectRevert("Individual epoch process is not started");
    epochManagerContract.processGroup(group, address(0), address(0));
  }

  function test_Reverts_WhenGroupNotInToProcessGroups() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    vm.expectRevert("group not from current elected set");
    epochManagerContract.processGroup(group2, address(0), address(0));
  }

  function test_ProcessesGroup() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    epochManagerContract.processGroup(group, address(0), address(0));

    (uint256 status, , , , ) = epochManagerContract.getEpochProcessingState();
    assertEq(status, 0);
  }

  function test_TransfersToCommunityAndCarbonOffsetting() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    epochManagerContract.processGroup(group, address(0), address(0));

    assertEq(celoToken.balanceOf(communityRewardFund), epochRewards.totalRewardsCommunity());
    assertEq(celoToken.balanceOf(carbonOffsettingPartner), epochRewards.totalRewardsCarbonFund());
  }

  function test_TransfersToValidatorGroup() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    epochManagerContract.processGroup(group, address(0), address(0));

    assertEq(election.distributedEpochRewards(group), groupEpochRewards);
  }

  function test_SetsNewlyElectedCorrectly() public {
    (
      address[] memory groups,
      address[] memory lessers,
      address[] memory greaters
    ) = getGroupsWithLessersAndGreaters();

    epochManagerContract.startNextEpochProcess();

    address[] memory newElected = new address[](2);
    newElected[0] = validator3;
    newElected[1] = validator4;

    vm.prank(newElected[0]);
    accountsContract.createAccount();
    vm.prank(newElected[1]);
    accountsContract.createAccount();

    election.setElectedValidators(newElected);

    address[] memory signers = new address[](2);
    signers[0] = validator3;
    signers[1] = validator4;

    epochManagerContract.setToProcessGroups();

    for (uint256 i = 0; i < groups.length; i++) {
      epochManagerContract.processGroup(groups[i], lessers[i], greaters[i]);
    }

    address[] memory afterElected = epochManagerContract.getElectedAccounts();

    for (uint256 i = 0; i < newElected.length; i++) {
      assertEq(newElected[i], afterElected[i]);
    }

    address[] memory afterSigners = epochManagerContract.getElectedSigners();
    assertEq(afterSigners.length, signers.length);
    for (uint256 i = 0; i < signers.length; i++) {
      assertEq(signers[i], afterSigners[i]);
    }
  }

  function test_Emits_GroupProcessed() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    vm.expectEmit(true, true, true, true);
    emit GroupProcessed(group, firstEpochNumber);
    epochManagerContract.processGroup(group, address(0), address(0));
  }
}

contract EpochManagerTest_getEpochByNumber is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();

    setupAndElectValidators();
  }
  function test_shouldReturnTheEpochInfoOfSpecifiedEpoch() public {
    uint256 numberOfEpochsToTravel = 9;

    uint256 _startingEpochNumber = epochManagerContract.getCurrentEpochNumber();

    (
      uint256 startingEpochFirstBlock,
      ,
      uint256 startingEpochStartTimestamp,

    ) = epochManagerContract.getCurrentEpoch();

    _travelAndProcess_N_L2Epoch(numberOfEpochsToTravel);

    (
      uint256 _firstBlock,
      uint256 _lastBlock,
      uint256 _startTimestamp,
      uint256 _rewardBlock
    ) = epochManagerContract.getEpochByNumber(_startingEpochNumber + numberOfEpochsToTravel);

    assertEq(
      startingEpochFirstBlock + (L2_BLOCK_IN_EPOCH * (numberOfEpochsToTravel + 1)) + 1,
      _firstBlock
    );
    assertEq(_lastBlock, 0);
    assertEq(startingEpochStartTimestamp + (DAY * (numberOfEpochsToTravel + 1)), _startTimestamp);
    assertEq(_rewardBlock, 0);
  }

  function test_ReturnsHistoricalEpochInfoAfter_N_Epochs() public {
    uint256 _startingEpochNumber = epochManagerContract.getCurrentEpochNumber();
    uint256 numberOfEpochsToTravel = 7;
    (uint256 _startingEpochFirstBlock, , uint256 _startingStartTimestamp, ) = epochManagerContract
      .getCurrentEpoch();

    _travelAndProcess_N_L2Epoch(numberOfEpochsToTravel);

    (
      uint256 _initialFirstBlock,
      uint256 _initialLastBlock,
      uint256 _initialStartTimestamp,
      uint256 _initialRewardBlock
    ) = epochManagerContract.getEpochByNumber(_startingEpochNumber);

    assertEq(_initialFirstBlock, _startingEpochFirstBlock, "Starting block does not match");

    assertEq(
      _initialLastBlock,
      _startingEpochFirstBlock + (L2_BLOCK_IN_EPOCH * 2),
      "Last block does not match"
    );

    assertEq(_initialStartTimestamp, _startingStartTimestamp, "Timestamp does not match");
    assertEq(
      _initialRewardBlock,
      _startingEpochFirstBlock + (L2_BLOCK_IN_EPOCH * 2) + 1,
      "Reward block does not match"
    );
  }

  function test_ReturnsZeroForFutureEpochs() public {
    setupAndElectValidators();
    (
      uint256 _firstBlock,
      uint256 _lastBlock,
      uint256 _startTimestamp,
      uint256 _rewardBlock
    ) = epochManagerContract.getEpochByNumber(500);

    assertEq(_firstBlock, 0);
    assertEq(_lastBlock, 0);
    assertEq(_startTimestamp, 0);
    assertEq(_rewardBlock, 0);
  }
}

contract EpochManagerTest_getEpochNumberOfBlock is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
  }

  function test_ShouldRetreiveTheCorrectBlockNumberOfTheEpoch() public {
    assertEq(
      epochManagerContract.getEpochNumberOfBlock(epochManagerEnabler.lastKnownFirstBlockOfEpoch()),
      firstEpochNumber
    );
  }
}

contract EpochManagerTest_getEpochByBlockNumber is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
    _travelAndProcess_N_L2Epoch(2);
  }
  function test_ShouldRetreiveTheCorrectEpochInfoOfGivenBlock() public {
    (uint256 _firstBlock, uint256 _lastBlock, , ) = epochManagerContract.getEpochByBlockNumber(
      epochManagerEnabler.lastKnownFirstBlockOfEpoch() + (3 * L2_BLOCK_IN_EPOCH)
    );
    assertEq(
      _firstBlock,
      epochManagerEnabler.lastKnownFirstBlockOfEpoch() + 1 + (2 * L2_BLOCK_IN_EPOCH)
    );
    assertEq(
      _lastBlock,
      epochManagerEnabler.lastKnownFirstBlockOfEpoch() + 1 + (3 * L2_BLOCK_IN_EPOCH) - 1
    );
  }
}

contract EpochManagerTest_numberOfElectedInCurrentSet is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
  }
  function test_ShouldRetreiveTheNumberOfElected() public {
    assertEq(
      epochManagerContract.numberOfElectedInCurrentSet(),
      epochManagerEnabler.getlastKnownElectedAccounts().length
    );
  }
}

contract EpochManagerTest_getElectedAccounts is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
  }
  function test_ShouldRetreiveThelistOfElectedAccounts() public {
    assertEq(
      epochManagerContract.getElectedAccounts(),
      epochManagerEnabler.getlastKnownElectedAccounts()
    );
  }
}

contract EpochManagerTest_getElectedAccountByIndex is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
  }
  function test_ShouldRetreiveThecorrectValidator() public {
    assertEq(epochManagerContract.getElectedAccountByIndex(0), validator1);
  }
}

contract EpochManagerTest_getElectedSigners is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
  }

  function test_ShouldRetreiveTheElectedSigners() public {
    address[] memory knownElectedAccounts = epochManagerEnabler.getlastKnownElectedAccounts();
    address[] memory electedSigners = new address[](knownElectedAccounts.length);
    for (uint256 i = 0; i < knownElectedAccounts.length; i++) {
      electedSigners[i] = accountsContract.getValidatorSigner(knownElectedAccounts[i]);
    }
    assertEq(epochManagerContract.getElectedSigners(), electedSigners);
  }
}

contract EpochManagerTest_getElectedSignerByIndex is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
  }
  function test_ShouldRetreiveThecorrectElectedSigner() public {
    address[] memory knownElectedAccounts = epochManagerEnabler.getlastKnownElectedAccounts();
    address[] memory electedSigners = new address[](knownElectedAccounts.length);

    electedSigners[1] = accountsContract.getValidatorSigner(knownElectedAccounts[1]);
    assertEq(epochManagerContract.getElectedSignerByIndex(1), electedSigners[1]);
  }
}

contract EpochManagerTest_voterRewardCommission is EpochManagerTest {
  uint256 groupEpochRewards = 1000e18;
  uint256 tenPercent = 100000000000000000000000; // FixidityLib.newFixedFraction(10, 100)

  function setUp() public override(EpochManagerTest) {
    super.setUp();

    setupAndElectValidators();

    // Set max voter reward commission to unlimited (fixed1) so commission tests work
    validators.setMaxVoterRewardCommission(FIXED1);
    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  function test_distributesFullRewardsWhenNoVoterRewardCommission() public {
    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    epochManagerContract.processGroup(group, address(0), address(0));

    assertEq(
      election.distributedEpochRewards(group),
      groupEpochRewards,
      "Full rewards should be distributed when no commission is set"
    );
  }

  function test_deductsVoterRewardCommissionAndReleasesToGroup() public {
    validators.setVoterRewardCommission(group, tenPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);

    epochManagerContract.processGroup(group, address(0), address(0));

    // Voters should receive 90% of rewards
    uint256 expectedVoterRewards = 900 ether;
    assertEq(
      election.distributedEpochRewards(group),
      expectedVoterRewards,
      "Voters should receive rewards minus commission"
    );

    // Group should receive 10% as CELO from treasury
    uint256 expectedCommission = 100 ether;
    uint256 groupBalanceAfter = celoToken.balanceOf(group);
    assertEq(
      groupBalanceAfter - groupBalanceBefore,
      expectedCommission,
      "Group should receive commission CELO from treasury"
    );
  }

  function test_emitsVoterRewardCommissionDistributedEvent() public {
    validators.setVoterRewardCommission(group, tenPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 expectedCommission = 100 ether;

    vm.expectEmit(true, true, true, true);
    emit VoterRewardCommissionDistributed(group, expectedCommission, firstEpochNumber);

    epochManagerContract.processGroup(group, address(0), address(0));
  }

  function test_handlesZeroEpochRewards() public {
    // When epoch rewards are zero, no distribution should happen
    election.setGroupEpochRewardsBasedOnScore(group, 0);
    validators.setVoterRewardCommission(group, tenPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    epochManagerContract.processGroup(group, address(0), address(0));

    assertEq(
      election.distributedEpochRewards(group),
      0,
      "No rewards should be distributed for zero epoch rewards"
    );
  }

  function test_skipsCommissionWhenGroupDeregisteredBeforeProcessing() public {
    validators.setVoterRewardCommission(group, tenPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    // Group deregisters after epoch ends but before processGroup is called
    validators.setIsValidatorGroup(group, false);

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    // No commission should be released — group is no longer registered
    assertEq(
      groupBalanceAfter,
      groupBalanceBefore,
      "Deregistered group should not receive commission"
    );

    // Voters should receive full rewards (no commission deducted)
    assertEq(
      election.distributedEpochRewards(group),
      groupEpochRewards,
      "Voters should receive full rewards when group is deregistered"
    );
  }

  function test_handlesFullCommission() public {
    uint256 fullCommission = 1000000000000000000000000; // FixidityLib.fixed1() = 100%
    validators.setVoterRewardCommission(group, fullCommission);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);

    epochManagerContract.processGroup(group, address(0), address(0));

    // Voters should receive nothing
    assertEq(
      election.distributedEpochRewards(group),
      0,
      "Voters should receive nothing with 100% commission"
    );

    // Group should receive everything
    uint256 groupBalanceAfter = celoToken.balanceOf(group);
    assertEq(
      groupBalanceAfter - groupBalanceBefore,
      groupEpochRewards,
      "Group should receive all rewards as commission"
    );
  }

  function test_deductsCommissionViaFinishNextEpochProcess() public {
    validators.setVoterRewardCommission(group, tenPercent);

    epochManagerContract.startNextEpochProcess();

    (
      address[] memory groups,
      address[] memory lessers,
      address[] memory greaters
    ) = getGroupsWithLessersAndGreaters();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);

    epochManagerContract.finishNextEpochProcess(groups, lessers, greaters);

    // Voters should receive 90% of rewards
    uint256 expectedVoterRewards = 900 ether;
    assertEq(
      election.distributedEpochRewards(group),
      expectedVoterRewards,
      "Voters should receive rewards minus commission via finishNextEpochProcess"
    );

    // Group should receive 10% as CELO from treasury
    uint256 expectedCommission = 100 ether;
    uint256 groupBalanceAfter = celoToken.balanceOf(group);
    assertEq(
      groupBalanceAfter - groupBalanceBefore,
      expectedCommission,
      "Group should receive commission via finishNextEpochProcess"
    );
  }

  function test_noTreasuryReleaseWhenCommissionRoundsToZero() public {
    // With small epoch rewards, the multiplication result should round down to 0.
    uint256 tinyCommission = 1;
    validators.setVoterRewardCommission(group, tinyCommission);

    election.setGroupEpochRewardsBasedOnScore(group, 1);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);

    epochManagerContract.processGroup(group, address(0), address(0));

    // Commission rounds to 0, so group should not receive any CELO
    uint256 groupBalanceAfter = celoToken.balanceOf(group);
    assertEq(
      groupBalanceAfter,
      groupBalanceBefore,
      "No CELO should be released when commission rounds to zero"
    );

    // Full rewards should go to voters
    assertEq(
      election.distributedEpochRewards(group),
      1,
      "Full rewards should go to voters when commission rounds to zero"
    );
  }
}

contract EpochManagerTest_voterRewardCommission_Fuzz is EpochManagerTest {
  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
    validators.setMaxVoterRewardCommission(FIXED1);
  }

  /// @notice Conservation invariant: commission + voterRewards == totalEpochRewards
  /// for any valid commission rate.
  function test_conservesTotalRewardsForAnyCommission(uint256 commissionRate) public {
    commissionRate = bound(commissionRate, 1, FIXED1);
    uint256 groupEpochRewards = 1000e18;

    validators.setVoterRewardCommission(group, commissionRate);
    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;
    uint256 voterRewardsDistributed = election.distributedEpochRewards(group);

    assertEq(
      commissionReceived + voterRewardsDistributed,
      groupEpochRewards,
      "Conservation: commission + voter rewards must equal total epoch rewards"
    );
  }

  /// @notice Conservation invariant holds for any epoch reward amount.
  function test_conservesTotalRewardsForAnyEpochRewardAmount(uint256 rewardAmount) public {
    // Bound below treasury balance — allocateValidatorsRewards() consumes part of it first.
    rewardAmount = bound(rewardAmount, 1, L2_INITIAL_STASH_BALANCE / 2);
    uint256 commissionRate = 100000000000000000000000; // 10%

    validators.setVoterRewardCommission(group, commissionRate);
    election.setGroupEpochRewardsBasedOnScore(group, rewardAmount);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;
    uint256 voterRewardsDistributed = election.distributedEpochRewards(group);

    assertEq(
      commissionReceived + voterRewardsDistributed,
      rewardAmount,
      "Conservation: commission + voter rewards must equal total epoch rewards"
    );
  }

  /// @notice Conservation invariant holds for any commission rate AND any reward amount.
  function test_conservesTotalRewardsForAnyCommissionAndRewards(
    uint256 commissionRate,
    uint256 rewardAmount
  ) public {
    commissionRate = bound(commissionRate, 1, FIXED1);
    rewardAmount = bound(rewardAmount, 1, L2_INITIAL_STASH_BALANCE / 2);

    validators.setVoterRewardCommission(group, commissionRate);
    election.setGroupEpochRewardsBasedOnScore(group, rewardAmount);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;
    uint256 voterRewardsDistributed = election.distributedEpochRewards(group);

    assertEq(
      commissionReceived + voterRewardsDistributed,
      rewardAmount,
      "Conservation: commission + voter rewards must equal total epoch rewards"
    );
  }

  /// @notice Verify the commission math matches expected FixidityLib calculation.
  /// commissionAmount = floor(epochRewards * commissionRate / FIXED1)
  function test_commissionAmountMatchesExpectedCalculation(
    uint256 commissionRate,
    uint256 rewardAmount
  ) public {
    commissionRate = bound(commissionRate, 1, FIXED1);
    rewardAmount = bound(rewardAmount, 1, L2_INITIAL_STASH_BALANCE / 2);

    validators.setVoterRewardCommission(group, commissionRate);
    election.setGroupEpochRewardsBasedOnScore(group, rewardAmount);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;

    // Expected: FixidityLib.newFixed(rewardAmount).multiply(wrap(commissionRate)).fromFixed()
    // which is: (rewardAmount * FIXED1) * commissionRate / FIXED1 / FIXED1
    //         = rewardAmount * commissionRate / FIXED1
    uint256 expectedCommission = (rewardAmount * commissionRate) / FIXED1;

    assertEq(
      commissionReceived,
      expectedCommission,
      "Commission amount must match FixidityLib floor calculation"
    );
  }

  /// @notice At 100% commission, group receives all rewards and voters receive nothing.
  function test_fullCommissionForAnyRewardAmount(uint256 rewardAmount) public {
    rewardAmount = bound(rewardAmount, 1, L2_INITIAL_STASH_BALANCE / 2);

    validators.setVoterRewardCommission(group, FIXED1);
    election.setGroupEpochRewardsBasedOnScore(group, rewardAmount);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    assertEq(
      groupBalanceAfter - groupBalanceBefore,
      rewardAmount,
      "Group should receive all rewards at 100% commission"
    );
    assertEq(
      election.distributedEpochRewards(group),
      0,
      "Voters should receive nothing at 100% commission"
    );
  }
}

contract EpochManagerTest_voterRewardCommission_DuringEpochProcessing is EpochManagerTest {
  uint256 groupEpochRewards = 1000e18;
  uint256 tenPercent = 100000000000000000000000; // FixidityLib.newFixedFraction(10, 100)
  uint256 fiftyPercent = 500000000000000000000000; // FixidityLib.newFixedFraction(50, 100)

  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
    validators.setMaxVoterRewardCommission(FIXED1);
    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  /// @notice Demonstrates that commission read at processGroup() time uses the
  /// value active at that moment — NOT the value at epoch start.
  /// A group can activate a new commission between setToProcessGroups() and
  /// processGroup() to apply a different rate to already-computed rewards.
  function test_usesCommissionActiveAtProcessingTime() public {
    // Set initial commission to 10%
    validators.setVoterRewardCommission(group, tenPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();
    // Rewards are now computed and stored in processedGroups[group] = 1000e18

    // --- Simulate group activating a queued commission update mid-processing ---
    // In production, this would be updateVoterRewardCommission() called by the group.
    // Using the mock's direct setter to simulate the effect.
    validators.setVoterRewardCommission(group, fiftyPercent);

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;
    uint256 voterRewardsDistributed = election.distributedEpochRewards(group);

    // Commission should be 50% of 1000e18 = 500e18 (the NEW rate, not the 10% initial)
    uint256 expectedCommission = 500e18;
    uint256 expectedVoterRewards = 500e18;

    assertEq(
      commissionReceived,
      expectedCommission,
      "Commission should use the rate active at processGroup time (50%), not at epoch start (10%)"
    );
    assertEq(
      voterRewardsDistributed,
      expectedVoterRewards,
      "Voter rewards should reflect the commission rate active at processGroup time"
    );
  }

  /// @notice A group can reduce its commission to 0 during epoch processing,
  /// causing voters to receive full rewards despite commission being set at epoch start.
  function test_usesZeroCommissionWhenRemovedDuringProcessing() public {
    validators.setVoterRewardCommission(group, fiftyPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    // Group removes commission mid-processing
    validators.setVoterRewardCommission(group, 0);

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    assertEq(
      groupBalanceAfter,
      groupBalanceBefore,
      "Group should receive nothing when commission zeroed during processing"
    );
    assertEq(
      election.distributedEpochRewards(group),
      groupEpochRewards,
      "Voters should receive full rewards when commission zeroed during processing"
    );
  }

  /// @notice Conservation invariant holds even when commission changes mid-processing.
  function test_conservesTotalRewardsWhenCommissionChangedDuringProcessing(
    uint256 initialRate,
    uint256 newRate
  ) public {
    initialRate = bound(initialRate, 1, FIXED1);
    newRate = bound(newRate, 0, FIXED1);

    validators.setVoterRewardCommission(group, initialRate);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    // Change commission mid-processing
    validators.setVoterRewardCommission(group, newRate);

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;
    uint256 voterRewardsDistributed = election.distributedEpochRewards(group);

    assertEq(
      commissionReceived + voterRewardsDistributed,
      groupEpochRewards,
      "Conservation must hold even when commission changes during epoch processing"
    );

    // Verify the NEW rate was used, not the initial one
    uint256 expectedCommission = (groupEpochRewards * newRate) / FIXED1;
    assertEq(
      commissionReceived,
      expectedCommission,
      "Commission should be calculated using the rate active at processGroup time"
    );
  }
}

contract EpochManagerTest_voterRewardCommission_MaxCapClamp is EpochManagerTest {
  uint256 groupEpochRewards = 1000e18;
  uint256 fiftyPercent = 500000000000000000000000; // 50%
  uint256 twentyPercent = 200000000000000000000000; // 20%
  uint256 tenPercent = 100000000000000000000000; // 10%

  function setUp() public override(EpochManagerTest) {
    super.setUp();
    setupAndElectValidators();
    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  /// @notice When a group's active commission (50%) exceeds the governance cap (20%),
  /// the effective commission is clamped to the cap at distribution time.
  function test_clampsCommissionToMaxCapAtDistributionTime() public {
    // Group has 50% commission active
    validators.setVoterRewardCommission(group, fiftyPercent);
    // Governance sets cap to 20%
    validators.setMaxVoterRewardCommission(twentyPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;

    // Should be clamped to 20%, not the group's 50%
    uint256 expectedCommission = 200e18; // 20% of 1000e18
    assertEq(
      commissionReceived,
      expectedCommission,
      "Commission should be clamped to maxVoterRewardCommission"
    );

    // Voters get the remaining 80%
    assertEq(
      election.distributedEpochRewards(group),
      800e18,
      "Voters should receive rewards minus clamped commission"
    );
  }

  /// @notice When commission is below the cap, no clamping occurs.
  function test_doesNotClampWhenCommissionBelowCap() public {
    validators.setVoterRewardCommission(group, tenPercent);
    validators.setMaxVoterRewardCommission(twentyPercent);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    // 10% commission, below 20% cap — no clamping
    assertEq(
      groupBalanceAfter - groupBalanceBefore,
      100 ether,
      "Commission below cap should not be clamped"
    );
  }

  /// @notice When maxVoterRewardCommission is 0 (default), commission is clamped to 0.
  function test_clampsCommissionToZeroWhenMaxCapIsZero() public {
    validators.setVoterRewardCommission(group, fiftyPercent);
    // maxVoterRewardCommission defaults to 0 = commissions disabled

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    // maxVoterRewardCommission is 0, so commission is clamped to 0
    assertEq(
      groupBalanceAfter - groupBalanceBefore,
      0,
      "Commission should be clamped to 0 when max cap is 0"
    );
  }

  /// @notice Conservation invariant holds with clamping — for any commission and cap combo.
  function test_conservesTotalRewardsWithClamping(uint256 commissionRate, uint256 maxCap) public {
    commissionRate = bound(commissionRate, 1, FIXED1);
    maxCap = bound(maxCap, 1, FIXED1);

    validators.setVoterRewardCommission(group, commissionRate);
    validators.setMaxVoterRewardCommission(maxCap);

    epochManagerContract.startNextEpochProcess();
    epochManagerContract.setToProcessGroups();

    uint256 groupBalanceBefore = celoToken.balanceOf(group);
    epochManagerContract.processGroup(group, address(0), address(0));
    uint256 groupBalanceAfter = celoToken.balanceOf(group);

    uint256 commissionReceived = groupBalanceAfter - groupBalanceBefore;
    uint256 voterRewardsDistributed = election.distributedEpochRewards(group);

    assertEq(
      commissionReceived + voterRewardsDistributed,
      groupEpochRewards,
      "Conservation must hold with max cap clamping"
    );

    // Effective rate should be min(commissionRate, maxCap)
    uint256 effectiveRate = commissionRate < maxCap ? commissionRate : maxCap;
    uint256 expectedCommission = (groupEpochRewards * effectiveRate) / FIXED1;
    assertEq(
      commissionReceived,
      expectedCommission,
      "Commission should use min(groupCommission, maxCap)"
    );
  }
}

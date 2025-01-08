// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/common/interfaces/ICeloToken.sol";
import { ICeloUnreleasedTreasury } from "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";
import { MockElection } from "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/stability/test/MockSortedOracles.sol";

import "@celo-contracts-8/common/ScoreManager.sol";
import { MockAccounts } from "@celo-contracts-8/common/mocks/MockAccounts.sol";
import "@celo-contracts-8/common/mocks/EpochManager_WithMocks.sol";
import "@celo-contracts-8/common/test/MockCeloToken.sol";
import { MockCeloUnreleasedTreasury } from "@celo-contracts-8/common/test/MockCeloUnreleasedTreasury.sol";
import { IMockValidators } from "@celo-contracts-8/governance/test/IMockValidators.sol";
import { EpochRewardsMock08 } from "@celo-contracts-8/governance/test/EpochRewardsMock.sol";
import "@celo-contracts-8/stability/test/MockStableToken.sol";

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { ValidatorsMock } from "@test-sol/unit/governance/validators/mocks/ValidatorsMock.sol";

contract EpochManagerTest is TestWithUtils08 {
  EpochManager_WithMocks epochManagerContract;
  MockSortedOracles sortedOracles;

  MockStableToken08 stableToken;
  EpochRewardsMock08 epochRewards;
  MockElection election;
  MockAccounts accounts;
  IMockValidators validators;

  address carbonOffsettingPartner;
  address communityRewardFund;
  address reserveAddress;
  address scoreManagerAddress;
  address accountsAddress;

  uint256 firstEpochNumber = 100;
  uint256 firstEpochBlock = 100;
  uint256 epochDuration = DAY;
  address[] firstElected;

  MockCeloToken08 celoToken;
  MockCeloUnreleasedTreasury celoUnreleasedTreasury;
  ScoreManager scoreManager;

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;

  uint256 validator1Reward = 42e18;
  uint256 validator2Reward = 43e18;

  address validator1;
  address validator2;

  address group = actor("group");

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

  function setUp() public virtual override {
    super.setUp();
    epochManagerContract = new EpochManager_WithMocks();
    sortedOracles = new MockSortedOracles();
    epochRewards = new EpochRewardsMock08();
    validators = IMockValidators(actor("validators05"));
    stableToken = new MockStableToken08();
    celoToken = new MockCeloToken08();
    celoUnreleasedTreasury = new MockCeloUnreleasedTreasury();
    election = new MockElection();
    accounts = new MockAccounts();

    validator1 = actor("validator");
    validator2 = actor("otherValidator");

    firstElected.push(validator1);
    firstElected.push(validator2);

    scoreManagerAddress = actor("scoreManagerAddress");
    accountsAddress = actor("accountsAddress");

    reserveAddress = actor("reserve");

    carbonOffsettingPartner = actor("carbonOffsettingPartner");
    communityRewardFund = actor("communityRewardFund");

    deployCodeTo("MockRegistry.sol", abi.encode(false), REGISTRY_ADDRESS);
    deployCodeTo("ScoreManager.sol", abi.encode(false), scoreManagerAddress);
    deployCodeTo("Accounts.sol", abi.encode(false), accountsAddress);
    deployCodeTo("MockValidators.sol", abi.encode(false), address(validators));

    scoreManager = ScoreManager(scoreManagerAddress);

    registry.setAddressFor(EpochManagerContract, address(epochManagerContract));
    registry.setAddressFor(SortedOraclesContract, address(sortedOracles));
    registry.setAddressFor(GovernanceContract, communityRewardFund);
    registry.setAddressFor(EpochRewardsContract, address(epochRewards));
    registry.setAddressFor(ValidatorsContract, address(validators));
    registry.setAddressFor(ScoreManagerContract, address(scoreManager));
    registry.setAddressFor(StableTokenContract, address(stableToken));
    registry.setAddressFor(CeloUnreleasedTreasuryContract, address(celoUnreleasedTreasury));
    registry.setAddressFor(CeloTokenContract, address(celoToken));
    registry.setAddressFor(ReserveContract, reserveAddress);
    registry.setAddressFor(ElectionContract, address(election));
    registry.setAddressFor(AccountsContract, address(accounts));

    celoToken.setTotalSupply(CELO_SUPPLY_CAP);
    vm.deal(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);
    celoToken.setBalanceOf(address(celoUnreleasedTreasury), L2_INITIAL_STASH_BALANCE);

    celoUnreleasedTreasury.setRegistry(REGISTRY_ADDRESS);

    sortedOracles.setMedianRate(address(stableToken), stableAmountForRate);

    scoreManager.setValidatorScore(validator1, 1);

    epochManagerContract.initialize(REGISTRY_ADDRESS, 10);
    epochRewards.setCarbonOffsettingPartner(carbonOffsettingPartner);

    blockTravel(firstEpochBlock);

    validators.setEpochRewards(validator1, validator1Reward);
    validators.setEpochRewards(validator2, validator2Reward);
  }

  function initializeEpochManagerSystem() public {
    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    accounts.setValidatorSigner(validator1, validator1);
    validators.setValidator(validator2);
    accounts.setValidatorSigner(validator2, validator2);

    address[] memory members = new address[](2);
    members[0] = validator1;
    members[1] = validator2;
    validators.setMembers(group, members);

    election.setElectedValidators(members);

    vm.prank(epochManagerEnabler);
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

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
    epochManagerContract.initialize(REGISTRY_ADDRESS, 10);
  }
}

contract EpochManagerTest_initializeSystem is EpochManagerTest {
  function test_processCanBeStarted() public virtual {
    vm.prank(epochManagerEnabler);
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    (
      uint256 _firstEpochBlock,
      uint256 _lastEpochBlock,
      uint256 _startTimestamp,
      uint256 _currentRewardsBlock
    ) = epochManagerContract.getCurrentEpoch();
    assertGt(epochManagerContract.getElectedAccounts().length, 0);
    assertEq(epochManagerContract.firstKnownEpoch(), firstEpochNumber);
    assertEq(_firstEpochBlock, firstEpochBlock);
    assertEq(_lastEpochBlock, 0);
    assertEq(_startTimestamp, block.timestamp);
    assertEq(_currentRewardsBlock, 0);
    assertEq(epochManagerContract.getElectedAccounts(), firstElected);
  }

  function test_Reverts_processCannotBeStartedAgain() public virtual {
    vm.prank(epochManagerEnabler);
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
    vm.prank(epochManagerEnabler);
    vm.expectRevert("Epoch system already initialized");
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }

  function test_Reverts_WhenSystemInitializedByOtherContract() public virtual {
    vm.expectRevert("msg.sender is not Enabler");
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
  }
}

contract EpochManagerTest_startNextEpochProcess is EpochManagerTest {
  function test_Reverts_whenSystemNotInitialized() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.startNextEpochProcess();
  }

  function test_Reverts_WhenEndOfEpochHasNotBeenReached() public {
    vm.prank(epochManagerEnabler);
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

    vm.expectRevert("Epoch is not ready to start");
    epochManagerContract.startNextEpochProcess();
  }

  function test_Reverts_WhenEpochProcessingAlreadyStarted() public {
    initializeEpochManagerSystem();

    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("Epoch process is already started");
    epochManagerContract.startNextEpochProcess();
  }

  function test_Emits_EpochProcessingStartedEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit EpochProcessingStarted(firstEpochNumber);
    epochManagerContract.startNextEpochProcess();
  }

  function test_SetsTheEpochRewardBlock() public {
    initializeEpochManagerSystem();

    epochManagerContract.startNextEpochProcess();
    (, , , uint256 _currentRewardsBlock) = epochManagerContract.getCurrentEpoch();
    assertEq(_currentRewardsBlock, block.number);
  }

  function test_SetsTheEpochRewardAmounts() public {
    initializeEpochManagerSystem();

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
    initializeEpochManagerSystem();
    epochManagerContract.startNextEpochProcess();

    assertEq(validators.mintedStable(), validator1Reward + validator2Reward);
  }

  function test_ShouldReleaseCorrectAmountToReserve() public {
    initializeEpochManagerSystem();
    epochManagerContract.startNextEpochProcess();
    uint256 reserveBalanceAfter = celoToken.balanceOf(reserveAddress);
    assertEq(
      reserveBalanceAfter,
      (stableAmountForRate * (validator1Reward + validator2Reward)) / 1e24
    );
  }
}

contract EpochManagerTest_setEpochDuration is EpochManagerTest {
  uint256 newEpochDuration = 5 * DAY;

  function test_setsNewEpochDuration() public {
    initializeEpochManagerSystem();
    epochManagerContract.setEpochDuration(newEpochDuration);
    assertEq(epochManagerContract.epochDuration(), newEpochDuration);
  }

  function test_Emits_EpochDurationSetEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit EpochDurationSet(newEpochDuration);
    epochManagerContract.setEpochDuration(newEpochDuration);
  }

  function test_Reverts_WhenIsOnEpochProcess() public {
    initializeEpochManagerSystem();
    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("Cannot change epoch duration during processing.");
    epochManagerContract.setEpochDuration(newEpochDuration);
  }

  function test_Reverts_WhenNewEpochDurationIsZero() public {
    initializeEpochManagerSystem();

    vm.expectRevert("New epoch duration must be greater than zero.");
    epochManagerContract.setEpochDuration(0);
  }
}

contract EpochManagerTest_setOracleAddress is EpochManagerTest {
  address newOracleAddress = actor("newOarcle");

  function test_setsNewOracleAddress() public {
    initializeEpochManagerSystem();
    epochManagerContract.setOracleAddress(newOracleAddress);
    assertEq(epochManagerContract.oracleAddress(), newOracleAddress);
  }

  function test_Emits_OracleAddressSetEvent() public {
    initializeEpochManagerSystem();

    vm.expectEmit(true, true, true, true);
    emit OracleAddressSet(newOracleAddress);
    epochManagerContract.setOracleAddress(newOracleAddress);
  }

  function test_Reverts_WhenIsOnEpochProcess() public {
    initializeEpochManagerSystem();
    epochManagerContract.startNextEpochProcess();
    vm.expectRevert("Cannot change oracle address during epoch processing.");
    epochManagerContract.setOracleAddress(newOracleAddress);
  }

  function test_Reverts_WhenNewOracleAddressIsZero() public {
    initializeEpochManagerSystem();

    vm.expectRevert("Cannot set address zero as the Oracle.");
    epochManagerContract.setOracleAddress(address(0));
  }

  function test_Reverts_WhenNewOracleAddressIsunchanged() public {
    initializeEpochManagerSystem();

    vm.expectRevert("Oracle address cannot be the same.");
    epochManagerContract.setOracleAddress(address(sortedOracles));
  }
}

contract EpochManagerTest_sendValidatorPayment is EpochManagerTest {
  address signer1 = actor("signer1");
  address signer2 = actor("signer2");
  address beneficiary = actor("beneficiary");

  uint256 paymentAmount = 4 ether;
  uint256 quarterOfPayment = paymentAmount / 4;
  uint256 halfOfPayment = paymentAmount / 2;
  uint256 threeQuartersOfPayment = (paymentAmount / 4) * 3;
  uint256 twentyFivePercent = 250000000000000000000000;
  uint256 fiftyPercent = 500000000000000000000000;

  uint256 epochManagerBalanceBefore;

  function setUp() public override {
    super.setUp();

    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    accounts.setValidatorSigner(validator1, signer1);
    validators.setValidator(validator2);
    accounts.setValidatorSigner(validator2, signer2);

    address[] memory members = new address[](2);
    members[0] = validator1;
    members[1] = validator2;
    validators.setMembers(group, members);

    vm.prank(epochManagerEnabler);
    epochManagerContract.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

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
    accounts.setPaymentDelegationFor(validator1, beneficiary, twentyFivePercent);

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
    accounts.setPaymentDelegationFor(validator1, beneficiary, fiftyPercent);

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
    accounts.setPaymentDelegationFor(validator1, beneficiary, fiftyPercent);

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
    accounts.setPaymentDelegationFor(validator2, beneficiary, fiftyPercent);

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
  address signer1 = actor("signer1");
  address signer2 = actor("signer2");

  address validator3 = actor("validator3");
  address validator4 = actor("validator4");

  address group2 = actor("group2");

  address[] elected;

  uint256 groupEpochRewards = 44e18;

  function setUp() public override {
    super.setUp();

    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    accounts.setValidatorSigner(validator1, signer1);
    validators.setValidator(validator2);
    accounts.setValidatorSigner(validator2, signer2);

    validators.setValidatorGroup(group2);
    validators.setValidator(validator3);
    validators.setValidator(validator4);

    address[] memory members = new address[](3);
    members[0] = validator1;
    members[1] = validator2;
    validators.setMembers(group, members);
    members[0] = validator3;
    members[1] = validator4;
    validators.setMembers(group2, members);

    vm.prank(epochManagerEnabler);
    initializeEpochManagerSystem();

    elected = epochManagerContract.getElectedAccounts();

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
  address signer1 = actor("signer1");
  address signer2 = actor("signer2");

  address validator3 = actor("validator3");
  address validator4 = actor("validator4");

  address group2 = actor("group2");

  address[] elected;

  uint256 groupEpochRewards = 44e18;

  function setUp() public override {
    super.setUp();

    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    accounts.setValidatorSigner(validator1, signer1);
    validators.setValidator(validator2);
    accounts.setValidatorSigner(validator2, signer2);

    validators.setValidatorGroup(group2);
    validators.setValidator(validator3);
    validators.setValidator(validator4);

    address[] memory members = new address[](3);
    members[0] = validator1;
    members[1] = validator2;
    validators.setMembers(group, members);
    members[0] = validator3;
    members[1] = validator4;
    validators.setMembers(group2, members);

    vm.prank(epochManagerEnabler);
    initializeEpochManagerSystem();

    elected = epochManagerContract.getElectedAccounts();

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
  address signer1 = actor("signer1");
  address signer2 = actor("signer2");
  address signer3 = actor("signer3");
  address signer4 = actor("signer4");

  address validator3 = actor("validator3");
  address validator4 = actor("validator4");

  address group2 = actor("group2");

  address[] elected;

  uint256 groupEpochRewards = 44e18;

  function setUp() public override {
    super.setUp();

    validators.setValidatorGroup(group);
    validators.setValidator(validator1);
    accounts.setValidatorSigner(validator1, signer1);
    validators.setValidator(validator2);
    accounts.setValidatorSigner(validator2, signer2);

    validators.setValidatorGroup(group2);
    validators.setValidator(validator3);
    validators.setValidator(validator4);

    address[] memory members = new address[](3);
    members[0] = validator1;
    members[1] = validator2;
    validators.setMembers(group, members);
    members[0] = validator3;
    members[1] = validator4;
    validators.setMembers(group2, members);

    vm.prank(epochManagerEnabler);
    initializeEpochManagerSystem();

    elected = epochManagerContract.getElectedAccounts();

    election.setGroupEpochRewardsBasedOnScore(group, groupEpochRewards);
  }

  function test_Reverts_WhenNotStarted() public {
    vm.expectRevert("Indivudual epoch process is not started");
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
    election.setElectedValidators(newElected);

    address[] memory signers = new address[](2);
    signers[0] = signer3;
    signers[1] = signer4;
    accounts.setValidatorSigner(validator3, signer3);
    accounts.setValidatorSigner(validator4, signer4);

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
  function test_shouldReturnTheEpochInfoOfSpecifiedEpoch() public {
    uint256 numberOfEpochsToTravel = 9;

    initializeEpochManagerSystem();
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
    initializeEpochManagerSystem();
    uint256 _startingEpochNumber = epochManagerContract.getCurrentEpochNumber();
    uint256 numberOfEpochsToTravel = 7;
    (
      uint256 _startingEpochFirstBlock,
      uint256 _startingLastBlock,
      uint256 _startingStartTimestamp,
      uint256 _startingRewardBlock
    ) = epochManagerContract.getCurrentEpoch();

    _travelAndProcess_N_L2Epoch(numberOfEpochsToTravel);

    (
      uint256 _initialFirstBlock,
      uint256 _initialLastBlock,
      uint256 _initialStartTimestamp,
      uint256 _initialRewardBlock
    ) = epochManagerContract.getEpochByNumber(_startingEpochNumber);

    assertEq(_initialFirstBlock, _startingEpochFirstBlock);
    assertEq(_initialLastBlock, _startingLastBlock + (L2_BLOCK_IN_EPOCH * 2) + firstEpochBlock);
    assertEq(_initialStartTimestamp, _startingStartTimestamp);
    assertEq(
      _initialRewardBlock,
      _startingRewardBlock + (L2_BLOCK_IN_EPOCH * 2) + firstEpochBlock + 1
    );
  }

  function test_ReturnsZeroForFutureEpochs() public {
    initializeEpochManagerSystem();
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
  function test_ShouldRetreiveTheCorrectBlockNumberOfTheEpoch() public {
    initializeEpochManagerSystem();
    assertEq(epochManagerContract.getEpochNumberOfBlock(firstEpochBlock), firstEpochNumber);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getEpochNumberOfBlock(firstEpochBlock);
  }
}

contract EpochManagerTest_getEpochByBlockNumber is EpochManagerTest {
  function test_ShouldRetreiveTheCorrectEpochInfoOfGivenBlock() public {
    initializeEpochManagerSystem();

    _travelAndProcess_N_L2Epoch(2);

    (uint256 _firstBlock, uint256 _lastBlock, , ) = epochManagerContract.getEpochByBlockNumber(
      firstEpochBlock + (3 * L2_BLOCK_IN_EPOCH)
    );
    assertEq(_firstBlock, firstEpochBlock + 1 + (2 * L2_BLOCK_IN_EPOCH));
    assertEq(_lastBlock, firstEpochBlock + 1 + (3 * L2_BLOCK_IN_EPOCH) - 1);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getEpochNumberOfBlock(firstEpochBlock);
  }
}

contract EpochManagerTest_numberOfElectedInCurrentSet is EpochManagerTest {
  function test_ShouldRetreiveTheNumberOfElected() public {
    initializeEpochManagerSystem();
    assertEq(epochManagerContract.numberOfElectedInCurrentSet(), 2);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.numberOfElectedInCurrentSet();
  }
}

contract EpochManagerTest_getElectedAccounts is EpochManagerTest {
  function test_ShouldRetreiveThelistOfElectedAccounts() public {
    initializeEpochManagerSystem();
    assertEq(epochManagerContract.getElectedAccounts(), firstElected);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getElectedAccounts();
  }
}

contract EpochManagerTest_getElectedAccountByIndex is EpochManagerTest {
  function test_ShouldRetreiveThecorrectValidator() public {
    initializeEpochManagerSystem();
    assertEq(epochManagerContract.getElectedAccountByIndex(0), validator1);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getElectedAccountByIndex(0);
  }
}
contract EpochManagerTest_getElectedSigners is EpochManagerTest {
  function test_ShouldRetreiveTheElectedSigners() public {
    initializeEpochManagerSystem();
    address[] memory electedSigners = new address[](firstElected.length);
    electedSigners[0] = accounts.getValidatorSigner(firstElected[0]);
    electedSigners[1] = accounts.getValidatorSigner(firstElected[1]);
    assertEq(epochManagerContract.getElectedSigners(), electedSigners);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getElectedSigners();
  }
}
contract EpochManagerTest_getElectedSignerByIndex is EpochManagerTest {
  function test_ShouldRetreiveThecorrectElectedSigner() public {
    initializeEpochManagerSystem();
    address[] memory electedSigners = new address[](firstElected.length);

    electedSigners[1] = accounts.getValidatorSigner(firstElected[1]);
    assertEq(epochManagerContract.getElectedSignerByIndex(1), electedSigners[1]);
  }

  function test_Reverts_WhenL1() public {
    vm.expectRevert("Epoch system not initialized");
    epochManagerContract.getElectedSignerByIndex(1);
  }
}

pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "@celo-contracts/governance/Governance.sol";
import "@celo-contracts/governance/Proposals.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/governance/test/TestTransactions.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/Signatures.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/FixidityLib.sol";

contract GovernanceMock is Governance(true) {
  address[] validatorSet;

  // Minimally override core functions from UsingPrecompiles
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return validatorSet.length;
  }

  function numberValidatorsInSet(uint256) public view returns (uint256) {
    return validatorSet.length;
  }

  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    return validatorSet[index];
  }

  // Expose test utilities
  function addValidator(address validator) external {
    validatorSet.push(validator);
  }

  // exposes removeVotesWhenRevokingDelegatedVotes for tests
  function removeVotesWhenRevokingDelegatedVotesTest(
    address account,
    uint256 maxAmountAllowed
  ) public {
    _removeVotesWhenRevokingDelegatedVotes(account, maxAmountAllowed);
  }

  function setDeprecatedWeight(
    address voterAddress,
    uint256 proposalIndex,
    uint256 weight,
    uint256 proposalId
  ) external {
    Voter storage voter = voters[voterAddress];
    VoteRecord storage voteRecord = voter.referendumVotes[proposalIndex];
    voteRecord.deprecated_weight = weight;
    voteRecord.proposalId = proposalId;
  }
}

contract GovernanceTest is Test {
  using FixidityLib for FixidityLib.Fraction;
  using BytesLib for bytes;

  struct Proposal {
    uint256[] values;
    address[] destinations;
    bytes data;
    uint256[] dataLengths;
    string description;
  }

  address accVoter;
  address accOwner;
  address accApprover;
  uint256 constant DEPOSIT = 5;
  uint256 constant VOTER_GOLD = 100;
  uint256 constant REFERENDUM_STAGE_DURATION = 5 * 60;
  uint256 constant CONCURRENT_PROPOSALS = 1;
  uint256 constant DEQUEUE_FREQUENCY = 10 * 60;
  uint256 constant QUERY_EXPIRY = 60 * 60;
  uint256 constant EXECUTION_STAGE_DURATION = 1 * 60;

  GovernanceMock governance;
  Accounts accounts;
  MockLockedGold mockLockedGold;
  MockValidators mockValidators;
  TestTransactions testTransactions;

  Proposal okProp;
  Proposal twoTxProp;
  Proposal failingProp;
  Proposal emptyProp;

  uint256 expectedParticipationBaseline;
  FixidityLib.Fraction baselineUpdateFactor;
  FixidityLib.Fraction participationBaseline;
  FixidityLib.Fraction participationFloor;
  FixidityLib.Fraction baselineQuorumFactor;

  function setUp() public {
    // Define Accounts
    accVoter = actor("voter");
    accOwner = actor("owner");
    accApprover = actor("approver");

    baselineUpdateFactor = FixidityLib.newFixedFraction(1, 5);
    participationBaseline = FixidityLib.newFixedFraction(5, 10);
    participationFloor = FixidityLib.newFixedFraction(5, 100);
    baselineQuorumFactor = FixidityLib.fixed1();
    expectedParticipationBaseline = FixidityLib
      .multiply(baselineUpdateFactor, FixidityLib.fixed1())
      .add(
        FixidityLib.multiply(
          FixidityLib.fixed1().subtract(baselineUpdateFactor),
          participationBaseline
        )
      )
      .unwrap();

    // change block.tiemstamp so we're not on timestamp = 0
    vm.warp(100 * 60);

    setUpContracts();
    setUpVoterAccount();
    setUpProposalStubs();
  }

  function setUpVoterAccount() private {
    vm.prank(accVoter);
    accounts.createAccount();

    mockLockedGold.setAccountTotalLockedGold(accVoter, VOTER_GOLD);
    mockLockedGold.setAccountTotalGovernancePower(accVoter, VOTER_GOLD);
  }

  function setUpContracts() private {
    vm.startPrank(accOwner);

    Registry registry = new Registry(true);

    mockValidators = new MockValidators();
    registry.setAddressFor("Validators", address(mockValidators));

    mockLockedGold = new MockLockedGold();
    mockLockedGold.setTotalLockedGold(VOTER_GOLD);
    registry.setAddressFor("LockedGold", address(mockLockedGold));

    accounts = new Accounts(true);
    accounts.initialize(address(registry));
    registry.setAddressFor("Accounts", address(accounts));

    governance = new GovernanceMock();
    governance.initialize(
      address(registry),
      accApprover,
      CONCURRENT_PROPOSALS,
      DEPOSIT,
      QUERY_EXPIRY,
      DEQUEUE_FREQUENCY,
      REFERENDUM_STAGE_DURATION,
      EXECUTION_STAGE_DURATION,
      participationBaseline.unwrap(),
      participationFloor.unwrap(),
      baselineUpdateFactor.unwrap(),
      baselineQuorumFactor.unwrap()
    );
    vm.stopPrank();
  }

  function setUpProposalStubs() private {
    testTransactions = new TestTransactions();

    string memory setValueSignature = "setValue(uint256,uint256,bool)";

    // Define OK Proposal
    okProp.data = abi.encodeWithSignature(setValueSignature, 1, 1, true);
    okProp.dataLengths.push(okProp.data.length);
    okProp.values.push(0);
    okProp.destinations.push(address(testTransactions));
    okProp.description = "1 tx proposal";

    // Define two TX proposal
    bytes memory txDataFirst = abi.encodeWithSignature(setValueSignature, 1, 1, true);
    bytes memory txDataSecond = abi.encodeWithSignature(setValueSignature, 2, 1, true);

    twoTxProp.values.push(0);
    twoTxProp.values.push(0);
    twoTxProp.destinations.push(address(testTransactions));
    twoTxProp.destinations.push(address(testTransactions));
    twoTxProp.data = txDataFirst.concat(txDataSecond);
    twoTxProp.dataLengths.push(txDataFirst.length);
    twoTxProp.dataLengths.push(txDataSecond.length);
    twoTxProp.description = "2 txs proposal";

    // Define failing proposal
    failingProp.data = abi.encodeWithSignature(setValueSignature, 3, 1, false);
    failingProp.dataLengths.push(failingProp.data.length);
    failingProp.values.push(0);
    failingProp.destinations.push(address(testTransactions));
    failingProp.description = "failing proposal";
  }

  function assertNotEq(uint256 a, uint256 b) internal {
    if (a == b) {
      emit log("Error: a != b not satisfied [uint]");
      emit log_named_uint("      Left", a);
      emit log_named_uint("     Right", b);
      fail();
    }
  }

  function makeValidProposal() internal returns (uint256 proposalId) {
    return
      governance.propose.value(DEPOSIT)(
        okProp.values,
        okProp.destinations,
        okProp.data,
        okProp.dataLengths,
        okProp.description
      );
  }

  function makeEmptyProposal() internal returns (uint256 proposalId) {
    Proposal memory emptyProposal;
    return
      governance.propose.value(DEPOSIT)(
        emptyProposal.values,
        emptyProposal.destinations,
        emptyProposal.data,
        emptyProposal.dataLengths,
        "empty proposal"
      );
  }

  function makeAndApproveProposal(uint256 index) internal returns (uint256 id) {
    id = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(id, index);
  }

  function authorizeValidatorSigner(uint256 signerPk, address account) internal {
    bytes32 messageHash = keccak256(abi.encodePacked(account));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(messageHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, prefixedHash);
    vm.prank(account);
    accounts.authorizeValidatorSigner(vm.addr(signerPk), v, r, s);
  }

  function authorizeVoteSigner(uint256 signerPk, address account) internal {
    bytes32 messageHash = keccak256(abi.encodePacked(account));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(messageHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, prefixedHash);
    vm.prank(account);
    accounts.authorizeVoteSigner(vm.addr(signerPk), v, r, s);
  }
}

contract GovernanceTest_initialize is GovernanceTest {
  function test_SetsTheOwner() public {
    assertEq(governance.owner(), accOwner);
  }

  function test_SetsConcurrentProposals() public {
    assertEq(governance.concurrentProposals(), 1);
  }

  function test_SetsMinDeposit() public {
    assertEq(governance.minDeposit(), 5);
  }

  function test_SetsQueueExpiry() public {
    assertEq(governance.queueExpiry(), QUERY_EXPIRY);
  }

  function test_SetsDequeueFrequency() public {
    assertEq(governance.dequeueFrequency(), DEQUEUE_FREQUENCY);
  }

  function test_SetsStageDurations() public {
    assertEq(governance.getReferendumStageDuration(), REFERENDUM_STAGE_DURATION);
    assertEq(governance.getExecutionStageDuration(), EXECUTION_STAGE_DURATION);
  }

  function test_SetsParticipationParameters() public {
    (
      uint256 actualParticipationBaseline,
      uint256 actualParticipationFloor,
      uint256 actualBaselineUpdateFactor,
      uint256 actualBaselineQuorumFactor
    ) = governance.getParticipationParameters();
    assertEq(actualParticipationBaseline, FixidityLib.newFixedFraction(5, 10).unwrap());
    assertEq(actualParticipationFloor, FixidityLib.newFixedFraction(5, 100).unwrap());
    assertEq(actualBaselineUpdateFactor, FixidityLib.newFixedFraction(1, 5).unwrap());
    assertEq(actualBaselineQuorumFactor, FixidityLib.newFixed(1).unwrap());
  }

  // TODO: Consider testing reversion when 0 values provided
  function test_RevertIf_CalledAgain() public {
    vm.expectRevert("contract already initialized");
    governance.initialize(
      address(1),
      accApprover,
      1,
      1,
      1,
      1,
      1,
      1,
      FixidityLib.newFixed(1).unwrap(),
      FixidityLib.newFixed(1).unwrap(),
      FixidityLib.newFixed(1).unwrap(),
      FixidityLib.newFixed(1).unwrap()
    );
  }
}

contract GovernanceTest_setApprover is GovernanceTest {
  event ApproverSet(address indexed approver);

  address NEW_APPROVER = address(7777);

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setApprover(NEW_APPROVER);
    assertEq(governance.approver(), NEW_APPROVER);
  }

  function test_emitTheApproverSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ApproverSet(NEW_APPROVER);
    vm.prank(accOwner);
    governance.setApprover(NEW_APPROVER);
  }

  function test_RevertIf_NullAddress() public {
    vm.expectRevert("Approver cannot be 0");
    vm.prank(accOwner);
    governance.setApprover(address(0));
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("Approver unchanged");
    vm.prank(accOwner);
    governance.setApprover(accApprover);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setApprover(NEW_APPROVER);
  }
}

contract GovernanceTest_setMinDeposit is GovernanceTest {
  event MinDepositSet(uint256 minDeposit);

  uint256 NEW_MINDEPOSIT = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setMinDeposit(NEW_MINDEPOSIT);
    assertEq(governance.minDeposit(), NEW_MINDEPOSIT);
  }

  function test_emitTheMinDepositSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit MinDepositSet(NEW_MINDEPOSIT);
    vm.prank(accOwner);
    governance.setMinDeposit(NEW_MINDEPOSIT);
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("Minimum deposit unchanged");
    vm.prank(accOwner);
    governance.setMinDeposit(5);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setMinDeposit(NEW_MINDEPOSIT);
  }
}

contract GovernanceTest_setConcurrentProposals is GovernanceTest {
  event ConcurrentProposalsSet(uint256 concurrentProposals);

  uint256 NEW_CONCURRENT_PROPOSALS = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setConcurrentProposals(NEW_CONCURRENT_PROPOSALS);
    assertEq(governance.concurrentProposals(), NEW_CONCURRENT_PROPOSALS);
  }

  function test_emitTheConcurrentProposalsSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ConcurrentProposalsSet(NEW_CONCURRENT_PROPOSALS);
    vm.prank(accOwner);
    governance.setConcurrentProposals(NEW_CONCURRENT_PROPOSALS);
  }

  function test_RevertIf_SetZero() public {
    vm.expectRevert("Number of proposals must be larger than zero");
    vm.prank(accOwner);
    governance.setConcurrentProposals(0);
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("Number of proposals unchanged");
    vm.prank(accOwner);
    governance.setConcurrentProposals(1);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setConcurrentProposals(NEW_CONCURRENT_PROPOSALS);
  }
}

contract GovernanceTest_setQueueExpiry is GovernanceTest {
  event QueueExpirySet(uint256 queueExpiry);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setQueueExpiry(NEW_VALUE);
    assertEq(governance.queueExpiry(), NEW_VALUE);
  }

  function test_emitTheQueueExpirySetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit QueueExpirySet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setQueueExpiry(NEW_VALUE);
  }

  function test_RevertIf_SetZero() public {
    vm.expectRevert("QueueExpiry must be larger than 0");
    vm.prank(accOwner);
    governance.setQueueExpiry(0);
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("QueueExpiry unchanged");
    vm.prank(accOwner);
    governance.setQueueExpiry(QUERY_EXPIRY);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setQueueExpiry(NEW_VALUE);
  }
}

contract GovernanceTest_setDequeueFrequency is GovernanceTest {
  event DequeueFrequencySet(uint256 dequeueFrequency);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setDequeueFrequency(NEW_VALUE);
    assertEq(governance.dequeueFrequency(), NEW_VALUE);
  }

  function test_emitTheDequeueFrequencySetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit DequeueFrequencySet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setDequeueFrequency(NEW_VALUE);
  }

  function test_RevertIf_SetZero() public {
    vm.expectRevert("dequeueFrequency must be larger than 0");
    vm.prank(accOwner);
    governance.setDequeueFrequency(0);
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("dequeueFrequency unchanged");
    vm.prank(accOwner);
    governance.setDequeueFrequency(DEQUEUE_FREQUENCY);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setDequeueFrequency(NEW_VALUE);
  }
}

contract GovernanceTest_setReferendumStageDuration is GovernanceTest {
  event ReferendumStageDurationSet(uint256 value);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setReferendumStageDuration(NEW_VALUE);
    assertEq(governance.getReferendumStageDuration(), NEW_VALUE);
  }

  function test_emitTheReferendumStageDurationSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ReferendumStageDurationSet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setReferendumStageDuration(NEW_VALUE);
  }

  function test_RevertIf_SetZero() public {
    vm.expectRevert("Duration must be larger than 0");
    vm.prank(accOwner);
    governance.setReferendumStageDuration(0);
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("Duration unchanged");
    vm.prank(accOwner);
    governance.setReferendumStageDuration(5 * 60);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setReferendumStageDuration(NEW_VALUE);
  }
}

contract GovernanceTest_setExecutionStageDuration is GovernanceTest {
  event ExecutionStageDurationSet(uint256 dequeueFrequency);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setExecutionStageDuration(NEW_VALUE);
    assertEq(governance.getExecutionStageDuration(), NEW_VALUE);
  }

  function test_emitTheExecutionStageDurationSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ExecutionStageDurationSet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setExecutionStageDuration(NEW_VALUE);
  }

  function test_RevertIf_SetToZero() public {
    vm.expectRevert("Duration must be larger than 0");
    vm.prank(accOwner);
    governance.setExecutionStageDuration(0);
  }

  function test_RevertIf_Unchanged() public {
    vm.expectRevert("Duration unchanged");
    vm.prank(accOwner);
    governance.setExecutionStageDuration(EXECUTION_STAGE_DURATION);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setExecutionStageDuration(NEW_VALUE);
  }
}

contract GovernanceTest_setParticipationFloor is GovernanceTest {
  event ParticipationFloorSet(uint256 value);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setParticipationFloor(NEW_VALUE);
    (
      uint256 baseline,
      uint256 baselineFloor,
      uint256 _baselineUpdateFactor,
      uint256 _baselineQuorumFactor
    ) = governance.getParticipationParameters();
    assertEq(baselineFloor, NEW_VALUE);
  }

  function test_emitTheParticipationFloorSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ParticipationFloorSet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setParticipationFloor(NEW_VALUE);
  }

  function test_RevertIf_SetAboveOne() public {
    vm.expectRevert("Participation floor greater than one");
    vm.prank(accOwner);
    governance.setParticipationFloor(FixidityLib.newFixedFraction(11, 10).unwrap());
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setParticipationFloor(NEW_VALUE);
  }
}

contract GovernanceTest_setBaselineUpdateFactor is GovernanceTest {
  event ParticipationBaselineUpdateFactorSet(uint256 value);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setBaselineUpdateFactor(NEW_VALUE);
    (
      uint256 baseline,
      uint256 baselineFloor,
      uint256 _baselineUpdateFactor,
      uint256 _baselineQuorumFactor
    ) = governance.getParticipationParameters();
    assertEq(_baselineUpdateFactor, NEW_VALUE);
  }

  function test_emitTheParticipationBaselineUpdateFactorSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdateFactorSet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setBaselineUpdateFactor(NEW_VALUE);
  }

  function test_RevertIf_SetAboveOne() public {
    vm.expectRevert("Baseline update factor greater than one");
    vm.prank(accOwner);
    governance.setBaselineUpdateFactor(FixidityLib.newFixedFraction(11, 10).unwrap());
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setBaselineUpdateFactor(NEW_VALUE);
  }
}

contract GovernanceTest_setBaselineQuorumFactor is GovernanceTest {
  event ParticipationBaselineQuorumFactorSet(uint256 value);

  uint256 NEW_VALUE = 45;

  function test_SetsValue() public {
    vm.prank(accOwner);
    governance.setBaselineQuorumFactor(NEW_VALUE);
    (
      uint256 baseline,
      uint256 baselineFloor,
      uint256 _baselineUpdateFactor,
      uint256 _baselineQuorumFactor
    ) = governance.getParticipationParameters();
    assertEq(_baselineQuorumFactor, NEW_VALUE);
  }

  function test_emitTheBaselineQuorumFactorSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineQuorumFactorSet(NEW_VALUE);
    vm.prank(accOwner);
    governance.setBaselineQuorumFactor(NEW_VALUE);
  }

  function test_RevertIf_SetAboveOne() public {
    vm.expectRevert("Baseline quorum factor greater than one");
    vm.prank(accOwner);
    governance.setBaselineQuorumFactor(FixidityLib.newFixedFraction(11, 10).unwrap());
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(address(9999));
    governance.setBaselineQuorumFactor(NEW_VALUE);
  }
}

contract GovernanceTest_setConstitution is GovernanceTest {
  event ConstitutionSet(address indexed destination, bytes4 indexed functionId, uint256 threshold);

  function test_RevertIf_DestinationIsZeroAddress() public {
    vm.expectRevert("Destination cannot be zero");
    uint256 threshold = FixidityLib.newFixedFraction(2, 3).unwrap();
    vm.prank(accOwner);
    governance.setConstitution(address(0), 0x00000000, threshold);
  }

  function test_RevertIf_ThresholdIsZero() public {
    vm.expectRevert("Threshold has to be greater than majority and not greater than unanimity");
    uint256 threshold = FixidityLib.newFixed(0).unwrap();
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x00000000, threshold);
  }

  function test_RevertIf_ThresholdIsNotGreaterThanMajority() public {
    uint256 threshold = FixidityLib.newFixedFraction(1, 2).unwrap();
    vm.expectRevert("Threshold has to be greater than majority and not greater than unanimity");
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x00000000, threshold);
  }

  function test_RevertWhen_CalledByNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    uint256 threshold = FixidityLib.newFixedFraction(101, 100).unwrap();
    vm.prank(address(9999));
    governance.setConstitution(address(governance), 0x00000000, threshold);
  }

  function test_RevertIf_ThresholdIsGreaterThan100Percent() public {
    vm.expectRevert("Threshold has to be greater than majority and not greater than unanimity");
    uint256 threshold = FixidityLib.newFixedFraction(101, 100).unwrap();
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x00000000, threshold);
  }

  function test_SetDefaultThreshold_WhenFunctionIdIsZero() public {
    uint256 threshold = FixidityLib.newFixedFraction(2, 3).unwrap();
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x00000000, threshold);
    assertEq(governance.getConstitution(address(governance), 0x12340000), threshold);
  }

  function test_EmitConstitutionSet_WhenFunctionIdIsZero() public {
    uint256 threshold = FixidityLib.newFixedFraction(2, 3).unwrap();
    vm.expectEmit(true, true, true, true);
    emit ConstitutionSet(address(governance), 0x00000000, threshold);
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x00000000, threshold);
  }

  function test_SetThreshold_WhenFunctionIdIsNotZero() public {
    uint256 threshold = FixidityLib.newFixedFraction(2, 3).unwrap();
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x11111111, threshold);
    assertEq(governance.getConstitution(address(governance), 0x11111111), threshold);
  }

  function test_NotSetDefaultThreshold_WhenFunctionIdIsNotZero() public {
    uint256 threshold = FixidityLib.newFixedFraction(2, 3).unwrap();
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x11111111, threshold);
    assertNotEq(governance.getConstitution(address(governance), 0x12340000), threshold);
  }

  function test_EmitConstitutionSet_WhenFunctionIdIsNotZero() public {
    uint256 threshold = FixidityLib.newFixedFraction(2, 3).unwrap();
    vm.expectEmit(true, true, true, true);
    emit ConstitutionSet(address(governance), 0x11111111, threshold);
    vm.prank(accOwner);
    governance.setConstitution(address(governance), 0x11111111, threshold);
  }
}

contract GovernanceTest_propose is GovernanceTest {
  event ProposalQueued(
    uint256 indexed proposalId,
    address indexed proposer,
    uint256 transactionCount,
    uint256 deposit,
    uint256 timestamp
  );

  function test_returnsProposalId() public {
    uint256 id = makeValidProposal();

    assertEq(id, 1);
  }

  function test_incrementsProposalCount() public {
    makeValidProposal();

    assertEq(governance.proposalCount(), 1);
  }

  function test_addProposalToTheQueue() public {
    uint256 id = makeValidProposal();

    assertTrue(governance.isQueued(id));
    (uint256[] memory proposalIds, uint256[] memory upVotes) = governance.getQueue();

    assertEq(proposalIds[0], 1);
    assertEq(upVotes[0], 0);
  }

  function check_registerProposal(Proposal memory proposal) private {
    uint256 id = governance.propose.value(DEPOSIT)(
      proposal.values,
      proposal.destinations,
      proposal.data,
      proposal.dataLengths,
      proposal.description
    );

    (
      address proposer,
      uint256 deposit,
      uint256 timestamp,
      uint256 txCount,
      string memory description,
      uint256 networkWeight,
      bool approved
    ) = governance.getProposal(id);

    assertEq(proposer, address(this));
    assertEq(deposit, DEPOSIT);
    assertEq(timestamp, block.timestamp);
    assertEq(txCount, proposal.values.length);
    assertEq(description, proposal.description);
    assertEq(networkWeight, 0);
    assertEq(approved, false);
  }

  function check_registerProposalTransactions(Proposal memory proposal) private {
    uint256 id = governance.propose.value(DEPOSIT)(
      proposal.values,
      proposal.destinations,
      proposal.data,
      proposal.dataLengths,
      proposal.description
    );

    uint256 dataPosition = 0;
    for (uint256 i = 0; i < proposal.values.length; i++) {
      (uint256 value, address destination, bytes memory data) = governance.getProposalTransaction(
        id,
        i
      );
      assertEq(proposal.values[i], value);
      assertEq(proposal.destinations[i], destination);
      bytes memory expectedData = proposal.data.slice(dataPosition, proposal.dataLengths[i]);
      assertEq(data, expectedData);
      dataPosition = dataPosition + proposal.dataLengths[i];
    }
  }

  function check_emitsProposalQueuedEvents(Proposal memory proposal) private {
    vm.expectEmit(true, true, true, true);
    emit ProposalQueued(1, address(this), proposal.values.length, DEPOSIT, block.timestamp);
    governance.propose.value(DEPOSIT)(
      proposal.values,
      proposal.destinations,
      proposal.data,
      proposal.dataLengths,
      proposal.description
    );
  }

  function test_registerTheProposal_whenProposalHasZeroTransactions() public {
    Proposal memory zeroProp;
    zeroProp.description = "zero tx proposal";
    check_registerProposal(zeroProp);
  }

  function test_emitProposalQueued_whenProposalHasZeroTransactions() public {
    Proposal memory zeroProp;
    zeroProp.description = "zero tx proposal";
    check_emitsProposalQueuedEvents(zeroProp);
  }

  function test_registerTheProposal_whenProposalWithOneTransaction() public {
    check_registerProposal(okProp);
  }

  function test_registerTheProposalTransactions_whenProposalWithOneTransaction() public {
    check_registerProposalTransactions(okProp);
  }

  function test_emitProposalQueued_whenProposalWithOneTransaction() public {
    check_emitsProposalQueuedEvents(okProp);
  }

  function test_RevertIf_descriptionIsEmtpy_whenProposalWithOneTransaction() public {
    vm.expectRevert("Description url must have non-zero length");
    governance.propose.value(DEPOSIT)(
      okProp.values,
      okProp.destinations,
      okProp.data,
      okProp.dataLengths,
      ""
    );
  }

  function test_registerTheProposal_whenProposalWithTwoTransaction() public {
    check_registerProposal(twoTxProp);
  }

  function test_registerTheProposalTransactions_whenProposalWithTwoTransaction() public {
    check_registerProposalTransactions(twoTxProp);
  }

  function test_emitProposalQueued_whenProposalWithTwoTransaction() public {
    check_emitsProposalQueuedEvents(twoTxProp);
  }

  function test_dequeuesOldProposal_whenItHasBeenMoreThanDequeueFrequencySinceLastDequeue() public {
    uint256 originalLastDequeue = governance.lastDequeue();
    uint256 firstId = makeValidProposal();

    // wait "dequeueFrequency"
    vm.warp(block.timestamp + DEQUEUE_FREQUENCY);

    governance.propose.value(DEPOSIT)(
      okProp.values,
      okProp.destinations,
      okProp.data,
      okProp.dataLengths,
      okProp.description
    );

    assertFalse(governance.isQueued(firstId));
    assertEq(governance.getQueueLength(), 1);
    assertEq(governance.dequeued(0), firstId);
    assertGt(governance.lastDequeue(), originalLastDequeue);
  }

  function test_NotUpdateLastDequeueWhenNoQueuedProposal() public {
    uint256 originalLastDequeue = governance.lastDequeue();

    vm.warp(block.timestamp + DEQUEUE_FREQUENCY);

    makeValidProposal();

    assertEq(governance.getQueueLength(), 1);
    assertEq(governance.lastDequeue(), originalLastDequeue);
  }
}

contract GovernanceTest_upvote is GovernanceTest {
  event ProposalUpvoted(uint256 indexed proposalId, address indexed account, uint256 upvotes);
  event ProposalExpired(uint256 indexed proposalId);

  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
  }

  function test_increaseNumberOfUpvotes() public {
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    assertEq(governance.getUpvotes(proposalId), VOTER_GOLD);
  }

  function test_markAccountAsHavingUpvotedProposal() public {
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    (uint256 recordId, uint256 recordWeight) = governance.getUpvoteRecord(accVoter);
    assertEq(recordId, proposalId);
    assertEq(recordWeight, VOTER_GOLD);
  }

  function test_returnsTrue() public {
    vm.prank(accVoter);
    assertTrue(governance.upvote(proposalId, 0, 0));
  }

  function test_Emits_ProposalUpvotedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalUpvoted(proposalId, accVoter, VOTER_GOLD);

    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
  }

  function test_RevertIf_UpvotingNotQueuedProposal() public {
    vm.expectRevert("cannot upvote a proposal not in the queue");
    vm.prank(accVoter);
    governance.upvote(proposalId + 1, 0, 0);
  }

  function test_SortsUpvotedProposalToFrontOfQueue_WhenItWasAtTheEnd() public {
    // make another proposal, thus leave first "at the end of the queue"
    uint256 newProposalId = makeValidProposal();

    // upvotes first
    vm.prank(accVoter);
    governance.upvote(newProposalId, proposalId, 0);

    (uint256[] memory proposalIds, uint256[] memory upvotes) = governance.getQueue();

    assertEq(proposalIds[0], newProposalId);
    assertEq(upvotes[0], VOTER_GOLD);
  }

  function setUp_whenUpvotedProposalIsExpired() private {
    uint256 queueExpiry = governance.queueExpiry();

    // Prevent dequeues for the sake of this test.
    vm.prank(accOwner);
    governance.setDequeueFrequency(queueExpiry * 2);

    // make another proposal (id=2)
    uint256 newProposalId = makeValidProposal();

    address accOtherVoter = actor("otherVoter");
    vm.startPrank(accOtherVoter);
    accounts.createAccount();
    mockLockedGold.setAccountTotalLockedGold(accOtherVoter, VOTER_GOLD);
    mockLockedGold.setAccountTotalGovernancePower(accOtherVoter, VOTER_GOLD);
    governance.upvote(newProposalId, proposalId, 0);
    vm.stopPrank();

    vm.warp(block.timestamp + queueExpiry);
  }

  function test_returnsFalse_whenUpvotedProposalIsExpired() public {
    setUp_whenUpvotedProposalIsExpired();
    vm.prank(accVoter);
    assertFalse(governance.upvote(proposalId, 2, 0));
  }

  function test_removeFromQueue_whenUpvotedProposalIsExpired() public {
    setUp_whenUpvotedProposalIsExpired();

    vm.prank(accVoter);
    governance.upvote(proposalId, 2, 0);

    (uint256[] memory proposalIds, ) = governance.getQueue();
    // proposalId(1) has been dequeued
    assertEq(proposalIds.length, 1);
    assertNotEq(proposalIds[0], proposalId);
  }

  function test_emitProposalExpired_whenUpvotedProposalIsExpired() public {
    setUp_whenUpvotedProposalIsExpired();

    vm.expectEmit(true, true, true, true);
    emit ProposalExpired(proposalId);

    vm.prank(accVoter);
    governance.upvote(proposalId, 2, 0);
  }

  function test_DequeueQueuedProposals_whenItHasBeenMoreThanDequeueFrequencySinceLastDequeue()
    public
  {
    uint256 originalLastDequeue = governance.lastDequeue();
    uint256 newProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    uint256 queueLength = governance.getQueueLength();
    vm.startPrank(accVoter);
    governance.upvote(newProposalId, 0, 0);
    assertFalse(governance.isQueued(proposalId));
    assertEq(governance.getQueueLength(), queueLength - CONCURRENT_PROPOSALS);

    assertEq(governance.dequeued(0), proposalId);
    assertLt(originalLastDequeue, governance.lastDequeue());
  }

  function test_RevertIf_UpvotingAProposalThatWillBeDequeued_whenItHasBeenMoreThanDequeueFrequencySinceLastDequeue()
    public
  {
    makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.expectRevert("cannot upvote a proposal not in the queue");
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
  }

  function setUp_whenPreviousUpvotedProposalIsInQueueAndExpired()
    private
    returns (uint256 newProposalId)
  {
    uint256 queueExpiry = 60;
    vm.prank(accOwner);
    governance.setQueueExpiry(queueExpiry);

    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);

    vm.warp(block.timestamp + queueExpiry);
    return makeValidProposal();
  }

  function test_increaseNumberOfUpvotesForTheProposal_whenPreviousUpvotedProposalIsInQueueAndExpired()
    public
  {
    uint256 newProposalId = setUp_whenPreviousUpvotedProposalIsInQueueAndExpired();
    vm.prank(accVoter);
    governance.upvote(newProposalId, 0, 0);
    assertEq(governance.getUpvotes(newProposalId), VOTER_GOLD);
  }

  function test_markTheAccountAsHavingUpvotedTheProposal_whenPreviousUpvotedProposalIsInQueueAndExpired()
    public
  {
    uint256 newProposalId = setUp_whenPreviousUpvotedProposalIsInQueueAndExpired();
    vm.prank(accVoter);
    governance.upvote(newProposalId, 0, 0);
    (uint256 recordId, uint256 recordWeight) = governance.getUpvoteRecord(accVoter);
    assertEq(recordId, newProposalId);
    assertEq(recordWeight, VOTER_GOLD);
  }

  function test_returnTrue_whenPreviousUpvotedProposalIsInQueueAndExpired() public {
    uint256 newProposalId = setUp_whenPreviousUpvotedProposalIsInQueueAndExpired();
    vm.prank(accVoter);
    assertTrue(governance.upvote(newProposalId, 0, 0));
  }

  function test_emitTheProposalExpiredEvent_whenPreviousUpvotedProposalIsInQueueAndExpired()
    public
  {
    uint256 newProposalId = setUp_whenPreviousUpvotedProposalIsInQueueAndExpired();

    vm.expectEmit(true, true, true, true);
    emit ProposalExpired(proposalId);

    vm.prank(accVoter);
    governance.upvote(newProposalId, 0, 0);
  }

  function test_emitTheProposalUpvotedEvent_whenPreviousUpvotedProposalIsInQueueAndExpired()
    public
  {
    uint256 newProposalId = setUp_whenPreviousUpvotedProposalIsInQueueAndExpired();

    vm.expectEmit(true, true, true, true);
    emit ProposalUpvoted(newProposalId, accVoter, VOTER_GOLD);

    vm.prank(accVoter);
    governance.upvote(newProposalId, 0, 0);
  }
}

contract GovernanceTest_revokeUpvote is GovernanceTest {
  event ProposalExpired(uint256 indexed proposalId);
  event ProposalUpvoteRevoked(
    uint256 indexed proposalId,
    address indexed account,
    uint256 revokedUpvotes
  );

  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
    vm.startPrank(accVoter);
    governance.upvote(proposalId, 0, 0);
  }

  function test_returnTrue() public {
    assertTrue(governance.revokeUpvote(0, 0));
  }

  function test_decreaseUpvotesNumber() public {
    governance.revokeUpvote(0, 0);
    assertEq(governance.getUpvotes(proposalId), 0);
  }

  function test_markAccountAsNotHavingUpvoted() public {
    governance.revokeUpvote(0, 0);
    (uint256 recordId, uint256 recordWeight) = governance.getUpvoteRecord(accVoter);
    assertEq(recordId, 0);
    assertEq(recordWeight, 0);
  }

  function test_emitProposalUpvoteRevokedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalUpvoteRevoked(proposalId, accVoter, VOTER_GOLD);

    governance.revokeUpvote(0, 0);
  }

  function test_RevertIf_accountHasntUpvoted() public {
    governance.revokeUpvote(0, 0);
    vm.expectRevert("Account has no historical upvote");
    governance.revokeUpvote(0, 0);
  }

  function test_removeProposalFromQueue_whenProposalExpired() public {
    vm.warp(block.timestamp + governance.queueExpiry());
    governance.revokeUpvote(0, 0);
    assertFalse(governance.isQueued(proposalId));
    (uint256[] memory proposalIds, uint256[] memory upvotes) = governance.getQueue();
    assertEq(proposalIds.length, 0);
    assertEq(upvotes.length, 0);
  }

  function test_markAccountAsNotHavingUpvoted_whenProposalExpired() public {
    vm.warp(block.timestamp + governance.queueExpiry());
    governance.revokeUpvote(0, 0);
    (uint256 recordId, uint256 recordWeight) = governance.getUpvoteRecord(accVoter);
    assertEq(recordId, 0);
    assertEq(recordWeight, 0);
  }

  function test_emitProposalExpiredEvent_whenProposalExpired() public {
    vm.warp(block.timestamp + governance.queueExpiry());
    vm.expectEmit(true, true, true, true);
    emit ProposalExpired(proposalId);
    governance.revokeUpvote(0, 0);
  }

  function test_dequeueProposal_whenMoreThanDequeueFrequencySinceLastDequeue() public {
    uint256 originalLastDequeue = governance.lastDequeue();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.revokeUpvote(0, 0);
    assertFalse(governance.isQueued(proposalId));
    assertEq(governance.getQueueLength(), 0);
    assertEq(governance.dequeued(0), proposalId);
    assertLt(originalLastDequeue, governance.lastDequeue());
  }

  function test_markAccountAsNotHavingUpvoted_whenMoreThanDequeueFrequencySinceLastDequeue()
    public
  {
    uint256 originalLastDequeue = governance.lastDequeue();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.revokeUpvote(0, 0);
    (uint256 recordId, uint256 recordWeight) = governance.getUpvoteRecord(accVoter);
    assertEq(recordId, 0);
    assertEq(recordWeight, 0);
  }
}

contract GovernanceTest_withdraw is GovernanceTest {
  uint256 proposalId;

  address accProposer;

  function setUp() public {
    super.setUp();
    accProposer = actor("proposer");
    vm.deal(accProposer, DEPOSIT * 2);

    vm.prank(accProposer);
    proposalId = makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_returnTrue_whenCallerIsProposer() public {
    vm.prank(accProposer);
    assertTrue(governance.withdraw());
  }

  function test_withdrawRefundedDepositWhenProposalWasDequeued_whenCallerIsProposer() public {
    uint256 startBalance = accProposer.balance;

    vm.prank(accProposer);
    governance.withdraw();
    assertEq(accProposer.balance, startBalance + DEPOSIT);
  }

  function test_RevertIf_CallerNotOriginalProposer() public {
    vm.expectRevert("Nothing to withdraw");
    vm.prank(actor("somebody"));
    governance.withdraw();
  }
}

contract GovernanceTest_approve is GovernanceTest {
  event ProposalDequeued(uint256 indexed proposalId, uint256 timestamp);
  event ProposalApproved(uint256 indexed proposalId);

  uint256 INDEX = 0; // first proposal index
  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
  }

  function test_returnTrue() public {
    vm.prank(accApprover);
    assertTrue(governance.approve(proposalId, INDEX));
  }

  function test_UpdateProposalDetails() public {
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);

    (
      address proposer,
      uint256 deposit,
      ,
      uint256 txCount,
      string memory description,
      uint256 networkWeight,
      bool approved
    ) = governance.getProposal(proposalId);

    assertEq(proposer, address(this));
    assertEq(deposit, DEPOSIT);
    assertEq(txCount, 1);
    assertEq(description, "1 tx proposal");
    assertEq(networkWeight, VOTER_GOLD);
    assertEq(approved, true);
  }

  function test_MarkProposalAsApproved() public {
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
    assertTrue(governance.isApproved(proposalId));
  }

  function test_emitProposalDequeuedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalDequeued(proposalId, block.timestamp);
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
  }

  function test_emitProposalApprovedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalApproved(proposalId);
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
  }

  function test_RevertIf_IndexOutOfBounds() public {
    vm.expectRevert("Provided index greater than dequeue length.");
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX + 1);
  }

  function test_RevertIf_ProposalIdDontMatchIndex() public {
    uint256 newProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.expectRevert("Proposal not dequeued");
    vm.prank(accApprover);
    governance.approve(newProposalId, INDEX);
  }

  function test_RevertIf_NotCalledByApprover() public {
    vm.expectRevert("msg.sender not approver");
    vm.prank(actor("somebody"));
    governance.approve(proposalId, INDEX);
  }

  function test_RevertIf_ProposalIsQueued() public {
    uint256 newProposalId = makeValidProposal();
    vm.expectRevert("Proposal not dequeued");
    vm.prank(accApprover);
    governance.approve(newProposalId, INDEX);
  }

  function test_RevertIf_ProposalAlreadyApproved() public {
    vm.startPrank(accApprover);
    governance.approve(proposalId, INDEX);
    vm.expectRevert("Proposal already approved");
    governance.approve(proposalId, INDEX);
  }

  function test_returnsTrue_whenInReferendumStage() public {
    // Dequeue the other proposal.
    makeValidProposal();
    vm.prank(accApprover);
    assertTrue(governance.approve(proposalId, INDEX));
  }

  function test_ShouldNotDeleteProposal_whenInReferendumStage() public {
    // Dequeue the other proposal.
    makeValidProposal();
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
    assertTrue(governance.proposalExists(proposalId));
  }

  function test_NotRemoveProposalIDFromDequeued_whenInReferendumStage() public {
    // Dequeue the other proposal.
    makeValidProposal();
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
    uint256[] memory dequeued = governance.getDequeue();

    assertEq(dequeued.length, 1, "only one is dequeued");
    assertEq(dequeued[0], proposalId);
  }

  function test_emitParticipationBaselineUpdatedEvent_whenInReferendumStage() public {
    // Dequeue the other proposal.
    makeValidProposal();

    vm.expectEmit(true, true, true, true);
    emit ProposalApproved(proposalId);
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
  }

  function test_returnFalse_whenPastReferendumStage() public {
    makeValidProposal();
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION + 1);
    vm.prank(accApprover);
    assertFalse(governance.approve(proposalId, 0));
  }

  function test_deleteProposal_whenPastReferendumStage() public {
    makeValidProposal();
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION + 1);
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_removeProposalIDFromDequeued_whenPastReferendumStage() public {
    makeValidProposal();
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION + 1);
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);

    uint256[] memory dequeued = governance.getDequeue();
    assertEq(dequeued.length, 1);
    assertNotEq(dequeued[0], proposalId);
  }

  function test_addIndexToEmptyIndices_whenPastReferendumStage() public {
    makeValidProposal();
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION + 1);
    vm.prank(accApprover);
    governance.approve(proposalId, INDEX);
    assertEq(governance.emptyIndices(0), INDEX);
  }

  // TODO Fix when migrate to 0.8
  function SKIPtest_NoEmitParticipationBaselineUpdatedEvent_whenPastReferendumStage() public {
    makeValidProposal();
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION + 1);
    vm.recordLogs();
    vm.prank(accApprover);
    // Vm.Log[] memory entries = vm.getRecordedLogs();
    // assertEq(entries.length, 0);
  }
}

contract GovernanceTest_revokeVotes is GovernanceTest {
  event ProposalVoteRevokedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );

  uint256 numVoted;

  function setUp() public {
    super.setUp();
    vm.prank(accOwner);
    governance.setConcurrentProposals(3);

    makeValidProposal();
    makeValidProposal();
    makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.startPrank(accApprover);
    governance.approve(1, 0);
    governance.approve(2, 1);
    governance.approve(3, 2);
    vm.stopPrank();

    vm.startPrank(accVoter);
  }

  modifier voteForEachNumVoted() {
    for (uint256 _numVoted = 0; _numVoted < 3; _numVoted++) {
      uint256 snapshot = vm.snapshot();
      numVoted = _numVoted;

      for (uint256 i = 0; i < numVoted; i++) {
        governance.vote(i + 1, i, Proposals.VoteValue.Yes);
      }

      _;
      vm.revertTo(snapshot);
    }
  }

  modifier votePartiallyForEachNumVoted() {
    for (uint256 _numVoted = 0; _numVoted < 3; _numVoted++) {
      uint256 snapshot = vm.snapshot();
      numVoted = _numVoted;

      for (uint256 i = 0; i < numVoted; i++) {
        governance.votePartially(i + 1, i, 10, 30, 0);
      }

      _;
      vm.revertTo(snapshot);
    }
  }

  function test_unsetMostRecentReferendumProposalVotedOn_whenAccountHasVotedOnXProposal()
    public
    voteForEachNumVoted
  {
    governance.revokeVotes();
    assertEq(governance.getMostRecentReferendumProposal(accVoter), 0);
  }

  function test_isVotingReturnsFalse_whenAccountHasVotedOnXProposal() public voteForEachNumVoted {
    governance.revokeVotes();
    assertFalse(governance.isVoting(accVoter));
  }

  function test_Emits_ProposalVoteRevokedV2EventXtimes_whenAccountHasVotedOnXProposal()
    public
    voteForEachNumVoted
  {
    for (uint256 i = 0; i < numVoted; i++) {
      vm.expectEmit(true, true, true, true);
      emit ProposalVoteRevokedV2(i + 1, accVoter, VOTER_GOLD, 0, 0);
    }
    governance.revokeVotes();
  }

  function test_notRevertWhenProposalsAreNotInTheReferendumStage_whenAccountHasVotedOnXProposal()
    public
    voteForEachNumVoted
  {
    vm.warp(governance.getReferendumStageDuration());
    assertTrue(governance.revokeVotes());
  }

  function test_unsetMostRecentReferendumProposalVotedOn_whenAccountHasVotedPartiallyOnXProposal()
    public
    votePartiallyForEachNumVoted
  {
    governance.revokeVotes();
    assertEq(governance.getMostRecentReferendumProposal(accVoter), 0);
  }

  function test_isVotingReturnsFalse_whenAccountHasVotedPartiallyOnXProposal()
    public
    votePartiallyForEachNumVoted
  {
    governance.revokeVotes();
    assertFalse(governance.isVoting(accVoter));
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), 0);
  }

  function test_Emits_ProposalVoteRevokedV2EventXtimes_whenAccountHasVotedPartiallyOnXProposal()
    public
    votePartiallyForEachNumVoted
  {
    for (uint256 i = 0; i < numVoted; i++) {
      vm.expectEmit(true, true, true, true);
      emit ProposalVoteRevokedV2(i + 1, accVoter, 10, 30, 0);
    }
    governance.revokeVotes();
  }

  function test_notRevertWhenProposalsAreNotInTheReferendumStage_whenAccountHasVotedPartiallyOnXProposal()
    public
    votePartiallyForEachNumVoted
  {
    vm.warp(governance.getReferendumStageDuration());
    assertTrue(governance.revokeVotes());
  }
}

contract GovernanceTest_vote_WhenProposalIsApproved is GovernanceTest {
  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );

  event ParticipationBaselineUpdated(uint256 participationBaseline);

  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_returnTrue() public {
    vm.prank(accVoter);
    assertTrue(governance.vote(proposalId, 0, Proposals.VoteValue.Yes));
  }

  function test_incrementVoteTotals() public {
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, VOTER_GOLD);
  }

  function test_SetVotersVoteRecord() public {
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (
      uint256 recordProposalId,
      ,
      ,
      uint256 yesVotesRecord,
      uint256 noVotesRecord,
      uint256 abstainVotesRecord
    ) = governance.getVoteRecord(accVoter, 0);
    assertEq(recordProposalId, proposalId);
    assertEq(yesVotesRecord, VOTER_GOLD);
    assertEq(noVotesRecord, 0);
    assertEq(abstainVotesRecord, 0);
  }

  function test_SetMostRecentReferendumProposalVotedOn() public {
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), proposalId);
  }

  function test_emitProposalVotedV2Event() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalVotedV2(proposalId, accVoter, VOTER_GOLD, 0, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_AccountWeightIs0() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 0);
    vm.expectRevert("Voter weight zero");
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_IndexIsOutOfBounds() public {
    vm.expectRevert("Provided index greater than dequeue length.");
    vm.prank(accVoter);
    governance.vote(proposalId, 1, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_ProposalIdDoesNotMatchTheIndex() public {
    uint256 otherProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.expectRevert("Proposal not dequeued");
    vm.prank(accVoter);
    governance.vote(otherProposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_setMostRecentReferendumProposalToTheYoungestProposalVotedOn_WhenVotingOnTwoProposals()
    public
  {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.vote(sndProposal, 1, Proposals.VoteValue.Yes);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), sndProposal);
  }

  function test_IsVotingReturnsTrue_WhenVotingOnTwoProposals() public {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.vote(sndProposal, 1, Proposals.VoteValue.Yes);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertTrue(governance.isVoting(accVoter));
  }

  function test_IsVotingReturnsTrue_WhenVotingOnTwoProposalsAfterFirstProposalExpires() public {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.vote(sndProposal, 1, Proposals.VoteValue.Yes);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + governance.getReferendumStageDuration() - 10);
    assertTrue(governance.isVoting(accVoter));
  }

  function test_IsVotingReturnsFalse_WhenVotingOnTwoProposalsAfterBothProposalExpires() public {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.vote(sndProposal, 1, Proposals.VoteValue.Yes);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + governance.getReferendumStageDuration() + 1);
    assertFalse(governance.isVoting(accVoter));
  }

  function test_ModifyVoteTotals_WhenChangingVoteFromYesToNo() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(yes, 0);
    assertEq(no, VOTER_GOLD);
  }

  function test_UpdateVotersVoteRecord_WhenChangingVoteFromYesToNo() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    (uint256 id, uint256 _1, uint256 _2, uint256 yes, uint256 no, uint256 abstain) = governance
      .getVoteRecord(accVoter, 0);
    assertEq(id, proposalId);
    assertEq(yes, 0);
    assertEq(no, VOTER_GOLD);
  }

  function test_ModifyVoteTotals_WhenChangingVoteFromNoToAbstain() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    governance.vote(proposalId, 0, Proposals.VoteValue.Abstain);
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(no, 0);
    assertEq(abstain, VOTER_GOLD);
  }

  function test_UpdateVotersVoteRecord_WhenChangingVoteFromNoToAbstain() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    governance.vote(proposalId, 0, Proposals.VoteValue.Abstain);
    (uint256 id, uint256 _1, uint256 _2, uint256 yes, uint256 no, uint256 abstain) = governance
      .getVoteRecord(accVoter, 0);
    assertEq(id, proposalId);
    assertEq(no, 0);
    assertEq(abstain, VOTER_GOLD);
  }

  function test_ModifyVoteTotals_WhenChangingVoteFromAbstainToYes() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Abstain);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(abstain, 0);
    assertEq(yes, VOTER_GOLD);
  }

  function test_UpdateVotersVoteRecord_WhenChangingVoteFromAbstainToYes() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Abstain);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (uint256 id, uint256 _1, uint256 _2, uint256 yes, uint256 no, uint256 abstain) = governance
      .getVoteRecord(accVoter, 0);
    assertEq(id, proposalId);
    assertEq(abstain, 0);
    assertEq(yes, VOTER_GOLD);
  }

  function test_RevertIf_IsPastReferendumStageAndPassing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    vm.expectRevert("Incorrect proposal state");
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_returnFalse_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    assertFalse(governance.vote(proposalId, 0, Proposals.VoteValue.Yes));
  }

  function test_deleteProposal_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_removeProposalFromDequeued_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    uint256[] memory dequeued = governance.getDequeue();
    assertEq(dequeued.length, 1);
    assertNotEq(dequeued[0], proposalId);
  }

  function test_AddsIndexToEmptyIndices_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertEq(governance.emptyIndices(0), 0);
  }

  function test_UpdateTheParticipationBaseline_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitParticipationBaselineUpdatedEvent_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());

    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }
}

contract GovernanceTest_vote_WhenProposalIsApprovedAndHaveSigner is GovernanceTest {
  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );

  address accSigner;
  uint256 proposalId;

  function setUp() public {
    super.setUp();
    bytes32 voteSignerRole = keccak256(abi.encodePacked("celo.org/core/vote"));

    (address signer, uint256 signerPk) = actorWithPK("voterSigner");
    authorizeVoteSigner(signerPk, accVoter);
    vm.prank(signer);
    accounts.completeSignerAuthorization(accVoter, voteSignerRole);
    accSigner = signer;

    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_returnTrue() public {
    vm.prank(accSigner);
    assertTrue(governance.vote(proposalId, 0, Proposals.VoteValue.Yes));
  }

  function test_incrementVoteTotals() public {
    vm.prank(accSigner);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, VOTER_GOLD);
  }

  function test_SetVotersVoteRecord() public {
    vm.prank(accSigner);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (
      uint256 recordProposalId,
      ,
      ,
      uint256 yesVotesRecord,
      uint256 noVotesRecord,
      uint256 abstainVotesRecord
    ) = governance.getVoteRecord(accVoter, 0);
    assertEq(recordProposalId, proposalId);
    assertEq(yesVotesRecord, VOTER_GOLD);
    assertEq(noVotesRecord, 0);
    assertEq(abstainVotesRecord, 0);
  }

  function test_SetMostRecentReferendumProposalVotedOn() public {
    vm.prank(accSigner);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), proposalId);
  }

  function test_emitProposalVotedV2Event() public {
    governance.dequeueProposalsIfReady();
    vm.expectEmit(true, true, true, true);
    emit ProposalVotedV2(proposalId, accVoter, VOTER_GOLD, 0, 0);
    vm.prank(accSigner);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_AccountWeightIs0() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 0);
    vm.expectRevert("Voter weight zero");
    vm.prank(accSigner);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }
}

contract GovernanceTest_vote_WhenProposalIsNotApproved is GovernanceTest {
  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );
  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
  }

  function test_returnTrue() public {
    vm.prank(accVoter);
    assertTrue(governance.vote(proposalId, 0, Proposals.VoteValue.Yes));
  }

  function test_incrementVoteTotals() public {
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, VOTER_GOLD);
  }

  function test_SetVotersValueRecord() public {
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    (
      uint256 recordProposalId,
      ,
      ,
      uint256 yesVotesRecord,
      uint256 noVotesRecord,
      uint256 abstainVotesRecord
    ) = governance.getVoteRecord(accVoter, 0);
    assertEq(recordProposalId, proposalId);
    assertEq(yesVotesRecord, VOTER_GOLD);
    assertEq(noVotesRecord, 0);
    assertEq(abstainVotesRecord, 0);
  }

  function test_SetTheMostRecentReferendumProposalVotedOn() public {
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), proposalId);
  }

  function test_emitProposalVotedV2Event() public {
    governance.dequeueProposalsIfReady();
    vm.expectEmit(true, true, true, true);
    emit ProposalVotedV2(proposalId, accVoter, VOTER_GOLD, 0, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_accountWeightIs0() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 0);
    vm.expectRevert("Voter weight zero");
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_IndexIsOutOfBounds() public {
    vm.expectRevert("Provided index greater than dequeue length.");
    vm.prank(accVoter);
    governance.vote(proposalId, 1, Proposals.VoteValue.Yes);
  }

  function test_RevertIf_proposalIdDoesNotMatchTheIndex() public {
    uint256 otherProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.expectRevert("Proposal not dequeued");
    vm.prank(accVoter);
    governance.vote(otherProposalId, 0, Proposals.VoteValue.Yes);
  }
}

contract GovernanceTest_vote_WhenVotingOnDifferentProposalWithSameIndex is GovernanceTest {
  function test_IgnoreVotesFromPreviousProposal() public {
    uint256 proposalId1 = makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId1, 0);

    vm.prank(accVoter);
    governance.vote(proposalId1, 0, Proposals.VoteValue.Yes);

    vm.warp(
      block.timestamp +
        governance.getReferendumStageDuration() +
        governance.getExecutionStageDuration()
    );
    assertEq(governance.dequeued(0), proposalId1);

    uint256 proposalId2 = makeValidProposal();

    governance.execute(proposalId1, 0);
    assertFalse(governance.proposalExists(proposalId1));

    vm.warp(block.timestamp + governance.dequeueFrequency() + 1);
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId2, 0);
    assertTrue(governance.proposalExists(proposalId2));

    assertEq(governance.dequeued(0), proposalId2);

    address sndVoter = actor("sndVoter");
    uint256 sndVoterWeight = 100;
    vm.prank(sndVoter);
    accounts.createAccount();
    mockLockedGold.setAccountTotalGovernancePower(sndVoter, sndVoterWeight);

    vm.prank(sndVoter);
    governance.vote(proposalId2, 0, Proposals.VoteValue.Yes);
    vm.prank(accVoter);
    governance.vote(proposalId2, 0, Proposals.VoteValue.No);

    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId2);

    assertEq(yes, sndVoterWeight);
    assertEq(no, VOTER_GOLD);
    assertEq(abstain, 0);
  }
}

contract GovernanceTest_vote_PartiallyWhenProposalIsApproved is GovernanceTest {
  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );

  event ParticipationBaselineUpdated(uint256 participationBaseline);

  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_returnTrue() public {
    vm.prank(accVoter);
    assertTrue(governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0));
  }

  function test_incrementVoteTotals() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, VOTER_GOLD);
  }

  function test_incrementVoteTotalsWhenVotingPartially() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, 10, 50, 30);
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(yes, 10);
    assertEq(no, 50);
    assertEq(abstain, 30);
  }

  function test_SetTheVotersVoteRecord() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    (
      uint256 recordProposalId,
      ,
      ,
      uint256 yesVotesRecord,
      uint256 noVotesRecord,
      uint256 abstainVotesRecord
    ) = governance.getVoteRecord(accVoter, 0);
    assertEq(recordProposalId, proposalId);
    assertEq(yesVotesRecord, VOTER_GOLD);
    assertEq(noVotesRecord, 0);
    assertEq(abstainVotesRecord, 0);
  }

  function test_SetMostRecentReferendumProposalVotedOn() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), proposalId);
  }

  function test_emitProposalVotedV2Event() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalVotedV2(proposalId, accVoter, VOTER_GOLD, 0, 0);
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_AccountWeightIsZero() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 0);
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_AccountDoesNotHaveEnoughGold() public {
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD + 1, 0, 0);
  }

  function test_RevertIf_AccountDoesNotHaveEnoughGoldWhenVotingPartially() public {
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, VOTER_GOLD, 0);
  }

  function test_RevertIf_IndexIsOutOfBounds() public {
    vm.expectRevert("Provided index greater than dequeue length.");
    vm.prank(accVoter);
    governance.votePartially(proposalId, 1, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_ProposalIdDoesNotMatchTheIndex() public {
    uint256 otherProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.expectRevert("Proposal not dequeued");
    vm.prank(accVoter);
    governance.votePartially(otherProposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_setMostRecentReferendumProposalToTheYoungestProposalVotedOn_WhenVotingOnTwoProposals()
    public
  {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.votePartially(sndProposal, 1, VOTER_GOLD, 0, 0);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), sndProposal);
  }

  function test_IsVotingReturnsTrue_WhenVotingOnTwoProposals() public {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.votePartially(sndProposal, 1, VOTER_GOLD, 0, 0);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertTrue(governance.isVoting(accVoter));
  }

  function test_IsVotingReturnsTrue_WhenVotingOnTwoProposalsAfterFirstProposalExpires() public {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.votePartially(sndProposal, 1, VOTER_GOLD, 0, 0);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    vm.warp(block.timestamp + governance.getReferendumStageDuration() - 10);
    assertTrue(governance.isVoting(accVoter));
  }

  function test_IsVotingReturnsFalse_WhenVotingOnTwoProposalsAfterBothProposalExpires() public {
    uint256 sndProposal = makeAndApproveProposal(1);
    vm.startPrank(accVoter);
    governance.votePartially(sndProposal, 1, VOTER_GOLD, 0, 0);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    vm.warp(block.timestamp + governance.getReferendumStageDuration() + 1);
    assertFalse(governance.isVoting(accVoter));
  }

  function test_ModifyVoteTotals_WhenChangingPartialVotes() public {
    vm.startPrank(accVoter);
    governance.votePartially(proposalId, 0, 10, 50, 30);
    governance.votePartially(proposalId, 0, 30, 20, 40);
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(yes, 30);
    assertEq(no, 20);
    assertEq(abstain, 40);
  }

  function test_UpdateVotersVoteRecord_WhenChangingPartialVotes() public {
    vm.startPrank(accVoter);
    governance.votePartially(proposalId, 0, 10, 50, 30);
    governance.votePartially(proposalId, 0, 30, 20, 40);
    (uint256 id, uint256 _1, uint256 _2, uint256 yes, uint256 no, uint256 abstain) = governance
      .getVoteRecord(accVoter, 0);
    assertEq(id, proposalId);
    assertEq(yes, 30);
    assertEq(no, 20);
    assertEq(abstain, 40);
  }

  function test_RevertIf_IsPastReferendumStageAndPassing() public {
    vm.startPrank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    vm.expectRevert("Incorrect proposal state");
    governance.votePartially(proposalId, 0, 10, 50, 30);
  }

  function test_returnFalse_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    assertFalse(governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0));
  }

  function test_deleteProposal_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_removeProposalFromDequeued_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);

    uint256[] memory dequeued = governance.getDequeue();
    assertEq(dequeued.length, 1);
    assertNotEq(dequeued[0], proposalId);
  }

  function test_AddsIndexToEmptyIndices_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertEq(governance.emptyIndices(0), 0);
  }

  function test_UpdateTheParticipationBaseline_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);

    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitParticipationBaselineUpdatedEvent_WhenIsPastReferendumStageAndFailing() public {
    vm.startPrank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);
    vm.warp(block.timestamp + governance.getReferendumStageDuration());

    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }
}

contract GovernanceTest_votePartially_WhenProposalIsApprovedAndHaveSigner is GovernanceTest {
  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );

  address accSigner;
  uint256 proposalId;

  function setUp() public {
    super.setUp();
    bytes32 voteSignerRole = keccak256(abi.encodePacked("celo.org/core/vote"));

    (address signer, uint256 signerPk) = actorWithPK("voterSigner");
    authorizeVoteSigner(signerPk, accVoter);
    vm.prank(signer);
    accounts.completeSignerAuthorization(accVoter, voteSignerRole);
    accSigner = signer;

    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_returnTrue() public {
    vm.prank(accSigner);
    assertTrue(governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0));
  }

  function test_incrementVoteTotals() public {
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, VOTER_GOLD);
  }

  function test_incrementVoteTotalsWhenVotingPartially() public {
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, 10, 50, 30);
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);
    assertEq(yes, 10);
    assertEq(no, 50);
    assertEq(abstain, 30);
  }

  function test_SetTheVotersVoteRecord() public {
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    (
      uint256 recordProposalId,
      ,
      ,
      uint256 yesVotesRecord,
      uint256 noVotesRecord,
      uint256 abstainVotesRecord
    ) = governance.getVoteRecord(accVoter, 0);
    assertEq(recordProposalId, proposalId);
    assertEq(yesVotesRecord, VOTER_GOLD);
    assertEq(noVotesRecord, 0);
    assertEq(abstainVotesRecord, 0);
  }

  function test_SetMostRecentReferendumProposalVotedOn() public {
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), proposalId);
  }

  function test_emitProposalVotedV2Event() public {
    vm.expectEmit(true, true, true, true);
    emit ProposalVotedV2(proposalId, accVoter, VOTER_GOLD, 0, 0);
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_AccountWeightIs0() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 0);
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_AccountDoesNotHaveEnoughGold() public {
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD + 1, 0, 0);
  }

  function test_RevertIf_AccountDoesNotHaveEnoughGoldWhenVotingPartially() public {
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accSigner);
    governance.votePartially(proposalId, 0, VOTER_GOLD, VOTER_GOLD, 0);
  }

  function test_RevertIf_IndexIsOutOfBounds() public {
    vm.expectRevert("Provided index greater than dequeue length.");
    vm.prank(accSigner);
    governance.votePartially(proposalId, 1, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_ProposalIdDoesNotMatchTheIndex() public {
    uint256 otherProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.expectRevert("Proposal not dequeued");
    vm.prank(accSigner);
    governance.votePartially(otherProposalId, 0, VOTER_GOLD, 0, 0);
  }
}

contract GovernanceTest_votePartially_WhenProposalIsNotApproved is GovernanceTest {
  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );
  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
  }

  function test_returnTrue() public {
    vm.prank(accVoter);
    assertTrue(governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0));
  }

  function test_incrementVoteTotals() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    (uint256 yes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yes, VOTER_GOLD);
  }

  function test_SetVotersValueRecord() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    (
      uint256 recordProposalId,
      ,
      ,
      uint256 yesVotesRecord,
      uint256 noVotesRecord,
      uint256 abstainVotesRecord
    ) = governance.getVoteRecord(accVoter, 0);
    assertEq(recordProposalId, proposalId);
    assertEq(yesVotesRecord, VOTER_GOLD);
    assertEq(noVotesRecord, 0);
    assertEq(abstainVotesRecord, 0);
  }

  function test_SetTheMostRecentReferendumProposalVotedOn() public {
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
    assertEq(governance.getMostRecentReferendumProposal(accVoter), proposalId);
  }

  function test_emitProposalVotedV2Event() public {
    governance.dequeueProposalsIfReady();
    vm.expectEmit(true, true, true, true);
    emit ProposalVotedV2(proposalId, accVoter, VOTER_GOLD, 0, 0);
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_AccountWeightIsZero() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 0);
    vm.expectRevert("Voter doesn't have enough locked Celo (formerly known as Celo Gold)");
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_IndexIsOutOfBounds() public {
    vm.expectRevert("Provided index greater than dequeue length.");
    vm.prank(accVoter);
    governance.votePartially(proposalId, 1, VOTER_GOLD, 0, 0);
  }

  function test_RevertIf_proposalIdDoesNotMatchTheIndex() public {
    uint256 otherProposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.expectRevert("Proposal not dequeued");
    vm.prank(accVoter);
    governance.votePartially(otherProposalId, 0, VOTER_GOLD, 0, 0);
  }
}

contract GovernanceTest_votePartially_WhenVotingOnDifferentProposalWithSameIndex is GovernanceTest {
  function test_IgnoreVotesFromPreviousProposal() public {
    uint256 proposalId1 = makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId1, 0);

    vm.prank(accVoter);
    governance.votePartially(proposalId1, 0, VOTER_GOLD, 0, 0);

    vm.warp(
      block.timestamp +
        governance.getReferendumStageDuration() +
        governance.getExecutionStageDuration()
    );
    assertEq(governance.dequeued(0), proposalId1);

    uint256 proposalId2 = makeValidProposal();

    governance.execute(proposalId1, 0);
    assertFalse(governance.proposalExists(proposalId1));

    vm.warp(block.timestamp + governance.dequeueFrequency() + 1);
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId2, 0);
    assertTrue(governance.proposalExists(proposalId2));

    assertEq(governance.dequeued(0), proposalId2);

    address sndVoter = actor("sndVoter");
    uint256 sndVoterWeight = 100;
    vm.prank(sndVoter);
    accounts.createAccount();
    mockLockedGold.setAccountTotalGovernancePower(sndVoter, sndVoterWeight);

    vm.prank(sndVoter);
    governance.votePartially(proposalId2, 0, sndVoterWeight, 0, 0);
    vm.prank(accVoter);
    governance.votePartially(proposalId2, 0, 0, VOTER_GOLD, 0);

    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId2);

    assertEq(yes, sndVoterWeight);
    assertEq(no, VOTER_GOLD);
    assertEq(abstain, 0);
  }
}

contract GovernanceTest_execute is GovernanceTest {
  event ParticipationBaselineUpdated(uint256 participationBaseline);
  event ProposalExecuted(uint256 indexed proposalId);

  uint256 proposalId;

  function setupProposalCanExecute() private {
    proposalId = makeAndApproveProposal(0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
  }

  function test_returnTrue_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    assertTrue(governance.execute(proposalId, 0));
  }

  function test_executeProposal_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    governance.execute(proposalId, 0);
    assertEq(testTransactions.getValue(1), 1);
  }

  function test_deleteProposal_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    governance.execute(proposalId, 0);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_updateParticipationBaseline_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    governance.execute(proposalId, 0);
    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitProposalExecutedEvent_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    vm.expectEmit(true, true, true, true);
    emit ProposalExecuted(proposalId);
    governance.execute(proposalId, 0);
  }

  function test_emitParticipationBaselineUpdatedEvent_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.execute(proposalId, 0);
  }

  function test_RevertIf_IndexIsOutOfBounds_WhenProposalCanExecute() public {
    setupProposalCanExecute();
    vm.expectRevert("Provided index greater than dequeue length.");
    governance.execute(proposalId, 1);
  }

  function setupWhenProposalApprovedInExecutionStage() private {
    proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_returnTrue_WhenProposalApprovedInExecutionStage() public {
    setupWhenProposalApprovedInExecutionStage();
    assertTrue(governance.execute(proposalId, 0));
  }

  function test_executeProposal_WhenProposalApprovedInExecutionStage() public {
    setupWhenProposalApprovedInExecutionStage();
    governance.execute(proposalId, 0);
    assertEq(testTransactions.getValue(1), 1);
  }

  function test_deleteProposal_WhenProposalApprovedInExecutionStage() public {
    setupWhenProposalApprovedInExecutionStage();
    governance.execute(proposalId, 0);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_updateParticipationBaseline_WhenProposalApprovedInExecutionStage() public {
    setupWhenProposalApprovedInExecutionStage();
    governance.execute(proposalId, 0);
    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitProposalExecutedEvent_WhenProposalApprovedInExecutionStage() public {
    setupWhenProposalApprovedInExecutionStage();
    vm.expectEmit(true, true, true, true);
    emit ProposalExecuted(proposalId);
    governance.execute(proposalId, 0);
  }

  function test_emitParticipationBaselineUpdatedEvent_WhenProposalApprovedInExecutionStage()
    public
  {
    setupWhenProposalApprovedInExecutionStage();
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.execute(proposalId, 0);
  }

  function test_RevertIf_IndexIsOutOfBounds_WhenProposalApprovedInExecutionStage() public {
    setupWhenProposalApprovedInExecutionStage();
    vm.expectRevert("Provided index greater than dequeue length.");
    governance.execute(proposalId, 1);
  }

  function test_RevertIf_ProposalIsNotApproved() public {
    proposalId = makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);

    vm.expectRevert("Proposal not approved");
    governance.execute(proposalId, 0);
  }

  function test_RevertIf_ProposalCannotExecuteSuccessfully() public {
    proposalId = governance.propose.value(DEPOSIT)(
      failingProp.values,
      failingProp.destinations,
      failingProp.data,
      failingProp.dataLengths,
      failingProp.description
    );

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.prank(accApprover);
    governance.approve(proposalId, 0);

    vm.expectRevert("Proposal execution failed");
    governance.execute(proposalId, 0);
  }

  function test_RevertIf_ProposalCannotExecuteBecauseInvalidContractAddress() public {
    okProp.destinations[0] = actor("someAddress");
    proposalId = governance.propose.value(DEPOSIT)(
      okProp.values,
      okProp.destinations,
      okProp.data,
      okProp.dataLengths,
      okProp.description
    );

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.prank(accApprover);
    governance.approve(proposalId, 0);

    vm.expectRevert("Invalid contract address");
    governance.execute(proposalId, 0);
  }

  function setup2TxProposal() private {
    proposalId = governance.propose.value(DEPOSIT)(
      twoTxProp.values,
      twoTxProp.destinations,
      twoTxProp.data,
      twoTxProp.dataLengths,
      twoTxProp.description
    );
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
  }

  function test_returnTrue_When2TxProposal() public {
    setup2TxProposal();
    assertTrue(governance.execute(proposalId, 0));
  }

  function test_executeProposal_When2TxProposal() public {
    setup2TxProposal();
    governance.execute(proposalId, 0);
    assertEq(testTransactions.getValue(1), 1);
    assertEq(testTransactions.getValue(2), 1);
  }

  function test_deleteProposal_When2TxProposal() public {
    setup2TxProposal();
    governance.execute(proposalId, 0);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_updateParticipationBaseline_When2TxProposal() public {
    setup2TxProposal();
    governance.execute(proposalId, 0);
    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitProposalExecutedEvent_When2TxProposal() public {
    setup2TxProposal();
    vm.expectEmit(true, true, true, true);
    emit ProposalExecuted(proposalId);
    governance.execute(proposalId, 0);
  }

  function test_emitParticipationBaselineUpdatedEvent_When2TxProposal() public {
    setup2TxProposal();
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.execute(proposalId, 0);
  }

  function test_RevertIf_IndexIsOutOfBounds_When2TxProposal() public {
    setup2TxProposal();
    vm.expectRevert("Provided index greater than dequeue length.");
    governance.execute(proposalId, 1);
  }

  function test_RevertIf_2TxProposalButFirstFails() public {
    string memory setValueSignature = "setValue(uint256,uint256,bool)";
    bytes memory txDataFirst = abi.encodeWithSignature(setValueSignature, 1, 1, false); // fails
    bytes memory txDataSecond = abi.encodeWithSignature(setValueSignature, 2, 1, true);
    twoTxProp.data = txDataFirst.concat(txDataSecond);

    proposalId = governance.propose.value(DEPOSIT)(
      twoTxProp.values,
      twoTxProp.destinations,
      twoTxProp.data,
      twoTxProp.dataLengths,
      twoTxProp.description
    );
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);

    vm.expectRevert("Proposal execution failed");
    governance.execute(proposalId, 0);
  }

  function test_RevertIf_2TxProposalButSecondFails() public {
    string memory setValueSignature = "setValue(uint256,uint256,bool)";
    bytes memory txDataFirst = abi.encodeWithSignature(setValueSignature, 1, 1, true);
    bytes memory txDataSecond = abi.encodeWithSignature(setValueSignature, 2, 1, false); // fails
    twoTxProp.data = txDataFirst.concat(txDataSecond);

    proposalId = governance.propose.value(DEPOSIT)(
      twoTxProp.values,
      twoTxProp.destinations,
      twoTxProp.data,
      twoTxProp.dataLengths,
      twoTxProp.description
    );
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);

    vm.expectRevert("Proposal execution failed");
    governance.execute(proposalId, 0);
  }

  function setupProposalPastExecutionStage() private {
    proposalId = makeAndApproveProposal(0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.warp(block.timestamp + governance.getExecutionStageDuration());
  }

  function test_returnFalse_WhenProposalIsPastExecutionStage() public {
    setupProposalPastExecutionStage();
    assertFalse(governance.execute(proposalId, 0));
  }

  function test_deleteProposal_WhenProposalIsPastExecutionStage() public {
    setupProposalPastExecutionStage();
    governance.execute(proposalId, 0);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_removeProposalFromDequeued_WhenProposalIsPastExecutionStage() public {
    setupProposalPastExecutionStage();
    governance.execute(proposalId, 0);

    uint256[] memory dequeued = governance.getDequeue();
    assertEq(dequeued.length, 1);
    assertNotEq(dequeued[0], proposalId);
  }

  function test_AddsIndexToEmptyIndices_WhenProposalIsPastExecutionStage() public {
    setupProposalPastExecutionStage();
    governance.execute(proposalId, 0);
    assertEq(governance.emptyIndices(0), 0);
  }

  function test_updateParticipationBaseline_WhenProposalIsPastExecutionStage() public {
    setupProposalPastExecutionStage();
    governance.execute(proposalId, 0);
    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitParticipationBaselineUpdatedEvent_WhenProposalIsPastExecutionStage() public {
    setupProposalPastExecutionStage();
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.execute(proposalId, 0);
  }

  // TODO fix when migrate to 0.8
  function SKIPtest_NoEmitProposalExecutedWhenEmptyProposalNotApproved() public {
    proposalId = governance.propose.value(DEPOSIT)(
      emptyProp.values,
      emptyProp.destinations,
      emptyProp.data,
      emptyProp.dataLengths,
      "empty proposal"
    );
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.warp(block.timestamp + governance.getExecutionStageDuration());

    vm.recordLogs();
    governance.execute(proposalId, 0);
    // Vm.Log[] memory entries = vm.getRecordedLogs();
    // assertEq(entries.length, 0);
  }

  // TODO fix when migrate to 0.8
  function SKIPtest_NoEmitProposalExecutedWhenEmptyProposalNotPassing() public {
    proposalId = governance.propose.value(DEPOSIT)(
      emptyProp.values,
      emptyProp.destinations,
      emptyProp.data,
      emptyProp.dataLengths,
      "empty proposal"
    );
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);

    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.warp(block.timestamp + governance.getExecutionStageDuration());

    vm.recordLogs();
    governance.execute(proposalId, 0);
    // Vm.Log[] memory entries = vm.getRecordedLogs();
    // assertEq(entries.length, 0);
  }

  function setUpEmptyProposalReadyForExecution() public {
    proposalId = governance.propose.value(DEPOSIT)(
      emptyProp.values,
      emptyProp.destinations,
      emptyProp.data,
      emptyProp.dataLengths,
      "empty proposal"
    );
    vm.warp(block.timestamp + governance.dequeueFrequency());

    vm.prank(accApprover);
    governance.approve(proposalId, 0);

    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);

    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.warp(block.timestamp + governance.getExecutionStageDuration());
  }

  function test_returnTrue_WhenEmptyProposalReadyForExecution() public {
    setUpEmptyProposalReadyForExecution();
    assertTrue(governance.execute(proposalId, 0));
  }

  function test_deleteProposal_WhenEmptyProposalReadyForExecution() public {
    setUpEmptyProposalReadyForExecution();
    governance.execute(proposalId, 0);
    assertFalse(governance.proposalExists(proposalId));
  }

  function test_removeProposalFromDequeued_WhenEmptyProposalReadyForExecution() public {
    setUpEmptyProposalReadyForExecution();
    governance.execute(proposalId, 0);

    uint256[] memory dequeued = governance.getDequeue();
    assertEq(dequeued.length, 1);
    assertNotEq(dequeued[0], proposalId);
  }

  function test_AddsIndexToEmptyIndices_WhenEmptyProposalReadyForExecution() public {
    setUpEmptyProposalReadyForExecution();
    governance.execute(proposalId, 0);
    assertEq(governance.emptyIndices(0), 0);
  }

  function test_updateParticipationBaseline_WhenEmptyProposalReadyForExecution() public {
    setUpEmptyProposalReadyForExecution();
    governance.execute(proposalId, 0);
    (uint256 baseline, , , ) = governance.getParticipationParameters();
    assertEq(baseline, expectedParticipationBaseline);
  }

  function test_emitParticipationBaselineUpdatedEvent_WhenEmptyProposalReadyForExecution() public {
    setUpEmptyProposalReadyForExecution();
    vm.expectEmit(true, true, true, true);
    emit ParticipationBaselineUpdated(expectedParticipationBaseline);
    governance.execute(proposalId, 0);
  }
}

contract GovernanceTest_approveHotfix is GovernanceTest {
  event HotfixApproved(bytes32 indexed hash);

  bytes32 constant HOTFIX_HASH = bytes32(uint256(0x123456789));

  function test_markHotfixRecordApprovedWhenCalledByApprover() public {
    vm.prank(accApprover);
    governance.approveHotfix(HOTFIX_HASH);
    (bool approved, , ) = governance.getHotfixRecord(HOTFIX_HASH);
    assertTrue(approved);
  }

  function test_emitHotfixApprovedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit HotfixApproved(HOTFIX_HASH);
    vm.prank(accApprover);
    governance.approveHotfix(HOTFIX_HASH);
  }

  function test_RevertIf_CalledByNonApprover() public {
    vm.expectRevert("msg.sender not approver");
    governance.approveHotfix(HOTFIX_HASH);
  }
}

contract GovernanceTest_whitelistHotfix is GovernanceTest {
  event HotfixWhitelisted(bytes32 indexed hash, address whitelister);

  bytes32 constant HOTFIX_HASH = bytes32(uint256(0x123456789));

  function test_EmitHotfixWhitelistEvent() public {
    address validator = actor("validator1");
    governance.addValidator(validator);
    governance.addValidator(actor("validator2"));

    vm.expectEmit(true, true, true, true);
    emit HotfixWhitelisted(HOTFIX_HASH, validator);
    vm.prank(validator);
    governance.whitelistHotfix(HOTFIX_HASH);
  }
}

contract GovernanceTest_hotfixWhitelistValidatorTally is GovernanceTest {
  bytes32 constant HOTFIX_HASH = bytes32(uint256(0x123456789));

  address[] validators;
  address[] signers;

  function setUp() public {
    super.setUp();
    for (uint256 i = 1; i < 4; i++) {
      address validator = vm.addr(i);
      uint256 signerPk = i * 10;
      address signer = vm.addr(signerPk);

      vm.prank(validator);
      accounts.createAccount();
      authorizeValidatorSigner(signerPk, validator);

      governance.addValidator(signer);

      validators.push(validator);
      signers.push(signer);
    }
  }

  function test_countValidatorAccountsThatHaveWhitelisted() public {
    for (uint256 i = 0; i < 3; i++) {
      vm.prank(validators[i]);
      governance.whitelistHotfix(HOTFIX_HASH);
    }

    assertEq(governance.hotfixWhitelistValidatorTally(HOTFIX_HASH), 3);
  }

  function test_count_authorizedValidatorSignersThatHaveWhitelisted() public {
    for (uint256 i = 0; i < 3; i++) {
      vm.prank(signers[i]);
      governance.whitelistHotfix(HOTFIX_HASH);
    }

    assertEq(governance.hotfixWhitelistValidatorTally(HOTFIX_HASH), 3);
  }

  function test_notDoubleCountValidatorAccountAndAuthorizedSignerAccounts() public {
    for (uint256 i = 0; i < 3; i++) {
      vm.prank(validators[i]);
      governance.whitelistHotfix(HOTFIX_HASH);
      vm.prank(signers[i]);
      governance.whitelistHotfix(HOTFIX_HASH);
    }

    assertEq(governance.hotfixWhitelistValidatorTally(HOTFIX_HASH), 3);
  }

  function test_returnTheCorrectTallyAfterKeyRotation() public {
    for (uint256 i = 0; i < 3; i++) {
      vm.prank(signers[i]);
      governance.whitelistHotfix(HOTFIX_HASH);
    }

    // rotate signer
    uint256 signerPk = 44;
    authorizeValidatorSigner(signerPk, validators[0]);

    assertEq(governance.hotfixWhitelistValidatorTally(HOTFIX_HASH), 3);
  }
}

contract GovernanceTest_isHotfixPassing is GovernanceTest {
  bytes32 constant HOTFIX_HASH = bytes32(uint256(0x123456789));

  function setUp() public {
    super.setUp();
    address val1 = actor("validator1");
    governance.addValidator(val1);
    vm.prank(val1);
    accounts.createAccount();

    address val2 = actor("validator2");
    governance.addValidator(val2);
    vm.prank(val2);
    accounts.createAccount();
  }

  function test_returnFalseWhenHotfixHasNotBeenWhitelisted() public {
    assertFalse(governance.isHotfixPassing(HOTFIX_HASH));
  }

  function test_returnFalseWhenHotfixHasBeenWhitelistedButNotByQuorum() public {
    vm.prank(actor("validator1"));
    governance.whitelistHotfix(HOTFIX_HASH);
    assertFalse(governance.isHotfixPassing(HOTFIX_HASH));
  }

  function test_returnTrueWhenHotfixIsWhitelistedByQuorum() public {
    vm.prank(actor("validator1"));
    governance.whitelistHotfix(HOTFIX_HASH);
    vm.prank(actor("validator2"));
    governance.whitelistHotfix(HOTFIX_HASH);
    assertTrue(governance.isHotfixPassing(HOTFIX_HASH));
  }
}

contract GovernanceTest_prepareHotfix is GovernanceTest {
  event HotfixPrepared(bytes32 indexed hash, uint256 indexed epoch);

  bytes32 constant HOTFIX_HASH = bytes32(uint256(0x123456789));

  function setUp() public {
    super.setUp();
    address val1 = actor("validator1");
    governance.addValidator(val1);
    vm.prank(val1);
    accounts.createAccount();
  }

  function test_RevertIf_HotfixIsNotPassing() public {
    vm.expectRevert("hotfix not whitelisted by 2f+1 validators");
    governance.prepareHotfix(HOTFIX_HASH);
  }

  function test_markHotfixRecordPreparedEpoch_whenHotfixIsPassing() public {
    vm.roll(block.number + governance.getEpochSize());
    vm.prank(actor("validator1"));
    governance.whitelistHotfix(HOTFIX_HASH);
    governance.prepareHotfix(HOTFIX_HASH);
    (, , uint256 preparedEpoch) = governance.getHotfixRecord(HOTFIX_HASH);

    assertEq(preparedEpoch, governance.getEpochNumber());
  }

  function test_emitHotfixPreparedEvent_whenHotfixIsPassing() public {
    vm.roll(block.number + governance.getEpochSize());
    vm.prank(actor("validator1"));
    governance.whitelistHotfix(HOTFIX_HASH);

    uint256 epoch = governance.getEpochNumber();
    vm.expectEmit(true, true, true, true);
    emit HotfixPrepared(HOTFIX_HASH, epoch);
    governance.prepareHotfix(HOTFIX_HASH);
  }

  function test_RevertIf_EpochEqualsPreparedEpoch_whenHotfixIsPassing() public {
    vm.roll(block.number + governance.getEpochSize());
    vm.prank(actor("validator1"));
    governance.whitelistHotfix(HOTFIX_HASH);
    governance.prepareHotfix(HOTFIX_HASH);
    vm.expectRevert("hotfix already prepared for this epoch");
    governance.prepareHotfix(HOTFIX_HASH);
  }

  function test_succeedForEpochDifferentPreparedEpoch_whenHotfixIsPassing() public {
    vm.roll(block.number + governance.getEpochSize());
    vm.prank(actor("validator1"));
    governance.whitelistHotfix(HOTFIX_HASH);
    governance.prepareHotfix(HOTFIX_HASH);
    vm.roll(block.number + governance.getEpochSize());
    governance.prepareHotfix(HOTFIX_HASH);
  }
}

contract GovernanceTest_executeHotfix is GovernanceTest {
  event HotfixExecuted(bytes32 indexed hash);

  bytes32 SALT = 0x657ed9d64e84fa3d1af43b3a307db22aba2d90a158015df1c588c02e24ca08f0;
  bytes32 hotfixHash;

  address validator;

  function setUp() public {
    super.setUp();
    validator = actor("validator");
    vm.prank(validator);
    accounts.createAccount();
    governance.addValidator(validator);

    // call governance test method to generate proper hotfix (needs calldata arguments)
    hotfixHash = governance.getHotfixHash(
      okProp.values,
      okProp.destinations,
      okProp.data,
      okProp.dataLengths,
      SALT
    );
  }

  function executeHotfixTx() private {
    governance.executeHotfix(
      okProp.values,
      okProp.destinations,
      okProp.data,
      okProp.dataLengths,
      SALT
    );
  }

  function approveAndPrepareHotfix() private {
    vm.prank(accApprover);
    governance.approveHotfix(hotfixHash);
    vm.roll(block.number + governance.getEpochSize());
    vm.prank(validator);
    governance.whitelistHotfix(hotfixHash);
    governance.prepareHotfix(hotfixHash);
  }

  function test_RevertIf_hotfixNotApproved() public {
    vm.expectRevert("hotfix not approved");
    executeHotfixTx();
  }

  function test_RevertIf_hotfixNotPreparedForCurrentEpoch() public {
    vm.roll(block.number + governance.getEpochSize());
    vm.prank(accApprover);
    governance.approveHotfix(hotfixHash);

    vm.expectRevert("hotfix must be prepared for this epoch");
    executeHotfixTx();
  }

  function test_RevertIf_hotfixPreparedButNotForCurrentEpoch() public {
    vm.prank(accApprover);
    governance.approveHotfix(hotfixHash);
    vm.prank(validator);
    governance.whitelistHotfix(hotfixHash);
    governance.prepareHotfix(hotfixHash);
    vm.roll(block.number + governance.getEpochSize());
    vm.expectRevert("hotfix must be prepared for this epoch");
    executeHotfixTx();
  }

  function test_executeHotfix_WhenApprovedAndPreparedForCurrentEpoch() public {
    approveAndPrepareHotfix();
    executeHotfixTx();
    assertEq(testTransactions.getValue(1), 1);
  }

  function test_markHotfixAsExecuted_WhenApprovedAndPreparedForCurrentEpoch() public {
    approveAndPrepareHotfix();
    executeHotfixTx();
    (, bool executed, ) = governance.getHotfixRecord(hotfixHash);
    assertTrue(executed);
  }

  function test_emitHotfixExecutedEvent_WhenApprovedAndPreparedForCurrentEpoch() public {
    approveAndPrepareHotfix();
    vm.expectEmit(true, true, true, true);
    emit HotfixExecuted(hotfixHash);
    executeHotfixTx();
  }

  function test_notBeExecutableAgain_WhenApprovedAndPreparedForCurrentEpoch() public {
    approveAndPrepareHotfix();
    executeHotfixTx();
    vm.expectRevert("hotfix already executed");
    executeHotfixTx();
  }
}

contract GovernanceTest_isVoting is GovernanceTest {
  uint256 proposalId;

  function setUp() public {
    super.setUp();
    proposalId = makeValidProposal();
  }

  function test_returnsFalse_whenAccountNeverActedOnProposal() public {
    emit log_uint(governance.getMostRecentReferendumProposal(accVoter));
    assertFalse(governance.isVoting(accVoter));
  }

  function test_ReturnsTrue_whenUpvoted() public {
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    assertTrue(governance.isVoting(accVoter));
  }

  function test_returnsFalse_whenUpvoteIsRevoked() public {
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    vm.prank(accVoter);
    governance.revokeUpvote(0, 0);
    assertFalse(governance.isVoting(accVoter));
  }

  function test_returnsFalse_WhenAfterUpvoteProposalExpired() public {
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    vm.warp(block.timestamp + governance.queueExpiry());
    assertFalse(governance.isVoting(accVoter));
  }

  function test_ReturnsTrue_WhenVoted() public {
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Abstain);

    assertTrue(governance.isVoting(accVoter));
  }

  function test_returnsFalse_WhenVotedButAfterReferendumStage() public {
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Abstain);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);

    assertFalse(governance.isVoting(accVoter));
  }
}

contract GovernanceTest_isProposalPassing is GovernanceTest {
  uint256 proposalId;
  address accSndVoter;

  function setUp() public {
    super.setUp();
    accSndVoter = actor("sndVoter");
    vm.prank(accSndVoter);
    accounts.createAccount();

    mockLockedGold.setTotalLockedGold(100);
    proposalId = makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
  }

  function test_ReturnsTrue_whenAdjustedSupportIsGreaterThanThreshold() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 51);
    mockLockedGold.setAccountTotalGovernancePower(accSndVoter, 49);

    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.prank(accSndVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);

    assertTrue(governance.isProposalPassing(proposalId));
  }

  function test_returnsFalse_whenAdjustedSupportIsLessThanOrEqualToThreshold() public {
    mockLockedGold.setAccountTotalGovernancePower(accVoter, 50);
    mockLockedGold.setAccountTotalGovernancePower(accSndVoter, 50);

    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.prank(accSndVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.No);

    assertFalse(governance.isProposalPassing(proposalId));
  }
}

contract GovernanceTest_dequeueProposalsIfReady is GovernanceTest {
  function test_notUpdateLastDequeueWhenThereAreNoQueuedProposals() public {
    uint256 originalLastDequeue = governance.lastDequeue();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();

    assertEq(governance.getQueueLength(), 0);
    assertEq(governance.lastDequeue(), originalLastDequeue);
  }

  function test_updateLastDequeue_whenProposalExists() public {
    makeValidProposal();
    uint256 originalLastDequeue = governance.lastDequeue();

    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();

    assertEq(governance.getQueueLength(), 0);
    assertTrue(governance.lastDequeue() > originalLastDequeue);
  }

  function test_notUpdateLastDequeueWhenOnlyExpiredProposalQueued() public {
    makeValidProposal();
    uint256 originalLastDequeue = governance.lastDequeue();

    vm.warp(block.timestamp + governance.queueExpiry());
    governance.dequeueProposalsIfReady();

    assertEq(governance.getQueueLength(), 0);
    assertEq(governance.lastDequeue(), originalLastDequeue);
  }
}

contract GovernanceTest_getProposalStage is GovernanceTest {
  function test_returnNoneStageWhenProposalDoesNotExists() public {
    assertEq(uint256(governance.getProposalStage(0)), uint256(Proposals.Stage.None));
    assertEq(uint256(governance.getProposalStage(1)), uint256(Proposals.Stage.None));
  }

  function test_returnQueuedWhenNotExpired() public {
    uint256 proposalId = makeValidProposal();
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Queued));
  }

  function test_returnExpirationWhenExpired() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.queueExpiry());
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Expiration));
  }

  function test_returnReferendumWhenNotVotedAndNotExpired() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Referendum));
  }

  function test_returnExpirationWhenExpiredButDequeued() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Expiration));
  }

  function test_returnReferendumWhenNotExpiredButApproved() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);

    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Referendum));
  }

  function test_returnExpirationWhenExpiredButApproved() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Expiration));
  }

  function test_returnExecutionWhenInExecutionStageAndNotExpired() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Execution));
  }

  function test_returnExpirationWhenExpiredAfterExecutionState() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.warp(block.timestamp + governance.getExecutionStageDuration());

    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Expiration));
    assertTrue(governance.isDequeuedProposalExpired(proposalId));
  }

  function test_returnExpirationPastTheExecutionStageWhenNotApproved_WithEmptyProposal() public {
    uint256 proposalId = makeEmptyProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(
      block.timestamp + REFERENDUM_STAGE_DURATION + governance.getExecutionStageDuration() + 1
    );
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Expiration));
    assertTrue(governance.isDequeuedProposalExpired(proposalId));
  }

  function test_returnExpirationPastTheExecutionStageWhenNotPassing_WithEmptyProposal() public {
    uint256 proposalId = makeEmptyProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.warp(
      block.timestamp + REFERENDUM_STAGE_DURATION + governance.getExecutionStageDuration() + 1
    );
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Expiration));
    assertTrue(governance.isDequeuedProposalExpired(proposalId));
  }

  function test_returnExecutionWhenInExecutionStageAndNotExpired_WithEmptyProposal() public {
    uint256 proposalId = makeEmptyProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Execution));
  }

  function test_returnExecutionPastTheExecutionStageIfPassedAndApproved_WithEmptyProposal() public {
    uint256 proposalId = makeEmptyProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    governance.dequeueProposalsIfReady();
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.vote(proposalId, 0, Proposals.VoteValue.Yes);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    vm.warp(block.timestamp + governance.getExecutionStageDuration() + 1);
    assertEq(uint256(governance.getProposalStage(proposalId)), uint256(Proposals.Stage.Execution));
    assertFalse(governance.isDequeuedProposalExpired(proposalId));
  }
}

contract GovernanceTest_getAmountOfGoldUsedForVoting is GovernanceTest {
  function makeAndApprove3ConcurrentProposals() private {
    vm.prank(accOwner);
    governance.setConcurrentProposals(3);
    makeValidProposal();
    makeValidProposal();
    makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.startPrank(accApprover);
    governance.approve(1, 0);
    governance.approve(2, 1);
    governance.approve(3, 2);
    vm.stopPrank();
  }

  function test_showCorrectNumberOfVotes_whenVotingOn1ConcurrentProposal() public {
    makeAndApprove3ConcurrentProposals();

    vm.startPrank(accVoter);
    governance.votePartially(1, 0, 10, 30, 0);
    vm.stopPrank();

    uint256 totalVotes = governance.getAmountOfGoldUsedForVoting(accVoter);
    assertEq(totalVotes, 40);
  }

  function test_showCorrectNumberOfVotes_whenVotingOn2ConcurrentProposal() public {
    // TODO mcortesi: check if this makes sense
    makeAndApprove3ConcurrentProposals();

    vm.startPrank(accVoter);
    governance.votePartially(1, 0, 10, 30, 0);
    governance.votePartially(1, 0, 10, 30, 0);
    vm.stopPrank();

    uint256 totalVotes = governance.getAmountOfGoldUsedForVoting(accVoter);
    assertEq(totalVotes, 40);
  }

  function test_showCorrectNumberOfVotes_whenVotingOn3ConcurrentProposal() public {
    // TODO mcortesi: check if this makes sense
    makeAndApprove3ConcurrentProposals();

    vm.startPrank(accVoter);
    governance.votePartially(1, 0, 10, 30, 0);
    governance.votePartially(1, 0, 10, 30, 0);
    governance.votePartially(1, 0, 10, 30, 0);
    vm.stopPrank();

    uint256 totalVotes = governance.getAmountOfGoldUsedForVoting(accVoter);
    assertEq(totalVotes, 40);
  }

  function test_returnNumberOfVotes_WhenDequeuedAndVotingHappenInV8() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    governance.setDeprecatedWeight(accVoter, 0, 100, 1);
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), 100);
  }

  function test_returnNumberOfVotes_whenDequeuedAndVotedPartially() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);

    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, 10, 30, 0);
    uint256 totalVotes = governance.getAmountOfGoldUsedForVoting(accVoter);
    assertEq(totalVotes, 40);
  }

  function test_return0Votes_whenDequeuedAndVotedPartiallyButExpired() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, 10, 30, 0);
    vm.warp(
      block.timestamp + REFERENDUM_STAGE_DURATION + governance.getExecutionStageDuration() + 1
    );
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), 0);
  }

  function test_return0Votes_WhenIndexOfProposalGetsReused() public {
    uint256 proposalId = makeValidProposal();
    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    vm.prank(accVoter);
    governance.votePartially(proposalId, 0, 10, 30, 0);
    vm.warp(block.timestamp + REFERENDUM_STAGE_DURATION);
    governance.execute(proposalId, 0);
    vm.warp(block.timestamp + governance.getExecutionStageDuration() + 1);
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), 0);

    governance.dequeueProposalsIfReady();
    proposalId = makeValidProposal();

    vm.warp(block.timestamp + governance.dequeueFrequency() + 1);
    vm.prank(accApprover);
    governance.approve(proposalId, 0);
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), 0);
  }

  function test_returnFullWeightWhenUpvoting_WhenProposalInQueue() public {
    vm.prank(accOwner);
    governance.setConcurrentProposals(3);
    uint256 proposalId = makeValidProposal();
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), VOTER_GOLD);
  }

  function test_return0IfProposalExpired_WhenProposalInQueue() public {
    vm.prank(accOwner);
    governance.setConcurrentProposals(3);
    uint256 proposalId = makeValidProposal();
    vm.prank(accVoter);
    governance.upvote(proposalId, 0, 0);
    vm.warp(block.timestamp + governance.queueExpiry());
    assertEq(governance.getAmountOfGoldUsedForVoting(accVoter), 0);
  }
}

contract GovernanceTest_removeVotesWhenRevokingDelegatedVotes is GovernanceTest {
  uint256[] proposalIds;

  function test_RevertWhen_NotCalledByStakedCeloContract() public {
    vm.expectRevert("msg.sender not lockedGold");
    governance.removeVotesWhenRevokingDelegatedVotes(address(0), 0);
  }

  function test_shouldPassWhenNoProposalIsDequeued() public {
    governance.removeVotesWhenRevokingDelegatedVotesTest(address(0), 0);
  }

  function assertVotesTotal(
    uint256 proposalId,
    uint256 expectedYes,
    uint256 expectedNo,
    uint256 expectedAbstain
  ) private {
    (uint256 yes, uint256 no, uint256 abstain) = governance.getVoteTotals(proposalId);

    assertEq(yes, expectedYes);
    assertEq(no, expectedNo);
    assertEq(abstain, expectedAbstain);
  }

  function assertVoteRecord(
    uint256 index,
    uint256 expectedProposalId,
    uint256 expectedYes,
    uint256 expectedNo,
    uint256 expectedAbstain
  ) private {
    (uint256 proposalId, , , uint256 yes, uint256 no, uint256 abstain) = governance.getVoteRecord(
      accVoter,
      index
    );
    assertEq(proposalId, expectedProposalId);
    assertEq(yes, expectedYes);
    assertEq(no, expectedNo);
    assertEq(abstain, expectedAbstain);
  }

  function makeAndApprove3Proposals() private {
    vm.prank(accOwner);
    governance.setConcurrentProposals(3);
    vm.prank(accOwner);
    governance.setDequeueFrequency(60);

    proposalIds.push(makeValidProposal());
    proposalIds.push(makeValidProposal());
    proposalIds.push(makeValidProposal());

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalIds[0], 0);

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalIds[1], 1);

    vm.warp(block.timestamp + governance.dequeueFrequency());
    vm.prank(accApprover);
    governance.approve(proposalIds[2], 2);
  }

  function setUpVotingOnlyforYes() private {
    vm.prank(accVoter);
    governance.votePartially(proposalIds[0], 0, 100, 0, 0);
    vm.prank(accVoter);
    governance.votePartially(proposalIds[1], 1, 0, 100, 0);

    assertVoteRecord(0, proposalIds[0], 100, 0, 0);
    assertVoteRecord(1, proposalIds[1], 0, 100, 0);

    assertVotesTotal(proposalIds[0], 100, 0, 0);
    assertVotesTotal(proposalIds[1], 0, 100, 0);
  }

  function test_adjustVotesCorrectlyTo0_WhenVotingOnlyforYes() public {
    makeAndApprove3Proposals();
    setUpVotingOnlyforYes();
    governance.removeVotesWhenRevokingDelegatedVotesTest(accVoter, 0);

    assertVoteRecord(0, proposalIds[0], 0, 0, 0);
    assertVoteRecord(1, proposalIds[1], 0, 0, 0);

    assertVotesTotal(proposalIds[0], 0, 0, 0);
    assertVotesTotal(proposalIds[1], 0, 0, 0);
  }

  function test_adjust_votes_correctly_to_30_WhenVotingOnlyForYes() public {
    makeAndApprove3Proposals();
    setUpVotingOnlyforYes();
    governance.removeVotesWhenRevokingDelegatedVotesTest(accVoter, 30);

    assertVoteRecord(0, proposalIds[0], 30, 0, 0);
    assertVoteRecord(1, proposalIds[1], 0, 30, 0);

    assertVotesTotal(proposalIds[0], 30, 0, 0);
    assertVotesTotal(proposalIds[1], 0, 30, 0);
  }

  function setupVotingForAllChoices() private {
    vm.prank(accVoter);
    governance.votePartially(proposalIds[0], 0, 50, 20, 30);
    vm.prank(accVoter);
    governance.votePartially(proposalIds[1], 1, 0, 40, 60);
    vm.prank(accVoter);
    governance.votePartially(proposalIds[2], 2, 0, 0, 51);

    assertVoteRecord(0, proposalIds[0], 50, 20, 30);
    assertVoteRecord(1, proposalIds[1], 0, 40, 60);
    assertVoteRecord(2, proposalIds[2], 0, 0, 51);
  }

  function test_adjustVotesCorrectlyTo0_WhenVotingForAllChoices() public {
    makeAndApprove3Proposals();
    setupVotingForAllChoices();

    governance.removeVotesWhenRevokingDelegatedVotesTest(accVoter, 0);

    assertVoteRecord(0, proposalIds[0], 0, 0, 0);
    assertVoteRecord(1, proposalIds[1], 0, 0, 0);
  }

  function test_adjustVotesCorrectlyTo50_WhenVotingForAllChoices() public {
    makeAndApprove3Proposals();
    setupVotingForAllChoices();

    uint256 maxAmount = 50; // means that votes will be halved
    governance.removeVotesWhenRevokingDelegatedVotesTest(accVoter, maxAmount);

    (uint256 yes0, uint256 no0, uint256 abstain0) = governance.getVoteTotals(proposalIds[0]);
    (uint256 yes1, uint256 no1, uint256 abstain1) = governance.getVoteTotals(proposalIds[1]);
    (uint256 yes2, uint256 no2, uint256 abstain2) = governance.getVoteTotals(proposalIds[2]);

    assertEq(yes0 + no0 + abstain0, maxAmount);
    assertEq(yes1 + no1 + abstain1, maxAmount);
    assertEq(yes2 + no2 + abstain2, maxAmount);

    assertEq(yes0, 50 / 2);
    assertEq(no0, 20 / 2);
    assertEq(abstain0, 30 / 2);

    assertEq(yes1, 0);
    assertEq(no1, 40 / 2);
    assertEq(abstain1, 60 / 2);

    assertVoteRecord(0, proposalIds[0], 50 / 2, 20 / 2, 30 / 2);
    assertVoteRecord(1, proposalIds[1], 0, 40 / 2, 60 / 2);
  }

  function test_notAdjustVotes_WhenVotingForAllChoicesAndProposalsExpired() public {
    makeAndApprove3Proposals();
    setupVotingForAllChoices();
    vm.warp(block.timestamp + governance.queueExpiry());
    assertVoteRecord(0, proposalIds[0], 50, 20, 30);
    assertVoteRecord(1, proposalIds[1], 0, 40, 60);
  }
}

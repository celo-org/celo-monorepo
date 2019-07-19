pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./IntegerSortedLinkedList.sol";
import "./UsingBondedDeposits.sol";
import "./interfaces/IGovernance.sol";
import "./interfaces/IQuorum.sol";
import "../stability/FractionUtil.sol";
import "../common/Initializable.sol";


// TODO(asa): Hardcode minimum times for queueExpiry, etc.
/**
 * @title A contract for making, passing, and executing on-chain governance proposals.
 */
contract Governance is IGovernance, Ownable, Initializable, UsingBondedDeposits, ReentrancyGuard {
  using SafeMath for uint256;
  using FractionUtil for FractionUtil.Fraction;
  using IntegerSortedLinkedList for SortedLinkedList.List;
  using BytesLib for bytes;

  // TODO(asa): Consider a delay stage.
  enum ProposalStage {
    None,
    Queued,
    Approval,
    Referendum,
    Execution,
    Expiration
  }

  enum VoteValue {
    None,
    Abstain,
    No,
    Yes
  }

  struct VoteRecord {
    VoteValue value;
    uint256 proposalId;
  }

  struct Voter {
    // Key of the proposal voted for in the proposal queue
    uint256 upvotedProposal;
    uint256 mostRecentReferendumProposal;
    // Maps a `dequeued` index to a voter's vote record.
    mapping(uint256 => VoteRecord) referendumVotes;
  }

  // TODO(asa): Reduce storage usage here.
  struct VoteTotals {
    uint256 abstain;
    uint256 no;
    uint256 yes;
  }

  struct Transaction {
    uint256 value;
    address destination;
    bytes data;
  }

  struct Proposal {
    address proposer;
    uint256 deposit;
    uint256 timestamp;
    VoteTotals votes;
    Transaction[] transactions;
    bool approved;
  }

  struct ThresholdParameters {
    // Support threshold for proposal passing at typical participation level
    FractionUtil.Fraction baseThreshold;
    // Factor inversely related to threshold sensitivity
    FractionUtil.Fraction kFactor;
  }

  struct ContractConstitution {
    ThresholdParameters defaultParameters;
    // Maps a function ID to a corresponding passing function, overriding the
    // default.
    mapping(bytes4 => ThresholdParameters) functionThresholds;
  }

  struct StageDurations {
    uint256 approval;
    uint256 referendum;
    uint256 execution;
  }

  StageDurations public stageDurations;
  uint256 public queueExpiry;
  uint256 public dequeueFrequency;
  address public approver;
  uint256 public lastDequeue;
  uint256 public concurrentProposals;
  uint256 public proposalCount;
  uint256 public minDeposit;
  mapping(address => uint256) public refundedDeposits;
  mapping(address => ContractConstitution) private constitution;
  mapping(uint256 => Proposal) private proposals;
  mapping(address => Voter) public voters;
  SortedLinkedList.List private queue;
  uint256[] public dequeued;
  uint256[] public emptyIndices;

  event ApproverSet(
    address approver
  );

  event ConcurrentProposalsSet(
    uint256 concurrentProposals
  );

  event MinDepositSet(
    uint256 minDeposit
  );

  event QueueExpirySet(
    uint256 queueExpiry
  );

  event DequeueFrequencySet(
    uint256 dequeueFrequency
  );

  event ApprovalStageDurationSet(
    uint256 approvalStageDuration
  );

  event ReferendumStageDurationSet(
    uint256 referendumStageDuration
  );

  event ExecutionStageDurationSet(
    uint256 executionStageDuration
  );

  event ConstitutionSet(
    address indexed destination,
    bytes4 indexed functionId,
    uint256 thresholdNumerator,
    uint256 thresholdDenominator,
    uint256 kFactorNumerator,
    uint256 kFactorDenominator
  );

  event ProposalQueued(
    uint256 indexed proposalId,
    address indexed proposer,
    uint256 transactionCount,
    uint256 deposit,
    uint256 timestamp
  );

  event ProposalUpvoted(
    uint256 indexed proposalId,
    address indexed account,
    uint256 upvotes
  );

  event ProposalUpvoteRevoked(
    uint256 indexed proposalId,
    address indexed account,
    uint256 revokedUpvotes
  );

  event ProposalDequeued(
    uint256 indexed proposalId,
    uint256 timestamp
  );

  event ProposalApproved(
    uint256 indexed proposalId
  );

  event ProposalVoted(
    uint256 indexed proposalId,
    address indexed account,
    uint256 value,
    uint256 weight
  );

  event ProposalExecuted(
    uint256 indexed proposalId
  );

  event ProposalExpired(
    uint256 proposalId
  );

  function() external payable {} // solhint-disable no-empty-blocks

  /**
   * @notice Initializes critical variables.
   * @param registryAddress The address of the registry contract.
   * @param _approver The address that needs to approve proposals to move to the referendum stage.
   * @param _concurrentProposals The number of proposals to dequeue at once.
   * @param _minDeposit The minimum Celo Gold deposit needed to make a proposal.
   * @param _queueExpiry The number of seconds a proposal can stay in the queue before expiring.
   * @param _dequeueFrequency The number of seconds before the next batch of proposals can be
   *   dequeued.
   * @param approvalStageDuration The number of seconds the approver has to approve a proposal
   *   after it is dequeued.
   * @param referendumStageDuration The number of seconds users have to vote on a dequeued proposal
   *   after the approval stage ends.
   * @param executionStageDuration The number of seconds users have to execute a passed proposal
   *   after the referendum stage ends.
   * @dev Should be called only once.
   */
  function initialize(
    address registryAddress,
    address _approver,
    uint256 _concurrentProposals,
    uint256 _minDeposit,
    uint256 _queueExpiry,
    uint256 _dequeueFrequency,
    uint256 approvalStageDuration,
    uint256 referendumStageDuration,
    uint256 executionStageDuration
  )
    external
    initializer
  {
    require(
      _approver != address(0) &&
      _concurrentProposals != 0 &&
      _minDeposit != 0 &&
      _queueExpiry != 0 &&
      _dequeueFrequency != 0 &&
      approvalStageDuration != 0 &&
      referendumStageDuration != 0 &&
      executionStageDuration != 0
    );
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    approver = _approver;
    concurrentProposals = _concurrentProposals;
    minDeposit = _minDeposit;
    queueExpiry = _queueExpiry;
    dequeueFrequency = _dequeueFrequency;
    stageDurations.approval = approvalStageDuration;
    stageDurations.referendum = referendumStageDuration;
    stageDurations.execution = executionStageDuration;
    // solhint-disable-next-line not-rely-on-time
    lastDequeue = now;
  }

  /**
   * @notice Updates the address that has permission to approve proposals in the approval stage.
   * @param _approver The address that has permission to approve proposals in the approval stage.
   */
  function setApprover(address _approver) external onlyOwner {
    require(_approver != address(0) && _approver != approver);
    approver = _approver;
    emit ApproverSet(_approver);
  }

  /**
   * @notice Updates the number of proposals to dequeue at a time.
   * @param _concurrentProposals The number of proposals to dequeue at at a time.
   */
  function setConcurrentProposals(uint256 _concurrentProposals) external onlyOwner {
    require(_concurrentProposals > 0 && _concurrentProposals != concurrentProposals);
    concurrentProposals = _concurrentProposals;
    emit ConcurrentProposalsSet(_concurrentProposals);
  }

  /**
   * @notice Updates the minimum deposit needed to make a proposal.
   * @param _minDeposit The minimum Celo Gold deposit needed to make a proposal.
   */
  function setMinDeposit(uint256 _minDeposit) external onlyOwner {
    require(_minDeposit != minDeposit);
    minDeposit = _minDeposit;
    emit MinDepositSet(_minDeposit);
  }

  /**
   * @notice Updates the number of seconds before a queued proposal expires.
   * @param _queueExpiry The number of seconds a proposal can stay in the queue before expiring.
   */
  function setQueueExpiry(uint256 _queueExpiry) external onlyOwner {
    require(_queueExpiry > 0 && _queueExpiry != queueExpiry);
    queueExpiry = _queueExpiry;
    emit QueueExpirySet(_queueExpiry);
  }

  /**
   * @notice Updates the minimum number of seconds before the next batch of proposals can be
   *   dequeued.
   * @param _dequeueFrequency The number of seconds before the next batch of proposals can be
   *   dequeued.
   */
  function setDequeueFrequency(uint256 _dequeueFrequency) external onlyOwner {
    require(_dequeueFrequency > 0 && _dequeueFrequency != dequeueFrequency);
    dequeueFrequency = _dequeueFrequency;
    emit DequeueFrequencySet(_dequeueFrequency);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the approval stage.
   * @param approvalStageDuration The number of seconds proposals stay in the approval stage.
   */
  function setApprovalStageDuration(uint256 approvalStageDuration) external onlyOwner {
    require(approvalStageDuration > 0 && approvalStageDuration != stageDurations.approval);
    stageDurations.approval = approvalStageDuration;
    emit ApprovalStageDurationSet(approvalStageDuration);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the referendum stage.
   * @param referendumStageDuration The number of seconds proposals stay in the referendum stage.
   */
  function setReferendumStageDuration(uint256 referendumStageDuration) external onlyOwner {
    require(referendumStageDuration > 0 && referendumStageDuration != stageDurations.referendum);
    stageDurations.referendum = referendumStageDuration;
    emit ReferendumStageDurationSet(referendumStageDuration);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the execution stage.
   * @param executionStageDuration The number of seconds proposals stay in the execution stage.
   */
  function setExecutionStageDuration(uint256 executionStageDuration) external onlyOwner {
    require(executionStageDuration > 0 && executionStageDuration != stageDurations.execution);
    stageDurations.execution = executionStageDuration;
    emit ExecutionStageDurationSet(executionStageDuration);
  }

  /**
   * @notice Updates the yes:yes+no threshold curve for a specific class of proposals to pass.
   * @param destination The destination of proposals for which this threshold should apply.
   * @param functionId The function ID of proposals for which this threshold should apply. Zero
   *   will set the default.
   * @param thresholdNumerator The numerator of the base threshold.
   * @param thresholdDenominator The denominator of the base threshold.
   * @param kFactorNumerator The numerator of the sensitivity factor.
   * @param kFactorDenominator The denominator of the sensitivity factor.
   * @dev If no constitution is explicitly set the default is a simple majority, i.e. 1:2.
   */
  function setConstitution(
    address destination,
    bytes4 functionId,
    uint256 thresholdNumerator,
    uint256 thresholdDenominator,
    uint256 kFactorNumerator,
    uint256 kFactorDenominator
  )
    external
    onlyOwner
  {
    // TODO(asa): https://github.com/celo-org/celo-monorepo/pull/3414#discussion_r283588332
    require(destination != address(0) && thresholdNumerator > 0
      && thresholdDenominator > 0 && kFactorDenominator > 0);
    ThresholdParameters memory thresholdParameters = ThresholdParameters(
      FractionUtil.Fraction(thresholdNumerator, thresholdDenominator),
      FractionUtil.Fraction(kFactorNumerator, kFactorDenominator));
    FractionUtil.Fraction memory majority = FractionUtil.Fraction(1, 2);
    FractionUtil.Fraction memory unanimous = FractionUtil.Fraction(1, 1);
    require(thresholdParameters.baseThreshold.isGreaterThan(majority)
      && thresholdParameters.baseThreshold.isLessThanOrEqualTo(unanimous));
    if (functionId == 0) {
      constitution[destination].defaultParameters = thresholdParameters;
    } else {
      constitution[destination].functionThresholds[functionId] = thresholdParameters;
    }
    emit ConstitutionSet(
      destination,
      functionId,
      thresholdNumerator,
      thresholdDenominator,
      kFactorNumerator,
      kFactorDenominator
    );
  }

  /**
   * @notice Creates a new proposal and adds it to end of the queue with no upvotes.
   * @param values The values of Celo Gold to be sent in the proposed transactions.
   * @param destinations The destination addresses of the proposed transactions.
   * @param data The concatenated data to be included in the proposed transactions.
   * @param dataLengths The lengths of each transaction's data.
   * @return The ID of the newly proposed proposal.
   * @dev The minimum deposit must be included with the proposal, returned if/when the proposal is
   *   dequeued.
   */
  function propose(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths
  )
    external
    payable
    returns (uint256)
  {
    dequeueProposalsIfReady();
    require(msg.value >= minDeposit);
    require(values.length == destinations.length && destinations.length == dataLengths.length);
    uint256 transactionCount = values.length;

    proposalCount = proposalCount.add(1);
    Proposal storage proposal = proposals[proposalCount];
    proposal.proposer = msg.sender;
    proposal.deposit = msg.value;
    // solhint-disable-next-line not-rely-on-time
    proposal.timestamp = now;

    uint256 dataPosition = 0;
    for (uint256 i = 0; i < transactionCount; i = i.add(1)) {
      proposal.transactions.push(
        Transaction(values[i], destinations[i], data.slice(dataPosition, dataLengths[i]))
      );
      dataPosition = dataPosition.add(dataLengths[i]);
    }

    queue.push(proposalCount);
    // solhint-disable-next-line not-rely-on-time
    emit ProposalQueued(proposalCount, msg.sender, proposal.transactions.length, msg.value, now);
    return proposalCount;
  }

  /**
   * @notice Upvotes a queued proposal.
   * @param proposalId The ID of the proposal to upvote.
   * @param lesser The ID of the proposal that will be just behind `proposalId` in the queue.
   * @param greater The ID of the proposal that will be just ahead `proposalId` in the queue.
   * @return Whether or not the upvote was made successfully.
   * @dev Provide 0 for `lesser`/`greater` when the proposal will be at the tail/head of the queue.
   * @dev Reverts if the account has already upvoted a proposal in the queue.
   */
  function upvote(
    uint256 proposalId,
    uint256 lesser,
    uint256 greater
  )
    external
    nonReentrant
    returns (bool)
  {
    address account = getAccountFromVoter(msg.sender);
    require(!isVotingFrozen(account));
    // TODO(asa): When upvoting a proposal that will get dequeued, should we let the tx succeed
    // and return false?
    dequeueProposalsIfReady();
    // If acting on an expired proposal, expire the proposal and take no action.
    // solhint-disable-next-line not-rely-on-time
    if (queue.contains(proposalId) && now >= proposals[proposalId].timestamp.add(queueExpiry)) {
      queue.remove(proposalId);
      emit ProposalExpired(proposalId);
      return false;
    }
    Voter storage voter = voters[account];
    // We can upvote a proposal in the queue if we're not already upvoting a proposal in the queue.
    uint256 weight = getAccountWeight(account);
    require(
      isQueued(proposalId) &&
      (voter.upvotedProposal == 0 || !queue.contains(voter.upvotedProposal)) &&
      weight > 0
    );
    uint256 upvotes = queue.getValue(proposalId).add(uint256(weight));
    queue.update(
      proposalId,
      upvotes,
      lesser,
      greater
    );
    voter.upvotedProposal = proposalId;
    emit ProposalUpvoted(proposalId, account, weight);
    return true;
  }

  /**
   * @notice Revokes an upvote on a queued proposal.
   * @param lesser The ID of the proposal that will be just behind the previously upvoted proposal
   *   in the queue.
   * @param greater The ID of the proposal that will be just ahead of the previously upvoted
   *   proposal in the queue.
   * @return Whether or not the upvote was revoked successfully.
   * @dev Provide 0 for `lesser`/`greater` when the proposal will be at the tail/head of the queue.
   */
  function revokeUpvote(
    uint256 lesser,
    uint256 greater
  )
    external
    nonReentrant
    returns (bool)
  {
    dequeueProposalsIfReady();
    address account = getAccountFromVoter(msg.sender);
    Voter storage voter = voters[account];
    uint256 proposalId = voter.upvotedProposal;
    Proposal storage proposal = proposals[proposalId];
    require(_proposalExists(proposal));
    // If acting on an expired proposal, expire the proposal.
    // TODO(asa): Break this out into a separate function.
    if (queue.contains(proposalId)) {
      // solhint-disable-next-line not-rely-on-time
      if (now >= proposal.timestamp.add(queueExpiry)) {
        queue.remove(proposalId);
        emit ProposalExpired(proposalId);
      } else {
        uint256 weight = getAccountWeight(account);
        require(weight > 0);
        queue.update(
          proposalId,
          queue.getValue(proposalId).sub(weight),
          lesser,
          greater
        );
        emit ProposalUpvoteRevoked(proposalId, account, weight);
      }
    }
    voter.upvotedProposal = 0;
    return true;
  }

  // TODO(asa): Consider allowing approval to be revoked.
  // TODO(asa): Everywhere we use an index, require it's less than the array length
  /**
   * @notice Approves a proposal in the approval stage.
   * @param proposalId The ID of the proposal to approve.
   * @param index The index of the proposal ID in `dequeued`.
   * @return Whether or not the approval was made successfully.
   */
  function approve(uint256 proposalId, uint256 index) external returns (bool) {
    dequeueProposalsIfReady();
    Proposal storage proposal = proposals[proposalId];
    require(_proposalExists(proposal) && dequeued[index] == proposalId);
    if (isDequeuedProposalExpired(proposal)) {
      deleteDequeuedProposal(proposal, proposalId, index);
      return false;
    }
    ProposalStage stage = _getDequeuedProposalStage(proposal.timestamp);
    require(msg.sender == approver && !proposal.approved && stage == ProposalStage.Approval);
    proposal.approved = true;
    emit ProposalApproved(proposalId);
    return true;
  }

  /**
   * @notice Votes on a proposal in the referendum stage.
   * @param proposalId The ID of the proposal to vote on.
   * @param index The index of the proposal ID in `dequeued`.
   * @param value Whether to vote yes, no, or abstain.
   * @return Whether or not the vote was cast successfully.
   */
  /* solhint-disable code-complexity */
  function vote(
    uint256 proposalId,
    uint256 index,
    VoteValue value
  )
    external
    returns (bool)
  {
    address account = getAccountFromVoter(msg.sender);
    require(!isVotingFrozen(account));
    dequeueProposalsIfReady();
    Proposal storage proposal = proposals[proposalId];
    require(_proposalExists(proposal) && dequeued[index] == proposalId);
    if (isDequeuedProposalExpired(proposal)) {
      deleteDequeuedProposal(proposal, proposalId, index);
      return false;
    }
    ProposalStage stage = _getDequeuedProposalStage(proposal.timestamp);
    Voter storage voter = voters[account];
    uint256 weight = getAccountWeight(account);
    require(
      proposal.approved &&
      stage == ProposalStage.Referendum &&
      value != VoteValue.None &&
      weight > 0
    );
    VoteRecord storage voteRecord = voter.referendumVotes[index];
    // If we've already voted on this proposal, subtract the previous vote.
    if (voteRecord.proposalId == proposalId) {
      if (voteRecord.value == VoteValue.Abstain) {
        proposal.votes.abstain = proposal.votes.abstain.sub(weight);
      } else if (voteRecord.value == VoteValue.Yes) {
        proposal.votes.yes = proposal.votes.yes.sub(weight);
      } else if (voteRecord.value == VoteValue.No) {
        proposal.votes.no = proposal.votes.no.sub(weight);
      }
    }

    // Add new vote.
    if (value == VoteValue.Abstain) {
      proposal.votes.abstain = proposal.votes.abstain.add(weight);
    } else if (value == VoteValue.Yes) {
      proposal.votes.yes = proposal.votes.yes.add(weight);
    } else if (value == VoteValue.No) {
      proposal.votes.no = proposal.votes.no.add(weight);
    }
    voteRecord.proposalId = proposalId;
    voteRecord.value = value;
    if (proposal.timestamp > voter.mostRecentReferendumProposal) {
      voter.mostRecentReferendumProposal = proposalId;
    }
    emit ProposalVoted(proposalId, account, uint256(value), weight);
    return true;
  }
  /* solhint-enable code-complexity */

  /**
   * @notice Executes a proposal in the execution stage, removing it from `dequeued`.
   * @param proposalId The ID of the proposal to vote on.
   * @param index The index of the proposal ID in `dequeued`.
   * @return Whether or not the proposal was executed successfully.
   * @dev Does not remove the proposal if the execution fails.
   */
  function execute(uint256 proposalId, uint256 index) external returns (bool) {
    dequeueProposalsIfReady();
    Proposal storage proposal = proposals[proposalId];
    require(_proposalExists(proposal) && dequeued[index] == proposalId);
    bool expired = isDequeuedProposalExpired(proposal);
    if (!expired) {
      // TODO(asa): Think through the effects of changing the passing function
      ProposalStage stage = _getDequeuedProposalStage(proposal.timestamp);
      require(
        proposal.approved &&
        stage == ProposalStage.Execution &&
        _isProposalPassing(proposal)
      );
      for (uint256 i = 0; i < proposal.transactions.length; i = i.add(1)) {
        bool transactionExecuted = externalCall(
          proposal.transactions[i].destination,
          proposal.transactions[i].value,
          proposal.transactions[i].data.length,
          proposal.transactions[i].data
        );
        // reverts proposal if any transaction fails
        require(transactionExecuted, "all transactions must succeed");
      }
      emit ProposalExecuted(
        proposalId
      );
    }
    // proposal must have executed fully or expired if this point reached
    deleteDequeuedProposal(proposal, proposalId, index);
    return !expired;
  }

  /**
   * @notice Withdraws refunded Celo Gold deposits.
   * @return Whether or not the withdraw was successful.
   */
  function withdraw() external nonReentrant returns (bool) {
    uint256 value = refundedDeposits[msg.sender];
    require(value > 0 && value <= address(this).balance);
    refundedDeposits[msg.sender] = 0;
    msg.sender.transfer(value);
    return true;
  }

  /**
   * @notice Returns the number of seconds proposals stay in the approval stage.
   * @return The number of seconds proposals stay in the approval stage.
   */
  function getApprovalStageDuration() external view returns (uint256) {
    return stageDurations.approval;
  }

  /**
   * @notice Returns the number of seconds proposals stay in the referendum stage.
   * @return The number of seconds proposals stay in the referendum stage.
   */
  function getReferendumStageDuration() external view returns (uint256) {
    return stageDurations.referendum;
  }

  /**
   * @notice Returns the number of seconds proposals stay in the execution stage.
   * @return The number of seconds proposals stay in the execution stage.
   */
  function getExecutionStageDuration() external view returns (uint256) {
    return stageDurations.execution;
  }

  /**
   * @notice Returns the constitution for a particular destination and function ID.
   * @param destination The destination address to get the constitution for.
   * @param functionId The function ID to get the constitution for, zero for the destination
   *   default.
   * @return The ratio of yes:no votes needed in order to pass the proposal.
   */
  function getConstitution(
    address destination,
    bytes4 functionId
  )
    external
    view
    returns (uint256, uint256, uint256, uint256)
  {
    ThresholdParameters memory thresholdParameters = _getConstitution(destination, functionId);
    return (
      thresholdParameters.baseThreshold.numerator,
      thresholdParameters.baseThreshold.denominator,
      thresholdParameters.kFactor.numerator,
      thresholdParameters.kFactor.denominator);
  }

  /**
   * @notice Returns whether or not a proposal exists.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal exists.
   */
  function proposalExists(uint256 proposalId) external view returns (bool) {
    Proposal storage proposal = proposals[proposalId];
    return _proposalExists(proposal);
  }

  /**
   * @notice Returns an unpacked proposal struct with its transaction count.
   * @param proposalId The ID of the proposal to unpack.
   * @return The unpacked proposal with its transaction count.
   */
  function getProposal(
    uint256 proposalId
  )
    external
    view
    returns (address, uint256, uint256, uint256)
  {
    Proposal storage proposal = proposals[proposalId];
    return (
      proposal.proposer,
      proposal.deposit,
      proposal.timestamp,
      proposal.transactions.length
    );
  }

  /**
   * @notice Returns a specified transaction in a proposal.
   * @param proposalId The ID of the proposal to query.
   * @param index The index of the specified transaction in the proposal's transaction list.
   * @return The specified transaction.
   */
  function getProposalTransaction(
    uint256 proposalId,
    uint256 index
  )
    external
    view
    returns (uint256, address, bytes memory)
  {
    Proposal storage proposal = proposals[proposalId];
    require(index < proposal.transactions.length, "transaction index out of bounds");
    return (
      proposal.transactions[index].value,
      proposal.transactions[index].destination,
      proposal.transactions[index].data
    );
  }

  /**
   * @notice Returns whether or not a proposal has been approved.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal has been approved.
   */
  function isApproved(uint256 proposalId) external view returns (bool) {
    return proposals[proposalId].approved;
  }

  /**
   * @notice Returns the referendum vote totals for a proposal.
   * @param proposalId The ID of the proposal.
   * @return The yes, no, and abstain vote totals.
   */
  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256) {
    Proposal storage proposal = proposals[proposalId];
    return (proposal.votes.yes, proposal.votes.no, proposal.votes.abstain);
  }

  /**
   * @notice Returns an accounts vote record on a particular index in `dequeued`.
   * @param account The address of the account to get the record for.
   * @param index The index in `dequeued`.
   * @return The corresponding proposal ID and vote value.
   */
  function getVoteRecord(address account, uint256 index) external view returns (uint256, uint256) {
    VoteRecord storage record = voters[account].referendumVotes[index];
    return (record.proposalId, uint256(record.value));
  }

  /**
   * @notice Returns the number of proposals in the queue.
   * @return The number of proposals in the queue.
   */
  function getQueueLength() external view returns (uint256) {
    return queue.list.numElements;
  }

  /**
   * @notice Returns the number of upvotes the queued proposal has received.
   * @param proposalId The ID of the proposal.
   * @return The number of upvotes a queued proposal has received.
   */
  function getUpvotes(uint256 proposalId) external view returns (uint256) {
    require(isQueued(proposalId));
    return queue.getValue(proposalId);
  }

  /**
   * @notice Returns the proposal ID and upvote total for all queued proposals.
   * @return The proposal ID and upvote total for all queued proposals.
   * @dev Note that this includes expired proposals that have yet to be removed from the queue.
   */
  function getQueue() external view returns (uint256[] memory, uint256[] memory) {
    return queue.getElements();
  }

  /**
   * @notice Returns the dequeued proposal IDs.
   * @return The dequeued proposal IDs.
   */
  function getDequeue() external view returns (uint256[] memory) {
    return dequeued;
  }

  /**
   * @notice Returns the ID of the proposal upvoted by `account`.
   * @param account The address of the account.
   * @return The ID of the proposal upvoted by `account`.
   */
  function getUpvotedProposal(address account) external view returns (uint256) {
    return voters[account].upvotedProposal;
  }

  /**
   * @notice Returns the ID of the most recently dequeued proposal voted on by `account`.
   * @param account The address of the account.
   * @return The ID of the most recently dequeued proposal voted on by `account`..
   */
  function getMostRecentReferendumProposal(address account) external view returns (uint256) {
    return voters[account].mostRecentReferendumProposal;
  }

  /**
   * @notice Returns whether or not a particular account is voting on proposals.
   * @param account The address of the account.
   * @return Whether or not the account is voting on proposals.
   */
  function isVoting(address account) external view returns (bool) {
    Voter storage voter = voters[account];
    bool isVotingQueue = voter.upvotedProposal != 0 && isQueued(voter.upvotedProposal);
    Proposal storage proposal = proposals[voter.mostRecentReferendumProposal];
    bool isVotingReferendum = (
      _getDequeuedProposalStage(proposal.timestamp) == ProposalStage.Referendum
    );
    return isVotingQueue || isVotingReferendum;
  }

  /**
   * @notice Removes the proposals with the most upvotes from the queue, moving them to the
   *   approval stage.
   * @dev If any of the top proposals have expired, they are deleted.
   */
  function dequeueProposalsIfReady() public {
    // solhint-disable-next-line not-rely-on-time
    if (now >= lastDequeue.add(dequeueFrequency)) {
      uint256 numProposalsToDequeue = Math.min(concurrentProposals, queue.list.numElements);
      uint256[] memory dequeuedIds = queue.popN(numProposalsToDequeue);
      for (uint256 i = 0; i < numProposalsToDequeue; i = i.add(1)) {
        uint256 proposalId = dequeuedIds[i];
        Proposal storage proposal = proposals[proposalId];
        // solhint-disable-next-line not-rely-on-time
        if (now >= proposal.timestamp.add(queueExpiry)) {
          emit ProposalExpired(proposalId);
          continue;
        }
        refundedDeposits[proposal.proposer] = refundedDeposits[proposal.proposer].add(
          proposal.deposit
        );
        // solhint-disable-next-line not-rely-on-time
        proposal.timestamp = now;
        if (emptyIndices.length > 0) {
          uint256 indexOfLastEmptyIndex = emptyIndices.length.sub(1);
          dequeued[emptyIndices[indexOfLastEmptyIndex]] = proposalId;
          // TODO(asa): We can save gas by not deleting here
          delete emptyIndices[indexOfLastEmptyIndex];
          emptyIndices.length = indexOfLastEmptyIndex;
        } else {
          dequeued.push(proposalId);
        }
        // solhint-disable-next-line not-rely-on-time
        emit ProposalDequeued(proposalId, now);
      }
      // solhint-disable-next-line not-rely-on-time
      lastDequeue = now;
    }
  }

  /**
   * @notice Returns whether or not a proposal is in the queue.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal is in the queue.
   */
  function isQueued(uint256 proposalId) public view returns (bool) {
    // solhint-disable-next-line not-rely-on-time
    return queue.contains(proposalId) && now < proposals[proposalId].timestamp.add(queueExpiry);
  }

  /**
   * @notice Returns whether or not a particular proposal is passing according to the constitution.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal is passing.
   */
  function isProposalPassing(uint256 proposalId) external view returns (bool) {
    Proposal storage proposal = proposals[proposalId];
    return _isProposalPassing(proposal);
  }

  /**
   * @notice Returns whether or not a particular proposal is passing according to the constitution.
   * @param proposal The proposal struct.
   * @return Whether or not the proposal is passing.
   */
  function _isProposalPassing(Proposal storage proposal) private view returns (bool) {
    // supportRatio can be undefined, which is not a problem for isGreaterThan
    FractionUtil.Fraction memory supportRatio = FractionUtil.Fraction(
      proposal.votes.yes,
      proposal.votes.yes.add(proposal.votes.no)
    );
    FractionUtil.Fraction memory threshold = _getProposalThreshold(proposal);
    return supportRatio.isGreaterThan(threshold);
  }

  function getProposalThreshold(uint256 proposalId) external view returns (uint256, uint256) {
    Proposal storage proposal = proposals[proposalId];
    FractionUtil.Fraction memory threshold = _getProposalThreshold(proposal);
    return (threshold.numerator, threshold.denominator);
  }

  function _getProposalThreshold(
    Proposal storage proposal
  )
    private
    view
    returns (FractionUtil.Fraction memory)
  {
    uint256 totalVotes = proposal.votes.yes.add(proposal.votes.no).add(proposal.votes.abstain);
    uint256 totalWeight_ = totalWeight();
    if (totalWeight_ == 0) {
      return FractionUtil.Fraction(0, 0);
    }
    FractionUtil.Fraction memory proposalThreshold = FractionUtil.Fraction(1, 2);
    IQuorum quorum = IQuorum(registry.getAddressForOrDie(QUORUM_REGISTRY_ID));
    for (uint256 i = 0; i < proposal.transactions.length; i = i.add(1)) {
      bytes4 functionId = extractFunctionSignature(proposal.transactions[i].data);
      ThresholdParameters memory thresholdParameters = _getConstitution(
        proposal.transactions[i].destination,
        functionId
      );
      (uint256 thresholdNumerator, uint256 thresholdDenominator) = quorum.threshold(
        totalVotes,
        totalWeight_,
        thresholdParameters.baseThreshold.numerator,
        thresholdParameters.baseThreshold.denominator,
        thresholdParameters.kFactor.numerator,
        thresholdParameters.kFactor.denominator
      );
      // threshold can be undefined, not a problem for isLessThan
      FractionUtil.Fraction memory threshold =
        FractionUtil.Fraction(thresholdNumerator, thresholdDenominator);
      if (proposalThreshold.isLessThan(threshold)) {
        proposalThreshold = threshold;
      }
    }
    return proposalThreshold;
  }

  function getDequeuedProposalStage(uint256 dequeueTime) external view returns (ProposalStage) {
    return _getDequeuedProposalStage(dequeueTime);
  }

  /**
   * @notice Returns the stage of a dequeued proposal.
   * @param dequeueTime The timestamp in seconds since epoch of when the proposal was dequeued.
   * @return The stage of the dequeued proposal.
   */
  function _getDequeuedProposalStage(uint256 dequeueTime) private view returns (ProposalStage) {
    // solhint-disable-next-line not-rely-on-time
    if (now >= stageStartTime(dequeueTime, ProposalStage.Expiration)) {
      return ProposalStage.Expiration;
    // solhint-disable-next-line not-rely-on-time
    } else if (now >= stageStartTime(dequeueTime, ProposalStage.Execution)) {
      return ProposalStage.Execution;
    // solhint-disable-next-line not-rely-on-time
    } else if (now >= stageStartTime(dequeueTime, ProposalStage.Referendum)) {
      return ProposalStage.Referendum;
    } else {
      return ProposalStage.Approval;
    }
  }

  /**
   * @notice Returns the starting time for a particular stage.
   * @param dequeueTime The timestamp of when the proposal was dequeued.
   * @param stage The stage to return the start time for.
   * @return The stage start time.
   */
  function stageStartTime(uint256 dequeueTime, ProposalStage stage) public view returns (uint256) {
    if (stage == ProposalStage.Approval) {
      return dequeueTime;
    } else if (stage == ProposalStage.Referendum) {
      return dequeueTime.add(stageDurations.approval);
    } else if (stage == ProposalStage.Execution) {
      return dequeueTime.add(stageDurations.approval).add(stageDurations.referendum);
    } else if (stage == ProposalStage.Expiration) {
      return dequeueTime.add(stageDurations.approval).add(stageDurations.referendum).add(
        stageDurations.execution
      );
    } else {
      require(false);
    }
  }

  /**
   * @notice Deletes a dequeued proposal. Updates quorum if the proposal has been approved
   *   and thus received a referendum.
   * @param proposal The proposal struct.
   * @param proposalId The ID of the proposal to delete.
   * @param index The index of the proposal ID in `dequeued`.
   */
  function deleteDequeuedProposal(
    Proposal storage proposal,
    uint256 proposalId,
    uint256 index
  )
    private
  {
    if (proposal.approved) {
      updateQuorum(proposal);
    }
    dequeued[index] = 0;
    emptyIndices.push(index);
    delete proposals[proposalId];
  }

  /**
   * @notice Updates quorum using the total number of votes on the proposal
   *   and the total network weight.
   * @param proposal The proposal struct.
   */
  function updateQuorum(Proposal storage proposal) private {
    uint256 totalWeight_ = totalWeight();
    if (totalWeight_ > 0) {
      uint256 totalVotes = proposal.votes.yes.add(proposal.votes.no).add(proposal.votes.abstain);
      IQuorum quorum = IQuorum(registry.getAddressForOrDie(QUORUM_REGISTRY_ID));
      quorum.updateQuorumBaseline(totalVotes, totalWeight_);
    }
  }

  /**
   * @notice Extracts the first four bytes of a byte array.
   * @param input The byte array.
   * @return The first four bytes of `input`.
   */
  function extractFunctionSignature(bytes memory input) private pure returns (bytes4) {
    bytes4 output;
    /* solhint-disable no-inline-assembly */
    assembly {
      mstore(output, input)
      mstore(add(output, 4), add(input, 4))
    }
    /* solhint-enable no-inline-assembly */
    return output;
  }

  // TODO(asa): Pass the proposal as an argument for gas optimization
  /**
   * @notice Returns whether or not a dequeued proposal has expired.
   * @param proposal The proposal struct.
   * @return Whether or not the dequeued proposal has expired.
   */
  function isDequeuedProposalExpired(Proposal storage proposal) private view returns (bool) {
    ProposalStage stage = _getDequeuedProposalStage(proposal.timestamp);
    // The proposal is considered expired under the following conditions:
    //   1. Past the approval stage and not approved.
    //   2. Past the referendum stage and not passed.
    //   3. Past the execution stage.
    return (
      (stage > ProposalStage.Execution) ||
      (stage > ProposalStage.Referendum && !_isProposalPassing(proposal)) ||
      (stage > ProposalStage.Approval && !proposal.approved)
    );
  }

  /**
   * @notice Returns whether or not a proposal exists.
   * @param proposal The proposal.
   * @return Whether or not the proposal exists.
   */
  function _proposalExists(Proposal storage proposal) private view returns (bool) {
    return proposal.timestamp > 0;
  }

  /**
   * @notice Returns the constitution for a particular destination and function ID.
   * @param destination The destination address to get the constitution for.
   * @param functionId The function ID to get the constitution for, zero for the destination
   *   default.
   * @return The ratio of yes:no votes needed in order to pass the proposal.
   */
  function _getConstitution(
    address destination,
    bytes4 functionId
  )
    private
    view
    returns (ThresholdParameters memory)
  {
    // Default to a 3/5 supermajority and k = 1/5
    ThresholdParameters memory thresholdParameters =
      ThresholdParameters(FractionUtil.Fraction(3, 5), FractionUtil.Fraction(1, 5));
    if (constitution[destination].functionThresholds[functionId].baseThreshold.exists()) {
      thresholdParameters = constitution[destination].functionThresholds[functionId];
    } else if (constitution[destination].defaultParameters.baseThreshold.exists()) {
      thresholdParameters = constitution[destination].defaultParameters;
    }
    return thresholdParameters;
  }

  // call has been separated into its own function in order to take advantage
  // of the Solidity's code generator to produce a loop that copies tx.data into memory.
  /**
   * @notice Executes a function call.
   * @param value The value of Celo Gold to be sent with the function call.
   * @param destination The destination address of the function call.
   * @param dataLength The length of the data to be included in the function call.
   * @param data The data to be included in the function call.
   */
  function externalCall(
    address destination,
    uint value,
    uint dataLength,
    bytes memory data
  )
    private
    nonReentrant
    returns (bool)
  {
    bool result;
    /* solhint-disable no-inline-assembly */
    assembly {
      /* solhint-disable max-line-length */
      let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
      let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
      result := call(
        sub(gas, 34710),   // 34710 is the value that solidity is currently emitting
                           // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                           // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
        destination,
        value,
        d,
        dataLength,        // Size of the input (in bytes) - this is what fixes the padding problem
        x,
        0                  // Output is ignored, therefore the output size is zero
      )
      /* solhint-enable max-line-length */
    }
    /* solhint-enable no-inline-assembly */
    return result;
  }
}

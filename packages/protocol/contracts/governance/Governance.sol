pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./interfaces/IGovernance.sol";
import "./Proposals.sol";
import "../common/interfaces/IAccounts.sol";
import "../common/ExtractFunctionSignature.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/IntegerSortedLinkedList.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../common/libraries/ReentrancyGuard.sol";

// TODO(asa): Hardcode minimum times for queueExpiry, etc.
/**
 * @title A contract for making, passing, and executing on-chain governance proposals.
 */
contract Governance is
  IGovernance,
  Ownable,
  Initializable,
  ReentrancyGuard,
  UsingRegistry,
  UsingPrecompiles
{
  using Proposals for Proposals.Proposal;
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;
  using IntegerSortedLinkedList for SortedLinkedList.List;
  using BytesLib for bytes;

  uint256 private constant FIXED_HALF = 500000000000000000000000;

  enum VoteValue { None, Abstain, No, Yes }

  struct UpvoteRecord {
    uint256 proposalId;
    uint256 weight;
  }

  struct VoteRecord {
    Proposals.VoteValue value;
    uint256 proposalId;
    uint256 weight;
  }

  struct Voter {
    // Key of the proposal voted for in the proposal queue
    UpvoteRecord upvote;
    uint256 mostRecentReferendumProposal;
    // Maps a `dequeued` index to a voter's vote record.
    mapping(uint256 => VoteRecord) referendumVotes;
  }

  struct ContractConstitution {
    FixidityLib.Fraction defaultThreshold;
    // Maps a function ID to a corresponding threshold, overriding the default.
    mapping(bytes4 => FixidityLib.Fraction) functionThresholds;
  }

  struct HotfixRecord {
    bool executed;
    bool approved;
    uint256 preparedEpoch;
    mapping(address => bool) whitelisted;
  }

  // The baseline is updated as
  // max{floor, (1 - baselineUpdateFactor) * baseline + baselineUpdateFactor * participation}
  struct ParticipationParameters {
    // The average network participation in governance, weighted toward recent proposals.
    FixidityLib.Fraction baseline;
    // The lower bound on the participation baseline.
    FixidityLib.Fraction baselineFloor;
    // The weight of the most recent proposal's participation on the baseline.
    FixidityLib.Fraction baselineUpdateFactor;
    // The proportion of the baseline that constitutes quorum.
    FixidityLib.Fraction baselineQuorumFactor;
  }

  Proposals.StageDurations public stageDurations;
  uint256 public queueExpiry;
  uint256 public dequeueFrequency;
  address public approver;
  uint256 public lastDequeue;
  uint256 public concurrentProposals;
  uint256 public proposalCount;
  uint256 public minDeposit;
  mapping(address => uint256) public refundedDeposits;
  mapping(address => ContractConstitution) private constitution;
  mapping(uint256 => Proposals.Proposal) private proposals;
  mapping(address => Voter) private voters;
  mapping(bytes32 => HotfixRecord) public hotfixes;
  SortedLinkedList.List private queue;
  uint256[] public dequeued;
  uint256[] public emptyIndices;
  ParticipationParameters private participationParameters;

  event ApproverSet(address indexed approver);

  event ConcurrentProposalsSet(uint256 concurrentProposals);

  event MinDepositSet(uint256 minDeposit);

  event QueueExpirySet(uint256 queueExpiry);

  event DequeueFrequencySet(uint256 dequeueFrequency);

  event ApprovalStageDurationSet(uint256 approvalStageDuration);

  event ReferendumStageDurationSet(uint256 referendumStageDuration);

  event ExecutionStageDurationSet(uint256 executionStageDuration);

  event ConstitutionSet(address indexed destination, bytes4 indexed functionId, uint256 threshold);

  event ProposalQueued(
    uint256 indexed proposalId,
    address indexed proposer,
    uint256 transactionCount,
    uint256 deposit,
    uint256 timestamp
  );

  event ProposalUpvoted(uint256 indexed proposalId, address indexed account, uint256 upvotes);

  event ProposalUpvoteRevoked(
    uint256 indexed proposalId,
    address indexed account,
    uint256 revokedUpvotes
  );

  event ProposalDequeued(uint256 indexed proposalId, uint256 timestamp);

  event ProposalApproved(uint256 indexed proposalId);

  event ProposalVoted(
    uint256 indexed proposalId,
    address indexed account,
    uint256 value,
    uint256 weight
  );

  event ProposalExecuted(uint256 indexed proposalId);

  event ProposalExpired(uint256 indexed proposalId);

  event ParticipationBaselineUpdated(uint256 participationBaseline);

  event ParticipationFloorSet(uint256 participationFloor);

  event ParticipationBaselineUpdateFactorSet(uint256 baselineUpdateFactor);

  event ParticipationBaselineQuorumFactorSet(uint256 baselineQuorumFactor);

  event HotfixWhitelisted(bytes32 indexed hash, address whitelister);

  event HotfixApproved(bytes32 indexed hash);

  event HotfixPrepared(bytes32 indexed hash, uint256 indexed epoch);

  event HotfixExecuted(bytes32 indexed hash);

  modifier hotfixNotExecuted(bytes32 hash) {
    require(!hotfixes[hash].executed, "hotfix already executed");
    _;
  }

  modifier onlyApprover() {
    require(msg.sender == approver, "msg.sender not approver");
    _;
  }

  function() external payable {
    require(msg.data.length == 0, "unknown method");
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
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
   * @param participationBaseline The initial value of the participation baseline.
   * @param participationFloor The participation floor.
   * @param baselineUpdateFactor The weight of the new participation in the baseline update rule.
   * @param baselineQuorumFactor The proportion of the baseline that constitutes quorum.
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
    uint256 executionStageDuration,
    uint256 participationBaseline,
    uint256 participationFloor,
    uint256 baselineUpdateFactor,
    uint256 baselineQuorumFactor
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setApprover(_approver);
    setConcurrentProposals(_concurrentProposals);
    setMinDeposit(_minDeposit);
    setQueueExpiry(_queueExpiry);
    setDequeueFrequency(_dequeueFrequency);
    setApprovalStageDuration(approvalStageDuration);
    setReferendumStageDuration(referendumStageDuration);
    setExecutionStageDuration(executionStageDuration);
    setParticipationBaseline(participationBaseline);
    setParticipationFloor(participationFloor);
    setBaselineUpdateFactor(baselineUpdateFactor);
    setBaselineQuorumFactor(baselineQuorumFactor);
    // solhint-disable-next-line not-rely-on-time
    lastDequeue = now;
  }

  /**
   * @notice Updates the address that has permission to approve proposals in the approval stage.
   * @param _approver The address that has permission to approve proposals in the approval stage.
   */
  function setApprover(address _approver) public onlyOwner {
    require(_approver != address(0), "Approver cannot be 0");
    require(_approver != approver, "Approver unchanged");
    approver = _approver;
    emit ApproverSet(_approver);
  }

  /**
   * @notice Updates the number of proposals to dequeue at a time.
   * @param _concurrentProposals The number of proposals to dequeue at at a time.
   */
  function setConcurrentProposals(uint256 _concurrentProposals) public onlyOwner {
    require(_concurrentProposals > 0, "Number of proposals must be larger than zero");
    require(_concurrentProposals != concurrentProposals, "Number of proposals unchanged");
    concurrentProposals = _concurrentProposals;
    emit ConcurrentProposalsSet(_concurrentProposals);
  }

  /**
   * @notice Updates the minimum deposit needed to make a proposal.
   * @param _minDeposit The minimum Celo Gold deposit needed to make a proposal.
   */
  function setMinDeposit(uint256 _minDeposit) public onlyOwner {
    require(_minDeposit > 0, "minDeposit must be larger than 0");
    require(_minDeposit != minDeposit, "Minimum deposit unchanged");
    minDeposit = _minDeposit;
    emit MinDepositSet(_minDeposit);
  }

  /**
   * @notice Updates the number of seconds before a queued proposal expires.
   * @param _queueExpiry The number of seconds a proposal can stay in the queue before expiring.
   */
  function setQueueExpiry(uint256 _queueExpiry) public onlyOwner {
    require(_queueExpiry > 0, "QueueExpiry must be larger than 0");
    require(_queueExpiry != queueExpiry, "QueueExpiry unchanged");
    queueExpiry = _queueExpiry;
    emit QueueExpirySet(_queueExpiry);
  }

  /**
   * @notice Updates the minimum number of seconds before the next batch of proposals can be
   *   dequeued.
   * @param _dequeueFrequency The number of seconds before the next batch of proposals can be
   *   dequeued.
   */
  function setDequeueFrequency(uint256 _dequeueFrequency) public onlyOwner {
    require(_dequeueFrequency > 0, "dequeueFrequency must be larger than 0");
    require(_dequeueFrequency != dequeueFrequency, "dequeueFrequency unchanged");
    dequeueFrequency = _dequeueFrequency;
    emit DequeueFrequencySet(_dequeueFrequency);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the approval stage.
   * @param approvalStageDuration The number of seconds proposals stay in the approval stage.
   */
  function setApprovalStageDuration(uint256 approvalStageDuration) public onlyOwner {
    require(approvalStageDuration > 0, "Duration must be larger than 0");
    require(approvalStageDuration != stageDurations.approval, "Duration unchanged");
    stageDurations.approval = approvalStageDuration;
    emit ApprovalStageDurationSet(approvalStageDuration);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the referendum stage.
   * @param referendumStageDuration The number of seconds proposals stay in the referendum stage.
   */
  function setReferendumStageDuration(uint256 referendumStageDuration) public onlyOwner {
    require(referendumStageDuration > 0, "Duration must be larger than 0");
    require(referendumStageDuration != stageDurations.referendum, "Duration unchanged");
    stageDurations.referendum = referendumStageDuration;
    emit ReferendumStageDurationSet(referendumStageDuration);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the execution stage.
   * @param executionStageDuration The number of seconds proposals stay in the execution stage.
   */
  function setExecutionStageDuration(uint256 executionStageDuration) public onlyOwner {
    require(executionStageDuration > 0, "Duration must be larger than 0");
    require(executionStageDuration != stageDurations.execution, "Duration unchanged");
    stageDurations.execution = executionStageDuration;
    emit ExecutionStageDurationSet(executionStageDuration);
  }

  /**
   * @notice Updates the participation baseline.
   * @param participationBaseline The value of the baseline.
   */
  function setParticipationBaseline(uint256 participationBaseline) public onlyOwner {
    FixidityLib.Fraction memory participationBaselineFrac = FixidityLib.wrap(participationBaseline);
    require(
      FixidityLib.isProperFraction(participationBaselineFrac),
      "Participation baseline greater than one"
    );
    require(
      !participationBaselineFrac.equals(participationParameters.baseline),
      "Participation baseline unchanged"
    );
    participationParameters.baseline = participationBaselineFrac;
    emit ParticipationBaselineUpdated(participationBaseline);
  }

  /**
   * @notice Updates the floor of the participation baseline.
   * @param participationFloor The value at which the baseline is floored.
   */
  function setParticipationFloor(uint256 participationFloor) public onlyOwner {
    FixidityLib.Fraction memory participationFloorFrac = FixidityLib.wrap(participationFloor);
    require(
      FixidityLib.isProperFraction(participationFloorFrac),
      "Participation floor greater than one"
    );
    require(
      !participationFloorFrac.equals(participationParameters.baselineFloor),
      "Participation baseline floor unchanged"
    );
    participationParameters.baselineFloor = participationFloorFrac;
    emit ParticipationFloorSet(participationFloor);
  }

  /**
   * @notice Updates the weight of the new participation in the baseline update rule.
   * @param baselineUpdateFactor The new baseline update factor.
   */
  function setBaselineUpdateFactor(uint256 baselineUpdateFactor) public onlyOwner {
    FixidityLib.Fraction memory baselineUpdateFactorFrac = FixidityLib.wrap(baselineUpdateFactor);
    require(
      FixidityLib.isProperFraction(baselineUpdateFactorFrac),
      "Baseline update factor greater than one"
    );
    require(
      !baselineUpdateFactorFrac.equals(participationParameters.baselineUpdateFactor),
      "Baseline update factor unchanged"
    );
    participationParameters.baselineUpdateFactor = baselineUpdateFactorFrac;
    emit ParticipationBaselineUpdateFactorSet(baselineUpdateFactor);
  }

  /**
   * @notice Updates the proportion of the baseline that constitutes quorum.
   * @param baselineQuorumFactor The new baseline quorum factor.
   */
  function setBaselineQuorumFactor(uint256 baselineQuorumFactor) public onlyOwner {
    FixidityLib.Fraction memory baselineQuorumFactorFrac = FixidityLib.wrap(baselineQuorumFactor);
    require(
      FixidityLib.isProperFraction(baselineQuorumFactorFrac),
      "Baseline quorum factor greater than one"
    );
    require(
      !baselineQuorumFactorFrac.equals(participationParameters.baselineQuorumFactor),
      "Baseline quorum factor unchanged"
    );
    participationParameters.baselineQuorumFactor = baselineQuorumFactorFrac;
    emit ParticipationBaselineQuorumFactorSet(baselineQuorumFactor);
  }

  /**
   * @notice Updates the ratio of yes:yes+no votes needed for a specific class of proposals to pass.
   * @param destination The destination of proposals for which this threshold should apply.
   * @param functionId The function ID of proposals for which this threshold should apply. Zero
   *   will set the default.
   * @param threshold The threshold.
   * @dev If no constitution is explicitly set the default is a simple majority, i.e. 1:2.
   */
  function setConstitution(address destination, bytes4 functionId, uint256 threshold)
    external
    onlyOwner
  {
    require(destination != address(0), "Destination cannot be zero");
    require(
      threshold > FIXED_HALF && threshold <= FixidityLib.fixed1().unwrap(),
      "Threshold has to be greater than majority and not greater than unanimity"
    );
    if (functionId == 0) {
      constitution[destination].defaultThreshold = FixidityLib.wrap(threshold);
    } else {
      constitution[destination].functionThresholds[functionId] = FixidityLib.wrap(threshold);
    }
    emit ConstitutionSet(destination, functionId, threshold);
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
    uint256[] calldata dataLengths,
    string calldata descriptionUrl
  ) external payable returns (uint256) {
    dequeueProposalsIfReady();
    require(msg.value >= minDeposit, "Too small deposit");

    proposalCount = proposalCount.add(1);
    Proposals.Proposal storage proposal = proposals[proposalCount];
    proposal.make(values, destinations, data, dataLengths, msg.sender, msg.value);
    proposal.setDescriptionUrl(descriptionUrl);
    queue.push(proposalCount);
    // solhint-disable-next-line not-rely-on-time
    emit ProposalQueued(proposalCount, msg.sender, proposal.transactions.length, msg.value, now);
    return proposalCount;
  }

  /**
   * @notice Removes a proposal if it is queued and expired.
   * @param proposalId The ID of the proposal to remove.
   * @return Whether the proposal was expired.
   */
  function removeIfQueuedAndExpired(uint256 proposalId) private returns (bool) {
    bool expired = queue.contains(proposalId) && isQueuedProposalExpired(proposalId);
    if (expired) {
      queue.remove(proposalId);
      emit ProposalExpired(proposalId);
    }
    return expired;
  }

  /**
   * @notice Requires a proposal is dequeued and removes it if expired.
   * @param proposalId The ID of the proposal.
   * @return The proposal storage struct and stage corresponding to `proposalId`.
   */
  function requireDequeuedAndDeleteExpired(uint256 proposalId, uint256 index)
    private
    returns (Proposals.Proposal storage, Proposals.Stage)
  {
    Proposals.Proposal storage proposal = proposals[proposalId];
    require(_isDequeuedProposal(proposal, proposalId, index), "Proposal not dequeued");
    Proposals.Stage stage = proposal.getDequeuedStage(stageDurations);
    if (_isDequeuedProposalExpired(proposal, stage)) {
      deleteDequeuedProposal(proposal, proposalId, index);
    }
    return (proposal, stage);
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
  function upvote(uint256 proposalId, uint256 lesser, uint256 greater)
    external
    nonReentrant
    returns (bool)
  {
    // TODO(asa): When upvoting a proposal that will get dequeued, should we let the tx succeed
    // and return false?
    dequeueProposalsIfReady();
    // If acting on an expired proposal, expire the proposal and take no action.
    if (removeIfQueuedAndExpired(proposalId)) {
      return false;
    }

    address account = getAccounts().voteSignerToAccount(msg.sender);
    Voter storage voter = voters[account];
    removeIfQueuedAndExpired(voter.upvote.proposalId);

    // We can upvote a proposal in the queue if we're not already upvoting a proposal in the queue.
    uint256 weight = getLockedGold().getAccountTotalLockedGold(account);
    require(weight > 0, "cannot upvote without locking gold");
    require(queue.contains(proposalId), "cannot upvote a proposal not in the queue");
    require(
      voter.upvote.proposalId == 0 || !queue.contains(voter.upvote.proposalId),
      "cannot upvote more than one queued proposal"
    );
    uint256 upvotes = queue.getValue(proposalId).add(weight);
    queue.update(proposalId, upvotes, lesser, greater);
    voter.upvote = UpvoteRecord(proposalId, weight);
    emit ProposalUpvoted(proposalId, account, weight);
    return true;
  }

  /**
   * @notice Returns stage of governance process given proposal is in
   * @param proposalId The ID of the proposal to query.
   * @return proposal stage
   */
  function getProposalStage(uint256 proposalId) external view returns (Proposals.Stage) {
    if (proposalId == 0 || proposalId > proposalCount) {
      return Proposals.Stage.None;
    } else if (isQueued(proposalId)) {
      return Proposals.Stage.Queued;
    } else {
      return proposals[proposalId].getDequeuedStage(stageDurations);
    }
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
  function revokeUpvote(uint256 lesser, uint256 greater) external nonReentrant returns (bool) {
    dequeueProposalsIfReady();
    address account = getAccounts().voteSignerToAccount(msg.sender);
    Voter storage voter = voters[account];
    uint256 proposalId = voter.upvote.proposalId;
    // TODO(yorke): clean up redundant computation
    require(proposalId != 0, "Account has no historical upvote");
    removeIfQueuedAndExpired(proposalId);
    if (queue.contains(proposalId)) {
      queue.update(
        proposalId,
        queue.getValue(proposalId).sub(voter.upvote.weight),
        lesser,
        greater
      );
      emit ProposalUpvoteRevoked(proposalId, account, voter.upvote.weight);
    }
    voter.upvote = UpvoteRecord(0, 0);
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
  function approve(uint256 proposalId, uint256 index) external onlyApprover returns (bool) {
    dequeueProposalsIfReady();
    (Proposals.Proposal storage proposal, Proposals.Stage stage) = requireDequeuedAndDeleteExpired(
      proposalId,
      index
    );
    if (!proposal.exists()) {
      return false;
    }

    require(!proposal.isApproved(), "Proposal already approved");
    require(stage == Proposals.Stage.Approval, "Proposal not in approval stage");
    proposal.approved = true;
    // Ensures networkWeight is set by the end of the Referendum stage, even if 0 votes are cast.
    proposal.networkWeight = getLockedGold().getTotalLockedGold();
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
  function vote(uint256 proposalId, uint256 index, Proposals.VoteValue value)
    external
    nonReentrant
    returns (bool)
  {
    dequeueProposalsIfReady();
    (Proposals.Proposal storage proposal, Proposals.Stage stage) = requireDequeuedAndDeleteExpired(
      proposalId,
      index
    );
    if (!proposal.exists()) {
      return false;
    }

    address account = getAccounts().voteSignerToAccount(msg.sender);
    Voter storage voter = voters[account];
    uint256 weight = getLockedGold().getAccountTotalLockedGold(account);
    require(proposal.isApproved(), "Proposal not approved");
    require(stage == Proposals.Stage.Referendum, "Incorrect proposal state");
    require(value != Proposals.VoteValue.None, "Vote value unset");
    require(weight > 0, "Voter weight zero");
    VoteRecord storage voteRecord = voter.referendumVotes[index];
    proposal.updateVote(
      voteRecord.weight,
      weight,
      (voteRecord.proposalId == proposalId) ? voteRecord.value : Proposals.VoteValue.None,
      value
    );
    proposal.networkWeight = getLockedGold().getTotalLockedGold();
    voter.referendumVotes[index] = VoteRecord(value, proposalId, weight);
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
  function execute(uint256 proposalId, uint256 index) external nonReentrant returns (bool) {
    dequeueProposalsIfReady();
    (Proposals.Proposal storage proposal, Proposals.Stage stage) = requireDequeuedAndDeleteExpired(
      proposalId,
      index
    );
    bool notExpired = proposal.exists();
    if (notExpired) {
      require(
        stage == Proposals.Stage.Execution && _isProposalPassing(proposal),
        "Proposal not in execution stage or not passing"
      );
      proposal.execute();
      emit ProposalExecuted(proposalId);
      deleteDequeuedProposal(proposal, proposalId, index);
    }
    return notExpired;
  }

  /**
   * @notice Approves the hash of a hotfix transaction(s).
   * @param hash The abi encoded keccak256 hash of the hotfix transaction(s) to be approved.
   */
  function approveHotfix(bytes32 hash) external hotfixNotExecuted(hash) onlyApprover {
    hotfixes[hash].approved = true;
    emit HotfixApproved(hash);
  }

  /**
   * @notice Returns whether given hotfix hash has been whitelisted by given address.
   * @param hash The abi encoded keccak256 hash of the hotfix transaction(s) to be whitelisted.
   * @param whitelister Address to check whitelist status of.
   */
  function isHotfixWhitelistedBy(bytes32 hash, address whitelister) public view returns (bool) {
    return hotfixes[hash].whitelisted[whitelister];
  }

  /**
   * @notice Whitelists the hash of a hotfix transaction(s).
   * @param hash The abi encoded keccak256 hash of the hotfix transaction(s) to be whitelisted.
   */
  function whitelistHotfix(bytes32 hash) external hotfixNotExecuted(hash) {
    hotfixes[hash].whitelisted[msg.sender] = true;
    emit HotfixWhitelisted(hash, msg.sender);
  }

  /**
   * @notice Gives hotfix a prepared epoch for execution.
   * @param hash The hash of the hotfix to be prepared.
   */
  function prepareHotfix(bytes32 hash) external hotfixNotExecuted(hash) {
    require(isHotfixPassing(hash), "hotfix not whitelisted by 2f+1 validators");
    uint256 epoch = getEpochNumber();
    require(hotfixes[hash].preparedEpoch < epoch, "hotfix already prepared for this epoch");
    hotfixes[hash].preparedEpoch = epoch;
    emit HotfixPrepared(hash, epoch);
  }

  /**
   * @notice Executes a whitelisted proposal.
   * @param values The values of Celo Gold to be sent in the proposed transactions.
   * @param destinations The destination addresses of the proposed transactions.
   * @param data The concatenated data to be included in the proposed transactions.
   * @param dataLengths The lengths of each transaction's data.
   * @param salt Arbitrary salt associated with hotfix which guarantees uniqueness of hash.
   * @dev Reverts if hotfix is already executed, not approved, or not prepared for current epoch.
   */
  function executeHotfix(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    bytes32 salt
  ) external {
    bytes32 hash = keccak256(abi.encode(values, destinations, data, dataLengths, salt));

    (bool approved, bool executed, uint256 preparedEpoch) = getHotfixRecord(hash);
    require(!executed, "hotfix already executed");
    require(approved, "hotfix not approved");
    require(preparedEpoch == getEpochNumber(), "hotfix must be prepared for this epoch");

    Proposals.makeMem(values, destinations, data, dataLengths, msg.sender, 0).executeMem();

    hotfixes[hash].executed = true;
    emit HotfixExecuted(hash);
  }

  /**
   * @notice Withdraws refunded Celo Gold deposits.
   * @return Whether or not the withdraw was successful.
   */
  function withdraw() external nonReentrant returns (bool) {
    uint256 value = refundedDeposits[msg.sender];
    require(value > 0, "Nothing to withdraw");
    require(value <= address(this).balance, "Inconsistent balance");
    refundedDeposits[msg.sender] = 0;
    msg.sender.transfer(value);
    return true;
  }

  /**
   * @notice Returns whether or not a particular account is voting on proposals.
   * @param account The address of the account.
   * @return Whether or not the account is voting on proposals.
   */
  function isVoting(address account) external view returns (bool) {
    Voter storage voter = voters[account];
    uint256 upvotedProposal = voter.upvote.proposalId;
    bool isVotingQueue = upvotedProposal != 0 && isQueued(upvotedProposal);
    Proposals.Proposal storage proposal = proposals[voter.mostRecentReferendumProposal];
    bool isVotingReferendum = (proposal.getDequeuedStage(stageDurations) ==
      Proposals.Stage.Referendum);
    return isVotingQueue || isVotingReferendum;
  }

  /**
   * @notice Returns the number of seconds proposals stay in approval stage.
   * @return The number of seconds proposals stay in approval stage.
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
   * @notice Returns the participation parameters.
   * @return The participation parameters.
   */
  function getParticipationParameters() external view returns (uint256, uint256, uint256, uint256) {
    return (
      participationParameters.baseline.unwrap(),
      participationParameters.baselineFloor.unwrap(),
      participationParameters.baselineUpdateFactor.unwrap(),
      participationParameters.baselineQuorumFactor.unwrap()
    );
  }

  /**
   * @notice Returns whether or not a proposal exists.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal exists.
   */
  function proposalExists(uint256 proposalId) external view returns (bool) {
    return proposals[proposalId].exists();
  }

  /**
   * @notice Returns an unpacked proposal struct with its transaction count.
   * @param proposalId The ID of the proposal to unpack.
   * @return The unpacked proposal with its transaction count.
   */
  function getProposal(uint256 proposalId)
    external
    view
    returns (address, uint256, uint256, uint256, string memory)
  {
    return proposals[proposalId].unpack();
  }

  /**
   * @notice Returns a specified transaction in a proposal.
   * @param proposalId The ID of the proposal to query.
   * @param index The index of the specified transaction in the proposal's transaction list.
   * @return The specified transaction.
   */
  function getProposalTransaction(uint256 proposalId, uint256 index)
    external
    view
    returns (uint256, address, bytes memory)
  {
    return proposals[proposalId].getTransaction(index);
  }

  /**
   * @notice Returns whether or not a proposal has been approved.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal has been approved.
   */
  function isApproved(uint256 proposalId) external view returns (bool) {
    return proposals[proposalId].isApproved();
  }

  /**
   * @notice Returns the referendum vote totals for a proposal.
   * @param proposalId The ID of the proposal.
   * @return The yes, no, and abstain vote totals.
   */
  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256) {
    return proposals[proposalId].getVoteTotals();
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
    require(isQueued(proposalId), "Proposal not queued");
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
   * @dev Note that this includes unused indices with proposalId == 0 from deleted proposals.
   */
  function getDequeue() external view returns (uint256[] memory) {
    return dequeued;
  }

  /**
   * @notice Returns the ID of the proposal upvoted by `account` and the weight of that upvote.
   * @param account The address of the account.
   * @return The ID of the proposal upvoted by `account` and the weight of that upvote.
   */
  function getUpvoteRecord(address account) external view returns (uint256, uint256) {
    UpvoteRecord memory upvoteRecord = voters[account].upvote;
    return (upvoteRecord.proposalId, upvoteRecord.weight);
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
   * @notice Returns number of validators from current set which have whitelisted the given hotfix.
   * @param hash The abi encoded keccak256 hash of the hotfix transaction.
   * @return Whitelist tally
   */
  function hotfixWhitelistValidatorTally(bytes32 hash) public view returns (uint256) {
    uint256 tally = 0;
    uint256 n = numberValidatorsInCurrentSet();
    IAccounts accounts = getAccounts();
    for (uint256 i = 0; i < n; i = i.add(1)) {
      address validatorSigner = validatorSignerAddressFromCurrentSet(i);
      address validatorAccount = accounts.signerToAccount(validatorSigner);
      if (
        isHotfixWhitelistedBy(hash, validatorSigner) ||
        isHotfixWhitelistedBy(hash, validatorAccount)
      ) {
        tally = tally.add(1);
      }
    }
    return tally;
  }

  /**
   * @notice Checks if a byzantine quorum of validators has whitelisted the given hotfix.
   * @param hash The abi encoded keccak256 hash of the hotfix transaction.
   * @return Whether validator whitelist tally >= validator byzantine quorum
   */
  function isHotfixPassing(bytes32 hash) public view returns (bool) {
    return hotfixWhitelistValidatorTally(hash) >= minQuorumSizeInCurrentSet();
  }

  /**
   * @notice Gets information about a hotfix.
   * @param hash The abi encoded keccak256 hash of the hotfix transaction.
   * @return Hotfix tuple of (approved, executed, preparedEpoch)
   */
  function getHotfixRecord(bytes32 hash) public view returns (bool, bool, uint256) {
    return (hotfixes[hash].approved, hotfixes[hash].executed, hotfixes[hash].preparedEpoch);
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
        Proposals.Proposal storage proposal = proposals[proposalId];
        if (_isQueuedProposalExpired(proposal)) {
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
    return queue.contains(proposalId) && !isQueuedProposalExpired(proposalId);
  }

  /**
   * @notice Returns whether or not a particular proposal is passing according to the constitution
   *   and the participation levels.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal is passing.
   */
  function isProposalPassing(uint256 proposalId) external view returns (bool) {
    return _isProposalPassing(proposals[proposalId]);
  }

  /**
   * @notice Returns whether or not a particular proposal is passing according to the constitution
   *   and the participation levels.
   * @param proposal The proposal struct.
   * @return Whether or not the proposal is passing.
   */
  function _isProposalPassing(Proposals.Proposal storage proposal) private view returns (bool) {
    FixidityLib.Fraction memory support = proposal.getSupportWithQuorumPadding(
      participationParameters.baseline.multiply(participationParameters.baselineQuorumFactor)
    );
    for (uint256 i = 0; i < proposal.transactions.length; i = i.add(1)) {
      bytes4 functionId = ExtractFunctionSignature.extractFunctionSignature(
        proposal.transactions[i].data
      );
      FixidityLib.Fraction memory threshold = _getConstitution(
        proposal.transactions[i].destination,
        functionId
      );
      if (support.lte(threshold)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @notice Returns whether a proposal is dequeued at the given index.
   * @param proposalId The ID of the proposal.
   * @param index The index of the proposal ID in `dequeued`.
   * @return Whether the proposal is in `dequeued`.
   */
  function isDequeuedProposal(uint256 proposalId, uint256 index) external view returns (bool) {
    return _isDequeuedProposal(proposals[proposalId], proposalId, index);
  }

  /**
   * @notice Returns whether a proposal is dequeued at the given index.
   * @param proposal The proposal struct.
   * @param proposalId The ID of the proposal.
   * @param index The index of the proposal ID in `dequeued`.
   * @return Whether the proposal is in `dequeued` at index.
   */
  function _isDequeuedProposal(
    Proposals.Proposal storage proposal,
    uint256 proposalId,
    uint256 index
  ) private view returns (bool) {
    require(index < dequeued.length, "Provided index greater than dequeue length.");
    return proposal.exists() && dequeued[index] == proposalId;
  }

  /**
   * @notice Returns whether or not a dequeued proposal has expired.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the dequeued proposal has expired.
   */
  function isDequeuedProposalExpired(uint256 proposalId) external view returns (bool) {
    Proposals.Proposal storage proposal = proposals[proposalId];
    return _isDequeuedProposalExpired(proposal, proposal.getDequeuedStage(stageDurations));

  }

  /**
   * @notice Returns whether or not a dequeued proposal has expired.
   * @param proposal The proposal struct.
   * @return Whether or not the dequeued proposal has expired.
   */
  function _isDequeuedProposalExpired(Proposals.Proposal storage proposal, Proposals.Stage stage)
    private
    view
    returns (bool)
  {
    // The proposal is considered expired under the following conditions:
    //   1. Past the approval stage and not approved.
    //   2. Past the referendum stage and not passing.
    //   3. Past the execution stage.
    return ((stage > Proposals.Stage.Execution) ||
      (stage > Proposals.Stage.Referendum && !_isProposalPassing(proposal)) ||
      (stage > Proposals.Stage.Approval && !proposal.isApproved()));
  }

  /**
   * @notice Returns whether or not a queued proposal has expired.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the dequeued proposal has expired.
   */
  function isQueuedProposalExpired(uint256 proposalId) public view returns (bool) {
    return _isQueuedProposalExpired(proposals[proposalId]);
  }

  /**
   * @notice Returns whether or not a queued proposal has expired.
   * @param proposal The proposal struct.
   * @return Whether or not the dequeued proposal has expired.
   */
  function _isQueuedProposalExpired(Proposals.Proposal storage proposal)
    private
    view
    returns (bool)
  {
    // solhint-disable-next-line not-rely-on-time
    return now >= proposal.timestamp.add(queueExpiry);
  }

  /**
   * @notice Deletes a dequeued proposal.
   * @param proposal The proposal struct.
   * @param proposalId The ID of the proposal to delete.
   * @param index The index of the proposal ID in `dequeued`.
   * @dev Must always be preceded by `isDequeuedProposal`, which checks `index`.
   */
  function deleteDequeuedProposal(
    Proposals.Proposal storage proposal,
    uint256 proposalId,
    uint256 index
  ) private {
    if (proposal.isApproved() && proposal.networkWeight > 0) {
      updateParticipationBaseline(proposal);
    }
    dequeued[index] = 0;
    emptyIndices.push(index);
    delete proposals[proposalId];
  }

  /**
   * @notice Updates the participation baseline based on the proportion of BondedDeposit weight
   *   that participated in the proposal's Referendum stage.
   * @param proposal The proposal struct.
   */
  function updateParticipationBaseline(Proposals.Proposal storage proposal) private {
    FixidityLib.Fraction memory participation = proposal.getParticipation();
    FixidityLib.Fraction memory participationComponent = participation.multiply(
      participationParameters.baselineUpdateFactor
    );
    FixidityLib.Fraction memory baselineComponent = participationParameters.baseline.multiply(
      FixidityLib.fixed1().subtract(participationParameters.baselineUpdateFactor)
    );
    participationParameters.baseline = participationComponent.add(baselineComponent);
    if (participationParameters.baseline.lt(participationParameters.baselineFloor)) {
      participationParameters.baseline = participationParameters.baselineFloor;
    }
    emit ParticipationBaselineUpdated(participationParameters.baseline.unwrap());
  }

  /**
   * @notice Returns the constitution for a particular destination and function ID.
   * @param destination The destination address to get the constitution for.
   * @param functionId The function ID to get the constitution for, zero for the destination
   *   default.
   * @return The ratio of yes:no votes needed to exceed in order to pass the proposal.
   */
  function getConstitution(address destination, bytes4 functionId) external view returns (uint256) {
    return _getConstitution(destination, functionId).unwrap();
  }

  function _getConstitution(address destination, bytes4 functionId)
    internal
    view
    returns (FixidityLib.Fraction memory)
  {
    // Default to a simple majority.
    FixidityLib.Fraction memory threshold = FixidityLib.wrap(FIXED_HALF);
    if (constitution[destination].functionThresholds[functionId].unwrap() != 0) {
      threshold = constitution[destination].functionThresholds[functionId];
    } else if (constitution[destination].defaultThreshold.unwrap() != 0) {
      threshold = constitution[destination].defaultThreshold;
    }
    return threshold;
  }
}

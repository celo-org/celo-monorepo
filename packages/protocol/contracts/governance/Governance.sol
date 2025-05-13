pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

import "./interfaces/IGovernance.sol";
import "./Proposals.sol";
import "../common/interfaces/IAccounts.sol";
import "../common/ExtractFunctionSignature.sol";
import "../common/Initializable.sol";
import "../common/FixidityLib.sol";
import "../common/linkedlists/IntegerSortedLinkedList.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title A contract for making, passing, and executing on-chain governance proposals.
 */
contract Governance is
  IGovernance,
  ICeloVersionedContract,
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
  using Address for address payable; // prettier-ignore

  enum VoteValue {
    None,
    Abstain,
    No,
    Yes
  }

  struct UpvoteRecord {
    uint256 proposalId;
    uint256 weight;
  }

  struct VoteRecord {
    Proposals.VoteValue deprecated_value; // obsolete
    uint256 proposalId;
    uint256 deprecated_weight; // obsolete
    uint256 yesVotes;
    uint256 noVotes;
    uint256 abstainVotes;
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

  uint256 private constant FIXED_HALF = 500000000000000000000000;

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
  mapping(address => Voter) internal voters;
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

  event ProposalVotedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  );

  event ProposalVoteRevoked(
    uint256 indexed proposalId,
    address indexed account,
    uint256 value,
    uint256 weight
  );

  event ProposalVoteRevokedV2(
    uint256 indexed proposalId,
    address indexed account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
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

  modifier onlyLockedGold() {
    require(msg.sender == address(getLockedGold()), "msg.sender not lockedGold");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry contract.
   * @param _approver The address that needs to approve proposals to move to the referendum stage.
   * @param _concurrentProposals The number of proposals to dequeue at once.
   * @param _minDeposit The minimum CELO deposit needed to make a proposal.
   * @param _queueExpiry The number of seconds a proposal can stay in the queue before expiring.
   * @param _dequeueFrequency The number of seconds before the next batch of proposals can be
   *   dequeued.
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
    setReferendumStageDuration(referendumStageDuration);
    setExecutionStageDuration(executionStageDuration);
    setParticipationBaseline(participationBaseline);
    setParticipationFloor(participationFloor);
    setBaselineUpdateFactor(baselineUpdateFactor);
    setBaselineQuorumFactor(baselineQuorumFactor);
    // solhint-disable-next-line not-rely-on-time
    lastDequeue = now;
  }

  function() external payable {
    require(msg.data.length == 0, "unknown method");
  }

  /**
   * @notice Updates the ratio of yes:yes+no votes needed for a specific class of proposals to pass.
   * @param destination The destination of proposals for which this threshold should apply.
   * @param functionId The function ID of proposals for which this threshold should apply. Zero
   *   will set the default.
   * @param threshold The threshold.
   * @dev If no constitution is explicitly set the default is a simple majority, i.e. 1:2.
   */
  function setConstitution(
    address destination,
    bytes4 functionId,
    uint256 threshold
  ) external onlyOwner {
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
   * @param values The values of CELO to be sent in the proposed transactions.
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
  ) external nonReentrant returns (bool) {
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
    require(
      stage == Proposals.Stage.Referendum || stage == Proposals.Stage.Execution,
      "Proposal not in correct stage"
    );
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
  function vote(
    uint256 proposalId,
    uint256 index,
    Proposals.VoteValue value
  ) external nonReentrant returns (bool) {
    dequeueProposalsIfReady();
    (Proposals.Proposal storage proposal, Proposals.Stage stage) = requireDequeuedAndDeleteExpired(
      proposalId,
      index
    );
    if (!proposal.exists()) {
      return false;
    }

    require(stage == Proposals.Stage.Referendum, "Incorrect proposal state");
    require(value != Proposals.VoteValue.None, "Vote value unset");

    address account = getAccounts().voteSignerToAccount(msg.sender);
    uint256 weight = getLockedGold().getAccountTotalGovernanceVotingPower(account);
    require(weight != 0, "Voter weight zero");

    _vote(
      proposal,
      proposalId,
      index,
      account,
      value == Proposals.VoteValue.Yes ? weight : 0,
      value == Proposals.VoteValue.No ? weight : 0,
      value == Proposals.VoteValue.Abstain ? weight : 0
    );
    return true;
  }

  /**
   * @notice Votes partially on a proposal in the referendum stage.
   * @param proposalId The ID of the proposal to vote on.
   * @param index The index of the proposal ID in `dequeued`.
   * @param yesVotes The yes votes weight.
   * @param noVotes The no votes weight.
   * @param abstainVotes The abstain votes weight.
   * @return Whether or not the vote was cast successfully.
   */
  /* solhint-disable code-complexity */
  function votePartially(
    uint256 proposalId,
    uint256 index,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) external nonReentrant returns (bool) {
    dequeueProposalsIfReady();
    (Proposals.Proposal storage proposal, Proposals.Stage stage) = requireDequeuedAndDeleteExpired(
      proposalId,
      index
    );
    if (!proposal.exists()) {
      return false;
    }

    require(stage == Proposals.Stage.Referendum, "Incorrect proposal state");

    address account = getAccounts().voteSignerToAccount(msg.sender);
    uint256 totalVotingPower = getLockedGold().getAccountTotalGovernanceVotingPower(account);

    require(
      totalVotingPower >= yesVotes.add(noVotes).add(abstainVotes),
      "Voter doesn't have enough locked Celo (formerly known as Celo Gold)"
    );
    _vote(proposal, proposalId, index, account, yesVotes, noVotes, abstainVotes);

    return true;
  }

  /**
   * @notice Revoke votes on all proposals of sender in the referendum stage.
   * @return Whether or not all votes of an account were successfully revoked.
   */
  function revokeVotes() external nonReentrant returns (bool) {
    address account = getAccounts().voteSignerToAccount(msg.sender);
    Voter storage voter = voters[account];
    for (
      uint256 dequeueIndex = 0;
      dequeueIndex < dequeued.length;
      dequeueIndex = dequeueIndex.add(1)
    ) {
      VoteRecord storage voteRecord = voter.referendumVotes[dequeueIndex];

      // Skip proposals where there was no vote cast by the user AND
      // ensure vote record proposal matches identifier of dequeued index proposal.
      if (
        voteRecord.proposalId == dequeued[dequeueIndex] &&
        (voteRecord.yesVotes != 0 ||
          voteRecord.noVotes != 0 ||
          voteRecord.abstainVotes != 0 ||
          voteRecord.deprecated_weight != 0)
      ) {
        (Proposals.Proposal storage proposal, Proposals.Stage stage) =
          requireDequeuedAndDeleteExpired(voteRecord.proposalId, dequeueIndex); // prettier-ignore

        // only revoke from proposals which are still in referendum
        if (stage == Proposals.Stage.Referendum) {
          if (voteRecord.deprecated_weight != 0) {
            // backward compatibility for transition period - this should be deleted later on
            uint256 previousYes = voteRecord.deprecated_value == Proposals.VoteValue.Yes
              ? voteRecord.deprecated_weight
              : 0;
            uint256 previousNo = voteRecord.deprecated_value == Proposals.VoteValue.No
              ? voteRecord.deprecated_weight
              : 0;
            uint256 previousAbstain = voteRecord.deprecated_value == Proposals.VoteValue.Abstain
              ? voteRecord.deprecated_weight
              : 0;
            proposal.updateVote(previousYes, previousNo, previousAbstain, 0, 0, 0);

            proposal.networkWeight = getLockedGold().getTotalLockedGold();
            emit ProposalVoteRevokedV2(
              voteRecord.proposalId,
              account,
              previousYes,
              previousNo,
              previousAbstain
            );
          } else {
            proposal.updateVote(
              voteRecord.yesVotes,
              voteRecord.noVotes,
              voteRecord.abstainVotes,
              0,
              0,
              0
            );
            proposal.networkWeight = getLockedGold().getTotalLockedGold();
            emit ProposalVoteRevokedV2(
              voteRecord.proposalId,
              account,
              voteRecord.yesVotes,
              voteRecord.noVotes,
              voteRecord.abstainVotes
            );
          }
        }

        // always delete dequeue vote records for gas refund as they must be expired or revoked
        delete voter.referendumVotes[dequeueIndex];
      }
    }

    // reset most recent referendum proposal ID to guarantee isVotingReferendum == false
    voter.mostRecentReferendumProposal = 0;
    return true;
  }

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
      require(proposal.isApproved(), "Proposal not approved");
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
   * @param values The values of CELO to be sent in the proposed transactions.
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
   * @notice Withdraws refunded CELO deposits.
   * @return Whether or not the withdraw was successful.
   */
  function withdraw() external nonReentrant returns (bool) {
    uint256 value = refundedDeposits[msg.sender];
    require(value != 0, "Nothing to withdraw");
    require(value <= address(this).balance, "Inconsistent balance");
    refundedDeposits[msg.sender] = 0;
    msg.sender.sendValue(value);
    return true;
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
   * @notice Returns whether a proposal is dequeued at the given index.
   * @param proposalId The ID of the proposal.
   * @param index The index of the proposal ID in `dequeued`.
   * @return Whether the proposal is in `dequeued`.
   */
  function isDequeuedProposal(uint256 proposalId, uint256 index) external view returns (bool) {
    return _isDequeuedProposal(proposals[proposalId], proposalId, index);
  }

  /**
   * @notice Returns whether or not a dequeued proposal has expired.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the dequeued proposal has expired.
   */
  function isDequeuedProposalExpired(uint256 proposalId) external view returns (bool) {
    Proposals.Proposal storage proposal = proposals[proposalId];
    return _isDequeuedProposalExpired(proposal, getProposalDequeuedStage(proposal));
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

  /**
   * @notice Returns whether or not a particular account is voting on proposals.
   * @param account The address of the account.
   * @return Whether or not the account is voting on proposals.
   */
  function isVoting(address account) external view returns (bool) {
    Voter storage voter = voters[account];
    uint256 upvotedProposal = voter.upvote.proposalId;
    bool isVotingQueue = upvotedProposal != 0 &&
      isQueued(upvotedProposal) &&
      !isQueuedProposalExpired(upvotedProposal);
    Proposals.Proposal storage proposal = proposals[voter.mostRecentReferendumProposal];
    bool isVotingReferendum = (getProposalDequeuedStage(proposal) == Proposals.Stage.Referendum);
    return isVotingQueue || isVotingReferendum;
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
   * @return baseline The participation baseline parameter.
   * @return baselineFloor The participation baseline floor parameter.
   * @return baselineUpdateFactor The participation baseline update factor parameter.
   * @return baselineQuorumFactor The participation baseline quorum factor parameter.
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
   * @return proposer
   * @return deposit
   * @return timestamp
   * @return transaction Transaction count.
   * @return description Description url.
   */
  function getProposal(
    uint256 proposalId
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool) {
    return proposals[proposalId].unpack();
  }

  /**
   * @notice Returns a specified transaction in a proposal.
   * @param proposalId The ID of the proposal to query.
   * @param index The index of the specified transaction in the proposal's transaction list.
   * @return value Transaction value.
   * @return destination Transaction destination.
   * @return data Transaction data.
   */
  function getProposalTransaction(
    uint256 proposalId,
    uint256 index
  ) external view returns (uint256, address, bytes memory) {
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
   * @return yes The yes vote totals.
   * @return no The no vote totals.
   * @return abstain The abstain vote totals.
   */
  function getVoteTotals(uint256 proposalId) external view returns (uint256, uint256, uint256) {
    return proposals[proposalId].getVoteTotals();
  }

  /**
   * @notice Returns an accounts vote record on a particular index in `dequeued`.
   * @param account The address of the account to get the record for.
   * @param index The index in `dequeued`.
   * @return The corresponding proposal ID, vote value, and weight.
   * @return The depreciated vote value.
   * @return The deprecieated weight.
   * @return The yes weight.
   * @return The no weight.
   * @return The abstain weight.
   */
  function getVoteRecord(
    address account,
    uint256 index
  ) external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
    VoteRecord storage record = voters[account].referendumVotes[index];
    return (
      record.proposalId,
      uint256(record.deprecated_value),
      record.deprecated_weight,
      record.yesVotes,
      record.noVotes,
      record.abstainVotes
    );
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
   * @return proposalID The proposal ID for all queued proposals.
   * @return total The upvote total for all queued proposals.
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
   * @return The ID of the proposal upvoted by `account`.
   * @return The weight of that upvote.
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
   * @notice Returns stage of governance process given proposal is in
   * @param proposalId The ID of the proposal to query.
   * @return proposal stage
   */
  function getProposalStage(uint256 proposalId) external view returns (Proposals.Stage) {
    if (proposalId == 0 || proposalId > proposalCount) {
      return Proposals.Stage.None;
    }
    Proposals.Proposal storage proposal = proposals[proposalId];
    if (isQueued(proposalId)) {
      return
        _isQueuedProposalExpired(proposal) ? Proposals.Stage.Expiration : Proposals.Stage.Queued;
    } else {
      Proposals.Stage stage = getProposalDequeuedStage(proposal);
      return _isDequeuedProposalExpired(proposal, stage) ? Proposals.Stage.Expiration : stage;
    }
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 4, 1, 1);
  }

  /**
   * @param values The values of CELO to be sent in the proposed transactions.
   * @param destinations The destination addresses of the proposed transactions.
   * @param data The concatenated data to be included in the proposed transactions.
   * @param dataLengths The lengths of each transaction's data.
   * @param salt Arbitrary salt associated with hotfix which guarantees uniqueness of hash.
   * @return The hash of the hotfix.
   */
  function getHotfixHash(
    uint256[] calldata values,
    address[] calldata destinations,
    bytes calldata data,
    uint256[] calldata dataLengths,
    bytes32 salt
  ) external pure returns (bytes32) {
    return keccak256(abi.encode(values, destinations, data, dataLengths, salt));
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
   * @param _concurrentProposals The number of proposals to dequeue at a time.
   */
  function setConcurrentProposals(uint256 _concurrentProposals) public onlyOwner {
    require(_concurrentProposals != 0, "Number of proposals must be larger than zero");
    require(_concurrentProposals != concurrentProposals, "Number of proposals unchanged");
    concurrentProposals = _concurrentProposals;
    emit ConcurrentProposalsSet(_concurrentProposals);
  }

  /**
   * @notice Updates the minimum deposit needed to make a proposal.
   * @param _minDeposit The minimum CELO deposit needed to make a proposal.
   */
  function setMinDeposit(uint256 _minDeposit) public onlyOwner {
    require(_minDeposit != 0, "minDeposit must be larger than 0");
    require(_minDeposit != minDeposit, "Minimum deposit unchanged");
    minDeposit = _minDeposit;
    emit MinDepositSet(_minDeposit);
  }

  /**
   * @notice Updates the number of seconds before a queued proposal expires.
   * @param _queueExpiry The number of seconds a proposal can stay in the queue before expiring.
   */
  function setQueueExpiry(uint256 _queueExpiry) public onlyOwner {
    require(_queueExpiry != 0, "QueueExpiry must be larger than 0");
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
    require(_dequeueFrequency != 0, "dequeueFrequency must be larger than 0");
    require(_dequeueFrequency != dequeueFrequency, "dequeueFrequency unchanged");
    dequeueFrequency = _dequeueFrequency;
    emit DequeueFrequencySet(_dequeueFrequency);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the referendum stage.
   * @param referendumStageDuration The number of seconds proposals stay in the referendum stage.
   */
  function setReferendumStageDuration(uint256 referendumStageDuration) public onlyOwner {
    require(referendumStageDuration != 0, "Duration must be larger than 0");
    require(referendumStageDuration != stageDurations.referendum, "Duration unchanged");
    stageDurations.referendum = referendumStageDuration;
    emit ReferendumStageDurationSet(referendumStageDuration);
  }

  /**
   * @notice Updates the number of seconds proposals stay in the execution stage.
   * @param executionStageDuration The number of seconds proposals stay in the execution stage.
   */
  function setExecutionStageDuration(uint256 executionStageDuration) public onlyOwner {
    require(executionStageDuration != 0, "Duration must be larger than 0");
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
   * @notice Removes the proposals with the most upvotes from the queue, moving them to the
   *   approval stage.
   * @dev If any of the top proposals have expired, they are deleted.
   */
  function dequeueProposalsIfReady() public {
    // solhint-disable-next-line not-rely-on-time
    if (now >= lastDequeue.add(dequeueFrequency)) {
      uint256 numProposalsToDequeue = Math.min(concurrentProposals, queue.list.numElements);
      uint256[] memory dequeuedIds = queue.popN(numProposalsToDequeue);

      bool wasAnyProposalDequeued = false;
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
        if (emptyIndices.length != 0) {
          uint256 indexOfLastEmptyIndex = emptyIndices.length.sub(1);
          dequeued[emptyIndices[indexOfLastEmptyIndex]] = proposalId;
          delete emptyIndices[indexOfLastEmptyIndex];
          emptyIndices.length = indexOfLastEmptyIndex;
        } else {
          dequeued.push(proposalId);
        }
        // solhint-disable-next-line not-rely-on-time
        emit ProposalDequeued(proposalId, now);
        wasAnyProposalDequeued = true;
      }
      if (wasAnyProposalDequeued) {
        // solhint-disable-next-line not-rely-on-time
        lastDequeue = now;
      }
    }
  }

  /**
   * @notice When delegator removes votes from delegatee during the time when delegator is voting
   * for governance proposal, this method will remove votes from voted proposal proportionally.
   * @param account The address of the account.
   * @param newVotingPower The adjusted voting power of delegatee.
   */
  function removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 newVotingPower
  ) public onlyLockedGold {
    _removeVotesWhenRevokingDelegatedVotes(account, newVotingPower);
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
   * @return Hotfix approved.
   * @return Hotfix executed.
   * @return Hotfix preparedEpoch.
   */
  function getHotfixRecord(bytes32 hash) public view returns (bool, bool, uint256) {
    return (hotfixes[hash].approved, hotfixes[hash].executed, hotfixes[hash].preparedEpoch);
  }

  /**
   * @notice Returns whether or not a proposal is in the queue.
   * @dev NOTE: proposal may be expired
   * @param proposalId The ID of the proposal.
   * @return Whether or not the proposal is in the queue.
   */
  function isQueued(uint256 proposalId) public view returns (bool) {
    return queue.contains(proposalId);
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
   * @notice Returns whether or not a queued proposal has expired.
   * @param proposalId The ID of the proposal.
   * @return Whether or not the dequeued proposal has expired.
   */
  function isQueuedProposalExpired(uint256 proposalId) public view returns (bool) {
    return _isQueuedProposalExpired(proposals[proposalId]);
  }

  /**
   * @notice Returns max number of votes cast by an account.
   * @param account The address of the account.
   * @return The total number of votes cast by an account.
   */
  function getAmountOfGoldUsedForVoting(address account) public view returns (uint256) {
    Voter storage voter = voters[account];

    uint256 upvotedProposalId = voter.upvote.proposalId;
    bool isVotingQueue = upvotedProposalId != 0 &&
      isQueued(upvotedProposalId) &&
      !isQueuedProposalExpired(upvotedProposalId);

    if (isVotingQueue) {
      uint256 weight = getLockedGold().getAccountTotalLockedGold(account);
      return weight;
    }

    uint256 maxUsed = 0;
    for (uint256 index = 0; index < dequeued.length; index = index.add(1)) {
      uint256 proposalId = dequeued[index];
      Proposals.Proposal storage proposal = proposals[proposalId];
      bool isVotingReferendum = (getProposalDequeuedStage(proposal) == Proposals.Stage.Referendum);

      if (!isVotingReferendum) {
        continue;
      }

      VoteRecord storage voteRecord = voter.referendumVotes[index];
      // skip if vote record is not for this proposal
      if (voteRecord.proposalId != proposalId) {
        continue;
      }

      uint256 votesCast = voteRecord.yesVotes.add(voteRecord.noVotes).add(voteRecord.abstainVotes);
      maxUsed = Math.max(
        maxUsed,
        // backward compatibility for transition period - this should be updated later on
        votesCast == 0 ? voteRecord.deprecated_weight : votesCast
      );
    }
    return maxUsed;
  }

  /**
   * @notice When delegator removes votes from delegatee during the time when delegator is voting
   * for governance proposal, this method will remove votes from voted proposal proportionally.
   * @param account The address of the account.
   * @param newVotingPower The adjusted voting power of delegatee.
   */
  function _removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 newVotingPower
  ) internal {
    Voter storage voter = voters[account];

    for (uint256 index = 0; index < dequeued.length; index = index.add(1)) {
      uint256 proposalId = dequeued[index];
      Proposals.Proposal storage proposal = proposals[proposalId];
      bool isVotingReferendum = (getProposalDequeuedStage(proposal) == Proposals.Stage.Referendum);

      if (!isVotingReferendum) {
        continue;
      }

      VoteRecord storage voteRecord = voter.referendumVotes[index];

      // skip if vote record is not for this proposal
      if (voteRecord.proposalId != proposalId) {
        delete voter.referendumVotes[index];
        continue;
      }

      uint256 sumOfVotes = voteRecord.yesVotes.add(voteRecord.noVotes).add(voteRecord.abstainVotes);

      if (sumOfVotes > newVotingPower) {
        uint256 toRemove = sumOfVotes.sub(newVotingPower);

        uint256 abstainToRemove = getVotesPortion(toRemove, voteRecord.abstainVotes, sumOfVotes);
        uint256 yesToRemove = getVotesPortion(toRemove, voteRecord.yesVotes, sumOfVotes);
        uint256 noToRemove = getVotesPortion(toRemove, voteRecord.noVotes, sumOfVotes);

        uint256 totalRemoved = abstainToRemove.add(yesToRemove).add(noToRemove);

        uint256 yesVotes = voteRecord.yesVotes.sub(yesToRemove);
        uint256 noVotes = voteRecord.noVotes.sub(noToRemove);
        uint256 abstainVotes = voteRecord.abstainVotes.sub(abstainToRemove);

        if (totalRemoved < toRemove) {
          // in case of rounding error
          uint256 roundingToRemove = toRemove.sub(totalRemoved);

          uint256 toRemoveRounding = Math.min(roundingToRemove, yesVotes);
          yesVotes = yesVotes.sub(toRemoveRounding);
          roundingToRemove = roundingToRemove.sub(toRemoveRounding);

          if (roundingToRemove != 0) {
            toRemoveRounding = Math.min(roundingToRemove, noVotes);
            noVotes = noVotes.sub(toRemoveRounding);
            roundingToRemove = roundingToRemove.sub(toRemoveRounding);
          }

          if (roundingToRemove != 0) {
            toRemoveRounding = Math.min(roundingToRemove, abstainVotes);
            abstainVotes = abstainVotes.sub(toRemoveRounding);
          }
        }

        proposal.updateVote(
          voteRecord.yesVotes,
          voteRecord.noVotes,
          voteRecord.abstainVotes,
          yesVotes,
          noVotes,
          abstainVotes
        );

        voteRecord.abstainVotes = abstainVotes;
        voteRecord.yesVotes = yesVotes;
        voteRecord.noVotes = noVotes;
      }
    }
  }

  function _getConstitution(
    address destination,
    bytes4 functionId
  ) internal view returns (FixidityLib.Fraction memory) {
    // Default to a simple majority.
    FixidityLib.Fraction memory threshold = FixidityLib.wrap(FIXED_HALF);
    if (constitution[destination].functionThresholds[functionId].unwrap() != 0) {
      threshold = constitution[destination].functionThresholds[functionId];
    } else if (constitution[destination].defaultThreshold.unwrap() != 0) {
      threshold = constitution[destination].defaultThreshold;
    }
    return threshold;
  }

  /**
   * @notice Returns the stage of a dequeued proposal.
   * @param proposal The proposal struct.
   * @return The stage of the dequeued proposal.
   * @dev Must be called on a dequeued proposal.
   */
  function getProposalDequeuedStage(
    Proposals.Proposal storage proposal
  ) internal view returns (Proposals.Stage) {
    uint256 stageStartTime = proposal.timestamp.add(stageDurations.referendum).add(
      stageDurations.execution
    );
    // solhint-disable-next-line not-rely-on-time
    if (
      now >= stageStartTime &&
      (proposal.transactions.length != 0 ||
        // proposals with 0 transactions can expire only when not approved or not passing
        !proposal.isApproved() ||
        !_isProposalPassing(proposal))
    ) {
      return Proposals.Stage.Expiration;
    }
    stageStartTime = stageStartTime.sub(stageDurations.execution);
    // solhint-disable-next-line not-rely-on-time
    if (now >= stageStartTime) {
      return Proposals.Stage.Execution;
    }
    return Proposals.Stage.Referendum;
  }

  /**
   * @notice Removes a proposal if it is queued and expired.
   * @param proposalId The ID of the proposal to remove.
   * @return Whether the proposal was removed.
   */
  function removeIfQueuedAndExpired(uint256 proposalId) private returns (bool) {
    if (isQueued(proposalId) && isQueuedProposalExpired(proposalId)) {
      queue.remove(proposalId);
      emit ProposalExpired(proposalId);
      return true;
    }
    return false;
  }

  /**
   * @notice Requires a proposal is dequeued and removes it if expired.
   * @param proposalId The ID of the proposal.
   * @return The proposal storage struct corresponding to `proposalId`.
   * @return The proposal stage corresponding to `proposalId`.
   */
  function requireDequeuedAndDeleteExpired(
    uint256 proposalId,
    uint256 index
  ) private returns (Proposals.Proposal storage, Proposals.Stage) {
    Proposals.Proposal storage proposal = proposals[proposalId];
    require(_isDequeuedProposal(proposal, proposalId, index), "Proposal not dequeued");
    Proposals.Stage stage = getProposalDequeuedStage(proposal);
    if (_isDequeuedProposalExpired(proposal, stage)) {
      deleteDequeuedProposal(proposal, proposalId, index);
      return (proposal, Proposals.Stage.Expiration);
    }
    return (proposal, stage);
  }

  /**
   * @notice Votes on a proposal in the referendum stage.
   * @param proposal The proposal struct.
   * @param proposalId The ID of the proposal to vote on.
   * @param index The index of the proposal ID in `dequeued`.
   * @param account Account based on signer.
   * @param yesVotes The yes votes weight.
   * @param noVotes The no votes weight.
   * @param abstainVotes The abstain votes weight.
   * @return Whether or not the proposal is passing.
   */
  function _vote(
    Proposals.Proposal storage proposal,
    uint256 proposalId,
    uint256 index,
    address account,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) private {
    Voter storage voter = voters[account];

    VoteRecord storage previousVoteRecord = voter.referendumVotes[index];

    if (previousVoteRecord.proposalId != proposalId) {
      // VoteRecord is being stored based on index (in `dequeued`) rather than proposalId.
      // It can happen that user voted on proposal that later gets deleted.
      // VoteRecord will still stay in `referendumVotes` mapping.
      // Once new proposal is created it might get same index as previous proposal.
      // In such case we need to check whether existing VoteRecord is relevant to new
      // proposal of whether it is just left over data.
      proposal.updateVote(0, 0, 0, yesVotes, noVotes, abstainVotes);
    } else if (previousVoteRecord.deprecated_weight != 0) {
      // backward compatibility for transition period - this should be deleted later on
      proposal.updateVote(
        previousVoteRecord.deprecated_value == Proposals.VoteValue.Yes
          ? previousVoteRecord.deprecated_weight
          : 0,
        previousVoteRecord.deprecated_value == Proposals.VoteValue.No
          ? previousVoteRecord.deprecated_weight
          : 0,
        previousVoteRecord.deprecated_value == Proposals.VoteValue.Abstain
          ? previousVoteRecord.deprecated_weight
          : 0,
        yesVotes,
        noVotes,
        abstainVotes
      );
    } else {
      proposal.updateVote(
        previousVoteRecord.yesVotes,
        previousVoteRecord.noVotes,
        previousVoteRecord.abstainVotes,
        yesVotes,
        noVotes,
        abstainVotes
      );
    }

    proposal.networkWeight = getLockedGold().getTotalLockedGold();
    voter.referendumVotes[index] = VoteRecord(
      Proposals.VoteValue.None,
      proposalId,
      0,
      yesVotes,
      noVotes,
      abstainVotes
    );
    if (proposal.timestamp > proposals[voter.mostRecentReferendumProposal].timestamp) {
      voter.mostRecentReferendumProposal = proposalId;
    }

    emit ProposalVotedV2(proposalId, account, yesVotes, noVotes, abstainVotes);
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
    if (proposal.isApproved() && proposal.networkWeight != 0) {
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
   * @notice Returns whether or not a particular proposal is passing according to the constitution
   *   and the participation levels.
   * @param proposal The proposal struct.
   * @return Whether or not the proposal is passing.
   */
  function _isProposalPassing(Proposals.Proposal storage proposal) private view returns (bool) {
    FixidityLib.Fraction memory support = proposal.getSupportWithQuorumPadding(
      participationParameters.baseline.multiply(participationParameters.baselineQuorumFactor)
    );

    if (proposal.transactions.length == 0) {
      // default treshold
      FixidityLib.Fraction memory threshold = _getConstitution(address(0), "");
      return support.gt(threshold);
    }

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
   * @param proposal The proposal struct.
   * @return Whether or not the dequeued proposal has expired.
   */
  function _isDequeuedProposalExpired(
    Proposals.Proposal storage proposal,
    Proposals.Stage stage
  ) private view returns (bool) {
    // The proposal is considered expired under the following conditions:
    //   1. Past the referendum stage and not passing.
    //   2. Past the execution stage.
    return ((stage > Proposals.Stage.Execution) ||
      (stage > Proposals.Stage.Referendum && !_isProposalPassing(proposal)));
  }

  /**
   * @notice Returns whether or not a queued proposal has expired.
   * @param proposal The proposal struct.
   * @return Whether or not the dequeued proposal has expired.
   */
  function _isQueuedProposalExpired(
    Proposals.Proposal storage proposal
  ) private view returns (bool) {
    // solhint-disable-next-line not-rely-on-time
    return now >= proposal.timestamp.add(queueExpiry);
  }

  /**
   * Returns amount of votes that should be removed from delegatee's proposal voting.
   * @param totalToRemove Total votes to be removed.
   * @param votes Yes/no/abstrain votes
   * @param sumOfAllVotes Sum of yes, no, and abstain votes.
   */
  function getVotesPortion(
    uint256 totalToRemove,
    uint256 votes,
    uint256 sumOfAllVotes
  ) private pure returns (uint256) {
    return
      FixidityLib
        .newFixed(totalToRemove)
        .multiply(FixidityLib.newFixedFraction(votes, sumOfAllVotes))
        .fromFixed();
  }
}

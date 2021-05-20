methods {
	
	vote(uint256,uint256,uint8) returns bool
	//initialize(address,uint256)
	
	getProposalSlim(uint256) returns address, uint256, uint256, uint256 envfree	
	getVoteSigner(address) returns address envfree
	getAccountFromVoteSigner(address) returns address envfree
	stageDurations() returns uint256,uint256,uint256 envfree
	getUpvotes(uint256) returns uint256 envfree
	getUpvotedProposal(address) returns uint256 envfree
	getQueueLength() returns uint256 envfree
	proposalCount() returns uint256 envfree
	getDequeuedLength() returns uint256 envfree
	getFromDequeued(uint256) returns uint256 envfree
	queueExpiry() returns uint256 envfree
	isApproved(uint256) returns bool envfree
	isDequeuedProposalExpired(uint256) returns bool envfree
	getNoneVoteEnum() returns uint256 envfree
	getAbstainVoteEnum() returns uint256 envfree
	getYesVoteEnum() returns uint256 envfree
	getNoVoteEnum() returns uint256 envfree
	getTotalLockedGold() returns uint256 envfree
	getVoteTotals(uint256) returns uint256,uint256,uint256 envfree
	approver() returns address envfree
	getVoteRecord(address,uint256) returns uint256, uint256 envfree
}

/* we start by learning which functions are most interesting and may demand careful specification */
rule modifying_stageDuration(method f) filtered { f -> !f.isView } {
	uint256 old1; uint256 old2; uint256 old3;
    old1, old2, old3 = stageDurations();
	
    callArbitrary(f);
  	
    uint256 new1;
	uint256 new2;
	uint256 new3;
	new1, new2, new3 = stageDurations();

    assert old1 == new1 && old2 == new2 && old3 == new3;
}

/**
 * A user should never be able to upvote more than one proposal in the queue
 */
rule no_double_upvote(uint256 p, address u) {
	uint256 _upvotes = getUpvotes(p);
	uint256 _usersUpvotedProposal = getUpvotedProposal(u);
	env e;
	require e.msg.sender == u;
	uint256 lesser; 
    uint256 greater;
	upvote(e, p, lesser, greater);
	uint256 upvotes_ = getUpvotes(p);
	
	assert _usersUpvotedProposal == p => upvotes_ <= _upvotes, 
		"Upvotes increased from ${_upvotes} to ${upvotes_} even though upvoted by user $u who already upvoted $p";
}
/*
rule proposal_id_is_never_zero(method f, uint256 p) {
	// Proposal ID cannot be zero -- i.e., if p did not exist and after f it does, then it cannot be that p==0
	env _e;
	env eF;
	env e_;

	bool _exists = sinvoke proposalExists(_e,p);
	
	calldataarg arg;
	sinvoke f(eF,arg);
	
	bool exists_ = sinvoke proposalExists(e_,p);
	
	assert (!_exists && exists_) => p != 0, "If after executing the method a new proposal was added, then it cannot be zero";
	
	// This does not work since timestamp (evidence for existence) is updated in dequeue. So we need to assert that when proposing, timestamp is non zero, which we did, and that can dequeue only non zero - but that's true because we can't add spurious elements to the list (will check which methods can increase queue size).
}*/

rule can_add_to_queue(method f) {
	env e;

	uint256 _queueLength = sinvoke getQueueLength();
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(e,arg);
	
	uint256 queueLength_ = sinvoke getQueueLength();
	
	assert queueLength_ <= _queueLength, 
		"Method can queue elements - should check separately that cannot queue proposal IDs equal 0";
}

rule proposal_count_monotonic_increasing(method f) {
	// proposal count is monotonic increasing (strictly in propose)
	env e;
	
	uint256 _count = sinvoke proposalCount();
	calldataarg arg;
	require !f.isView;
	sinvoke f(e,arg);

	uint256 count_ = sinvoke proposalCount();
	
	if (f.selector == 1706810016/*propose(uint256[],address[],bytes,uint256[],string).selector*/) {
		assert count_ > _count, "Successful propose must increase proposal count";
		assert count_ > 0, "Proposal cannot be 0"; // this is already obvious - even one proposal will increase count to 1
	}

	assert count_ >= _count, "Proposal count must not decrease";
}

rule may_dequeue(method f, uint256 index) {
	// a utility rule for figuring out which methods could dequeue and whether it's all due to dequeueProposalsIfReady calls.
	env e;
	
	// require index to be valid and to be empty
	require index >= 0;
	uint256 queueLength = sinvoke getDequeuedLength();
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => sinvoke getFromDequeued(index) == 0;
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(e,arg);
	
	uint256 newValueInDequeued = sinvoke getFromDequeued(index);
	
	assert newValueInDequeued == 0, "Method caused a dequeue of proposal $newValueInDequeued to index $index";	
}
rule promote_proposal(method f, uint256 p, uint256 index) {
	/* A proposal should never be able to be promoted from the queue if it was proposed more than queueExpiry seconds ago */
	// Let's say we have an empty index. Then it cannot be filled with a new proposal p if its submit time is more than queueExpiry seconds ago
	env eF;
	
	// p must be non zero
	require p != 0;
	
	// get queue expiry
	uint256 _queueExpiry = sinvoke queueExpiry();
	
	// require index to be valid and to be empty
	require index >= 0;
	uint256 queueLength = sinvoke getDequeuedLength();
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => sinvoke getFromDequeued(index) == 0;
	
	// fetch proposal p timestamp
	uint256 _proposalTimestamp;
	_,_, _proposalTimestamp, _ = sinvoke getProposalSlim(p);
	
	// invoke f
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);

	// deqeued index should contain p now only if eF.block.timestamp is not past p's timestamp+queueExpiry
	assert sinvoke getFromDequeued(index) == p => eF.block.timestamp <= _proposalTimestamp+_queueExpiry, 
		"Managed to promote $p in ${eF.block.timestamp} after proposal timestamp ${_proposalTimestamp} + ${_queueExpiry}";
}


////////////////////// continue from here



rule approval_only_if_promoted_and_allowed(uint256 p, uint256 index) {
	// A proposal should never be able to be approved unless it was promoted from the queue
	env eF;
	
	bool _isProposalApproved = sinvoke isApproved(p);
	bool _isDequeued = sinvoke getFromDequeued(index) == p;
	bool _isExpired = sinvoke isDequeuedProposalExpired(p);
	
	address _approver = sinvoke approver();
	require !_isProposalApproved; // we assume not approved yet
	require !_isExpired; // we also assume it did not expire
		
	sinvoke approve(eF,p,index);
	// should check if dequeued right during approve
	bool isDequeued_ = sinvoke getFromDequeued(index) == p;
	
	bool isProposalApproved_ = sinvoke isApproved(p);
	
	// TODO: what if approve were to delete p from dequeued?
	assert isProposalApproved_ => _isDequeued || (!_isDequeued && isDequeued_), "Cannot approve proposal $p unless $index points to it before approve or during it"; // index has p
	assert isProposalApproved_ => eF.msg.sender == _approver, "Only approver ${_approver} can approve";
	
	// it is possible to guess in advance "index", approve will dequeue it into index?? I would move the check in the code above
}
rule no_referendum_votes_unless_approved(method f, uint256 p) {
	// A proposal should never be able to receive a vote unless it was approved
	env eF;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(p);
	
	// no votes currently
	require _yes == 0 && _no == 0 && _abstain == 0;
	
	bool _isProposalApproved = sinvoke isApproved(p);
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	yes_, no_, abstain_ = sinvoke getVoteTotals(p);
	
	assert (yes_ != 0 || no_ != 0 || abstain_ != 0) => _isProposalApproved, 
		"Cannot move from 0 votes to positive number of yes,no,abstain votes unless proposal $p is approved.";
}
/* The sum of yes votes for a proposal cannot exceed total weight - requires linked BondedDeposits */
// this rule requires linkage of BondedDeposits
rule sum_of_votes_cannot_exceed_total_weight(method f, uint256 p) {
	env eF;
	
	uint256 _totalWeight = sinvoke getTotalLockedGold();
	// TODO: Must make sure that governance is not capable of invoking any function that changes the state of BondedDeposits and specifically totalWeight
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(p);
	
	require _yes+_no+_abstain <= _totalWeight;
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	uint256 totalWeight_ = sinvoke getTotalLockedGold();
	
	uint256 yes_;
	uint256 no_;
	uint256 abstain_;
	yes_, no_, abstain_ = sinvoke getVoteTotals(p);
	
	assert yes_+no_+abstain_ <= totalWeight_, "Sum of votes for a proposal cannot exceed total weight";
}
// TODO: Can a voting user provide weight to multiple proposals?
rule cant_unvote(uint256 deqIndex, uint8 voteValue) {	
	env eF;
	
	uint256 NONE = sinvoke getNoneVoteEnum();
	// get the voting delegate
	address voterDelegate = sinvoke getVoteSigner(eF.msg.sender);
	
	// check if voted
	uint256 p;
	uint256 recordValue;
	p, recordValue = sinvoke getVoteRecord(voterDelegate,deqIndex);
	bool result = sinvoke vote(eF,p,deqIndex,voteValue);
	//bool voteReverted = lastReverted;
	
	uint256 p_;
	uint256 recordValue_;
	p_, recordValue_ = sinvoke getVoteRecord(voterDelegate,deqIndex);
	
	assert voteValue == NONE => (!result && recordValue_ == recordValue)/*|| voteReverted*/, "Cannot vote for none: function either returns false and did not update the vote, or it reverted"; // not voting none. reverting is fine and is encoded by the sinvoke
}
rule cant_vote_twice_with_delegate(uint256 deqIndex, uint8 voteValue) {	
	// If I delegated voting, can I vote? Answer should be no
	env eF;
	
	uint256 NONE = sinvoke getNoneVoteEnum();
	// get the voting delegate
	address voterDelegate = sinvoke getVoteSigner(eF.msg.sender);
	
	require eF.msg.sender != voterDelegate; // account delegates to someone else
	
	// check if voted
	uint256 p;
	uint256 recordValue;
	p, recordValue = sinvoke getVoteRecord(voterDelegate,deqIndex);
	invoke vote(eF,p,deqIndex,voteValue);
	
	assert recordValue != NONE => lastReverted, "Could not succeed if delegate already voted";
}
/*
TODO:
A proposal should never be able to be promoted from the queue if it was not in the top concurrentProposals of upvote received
*/
rule no_promoting_without_upvotes(uint256 p, uint256 index) {
	// Can a proposal be promoted with 0 votes? 
	env _e;
	env eF;
	env e_;
	
	/* would actually want forall index. inrange(index) => dequeued[index] != p but here its suffice to 'pre-guess' the index of the proposal we dequeue */
	// require index to be valid and to be empty
	require index >= 0;
	require p > 0; // proposal 0 is not legal, and cannot happen (we check it)
	uint256 queueLength = sinvoke getDequeuedLength();
	require index <= queueLength || index == queueLength+1; // either an empty index or the next one we push
	// if it's an empty index in the range, then it's empty
	require index <= queueLength => sinvoke getFromDequeued(index) == 0;
	
	uint256 _upvotes = sinvoke getUpvotes(p);
	
	sinvoke dequeueProposalsIfReady(eF);
	assert sinvoke getFromDequeued(index) == p => _upvotes > 0, "Cannot dequeue (promote) proposal $p to index $index unless had some upvotes";
}
rule execute_preconds(uint256 p, uint256 index) {
	// A proposal should never be executable when there are more no votes than yes votes
	// TODO: A proposal should never be executable unless it received a yes:no vote ratio greater than that specified in the constitution
	env _e;
	env eF;
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(p);
	
	bool executeRetval = invoke execute(eF,p,index);
	bool executeReverted = lastReverted;
	
	// TODO: if there are exactly yes==no then should it succeed or not?
	assert _no > _yes => (!executeRetval || executeReverted), "If there are more no votes than yes votes, then we cannot succeed in executing";
	// TODO: may require to make sure that all constitutions demand at least majority
}
rule execute_preconds_non_empty_proposal(uint256 p, uint256 index) {
	// A proposal should never be executable when there are more no votes than yes votes
	// TODO: A proposal should never be executable unless it received a yes:no vote ratio greater than that specified in the constitution
	env eF;
	
	uint256 _numTransactions;
	_, _, _, _numTransactions = sinvoke getProposalSlim(p);
	
	require _numTransactions > 0; // an empty proposal passes regardless of votes
	
	uint256 _yes;
	uint256 _no;
	uint256 _abstain;
	_yes, _no, _abstain = sinvoke getVoteTotals(p);
	
	bool executeRetval = invoke execute(eF,p,index);
	bool executeReverted = lastReverted;
	
	// TODO: if there are exactly yes==no then should it succeed or not?
	assert _no > _yes => (!executeRetval || executeReverted), "If there are more no votes than yes votes, then we cannot succeed in executing";
	// TODO: may require to make sure that all constitutions demand at least majority
}
// proposalId is timestamp
rule approved_proposals_invariants(method f, uint256 p) {
	env _e;
	env eF;
	env e_;
	
	// Existence depends on timestamp, and we assume we are well past 0
	require e_.block.timestamp >= eF.block.timestamp 
			&& eF.block.timestamp >= _e.block.timestamp 
			&& _e.block.timestamp > 0;
			
	bool _doesProposalExist = sinvoke proposalExists(_e,p);
	bool _isApprovedProposal = sinvoke isApproved(p);
	
	require _isApprovedProposal => _doesProposalExist; // if a proposal is approved, it must be existent
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	bool doesProposalExist_ = sinvoke proposalExists(e_,p);
	bool isApprovedProposal_ = sinvoke isApproved(p);
	
	assert isApprovedProposal_ => doesProposalExist_, "An approved proposal must exist";
	assert _isApprovedProposal => isApprovedProposal_ || !doesProposalExist_, "An approved proposal cannot be disproved if it still exists";
}
rule no_double_vote_referendum_all_but_vote(method f, address account, uint256 deqIndex) {
	/* A user that already has a vote record for a dequeued index, cannot make a transaction that will increase the weight of that choice */
	env eF; 
	env eFTime; // same time as eF;
	env e_;
	
	uint256 NONE = sinvoke getNoneVoteEnum();
	uint256 ABSTAIN = sinvoke getAbstainVoteEnum();
	uint256 YES = sinvoke getYesVoteEnum();
	uint256 NO = sinvoke getNoVoteEnum();
	
	uint256 p; // a proposal - let's assume it already exists (required for propose() verification)
	uint256 recordValue;
	p, recordValue = sinvoke getVoteRecord(account,deqIndex);
	uint256 currentProposalCount = sinvoke proposalCount();
	require currentProposalCount >= p;
	
	
	uint256 _yes; uint256 _no; uint256 _abstain;
	_yes,_no,_abstain = sinvoke getVoteTotals(p);
	
	// if can't vote for NONE, then necessarily if record vote is NONE, all votes are zero currently
	require recordValue == NONE => (_yes == 0 && _no == 0 && _abstain == 0);
	
	//require eF.block.timestamp == eFTime.block.timestamp;
	//bool isExpired = sinvoke _isDequeuedProposalExpired(eFTime,p);
	
	calldataarg arg;
	require f.selector != vote(uint256,uint256,uint8).selector;
	require !f.isView;
	require eF.msg.sender == account;
	sinvoke f(eF,arg);
	
	
	uint256 yes_; uint256 no_; uint256 abstain_;
	yes_,no_,abstain_ = sinvoke getVoteTotals(p);
	
	bool doesProposalExist_ = sinvoke proposalExists(e_,p);
	
	// if p expires, then sum of votes is no longer relevant - happens in approve, vote, execute
	assert (recordValue != NONE && doesProposalExist_) => (yes_ + no_ + abstain_) == (_yes + _no + _abstain), "Total votes could not have changed if already voted";
	assert recordValue == YES => yes_ <= _yes, "Yes votes could not have increased if voted yes already";
	assert recordValue == NO => no_ <= _no, "No votes could not have increased if voted no already";
	assert recordValue == ABSTAIN => abstain_ <= _abstain, "Abstain votes could not have increased if voted abstain already";
	assert recordValue == NONE => (!doesProposalExist_ && yes_ == 0 && no_ == 0 && abstain_ == 0)// proposal no longer exists so everything is 0
									// or just one out of (yes,no,abstain) changed
									|| (yes_ == _yes && no_ == _no)
									|| (yes_ == _yes && abstain_ == _abstain)
									|| (no_ == _no && abstain_ == _abstain),
									"If previously did not vote, either this proposal was deleted, or only one kind of vote may change, and the other two are the same";
}
rule no_double_vote_referendum_vote(address account, uint256 deqIndex) {
	/* A user that already has a vote record for a dequeued index, cannot make a transaction that will increase the weight of that choice */
	env eF; 
	env eFTime; // same time as eF;
	env e_;
	
	uint256 NONE = sinvoke getNoneVoteEnum();
	uint256 ABSTAIN = sinvoke getAbstainVoteEnum();
	uint256 YES = sinvoke getYesVoteEnum();
	uint256 NO = sinvoke getNoVoteEnum();
	
	uint256 p; // a proposal - let's assume it already exists (required for propose() verification)
	uint256 recordValue;
	p, recordValue = sinvoke getVoteRecord(account,deqIndex);
	uint256 currentProposalCount = sinvoke proposalCount();
	require currentProposalCount >= p;
	
	
	uint256 _yes; uint256 _no; uint256 _abstain;
	_yes,_no,_abstain = sinvoke getVoteTotals(p);
	
	// if can't vote for NONE, then necessarily if record vote is NONE, all votes are zero currently
	require recordValue == NONE => (_yes == 0 && _no == 0 && _abstain == 0);
	
	require sinvoke getAccountFromVoteSigner(eF.msg.sender) == account;
	uint256 someP; uint256 someIndex; uint8 someValue;
	
	uint256 pOfSomeIndex; uint256 recordValueOfSomeIndex;
	pOfSomeIndex, recordValueOfSomeIndex = sinvoke getVoteRecord(account,someIndex);
	require pOfSomeIndex == p => someIndex == deqIndex; // no duplicates in the dequeued array
	require someP == p => someIndex == deqIndex;
	
	sinvoke vote(eF,someP,someIndex,someValue);
	
	
	uint256 yes_; uint256 no_; uint256 abstain_;
	yes_,no_,abstain_ = sinvoke getVoteTotals(p);
	
	bool doesProposalExist_ = sinvoke proposalExists(e_,p);
	
	// if p expires, then sum of votes is no longer relevant - happens in approve, vote, execute
	assert (recordValue != NONE && doesProposalExist_) => (yes_ + no_ + abstain_) == (_yes + _no + _abstain), "Total votes could not have changed if already voted";
	assert recordValue == YES => yes_ <= _yes, "Yes votes could not have increased if voted yes already";
	assert recordValue == NO => no_ <= _no, "No votes could not have increased if voted no already";
	assert recordValue == ABSTAIN => abstain_ <= _abstain, "Abstain votes could not have increased if voted abstain already";
	assert recordValue == NONE => (!doesProposalExist_ && yes_ == 0 && no_ == 0 && abstain_ == 0)// proposal no longer exists so everything is 0
									// or just one out of (yes,no,abstain) changed
									|| (yes_ == _yes && no_ == _no)
									|| (yes_ == _yes && abstain_ == _abstain)
									|| (no_ == _no && abstain_ == _abstain),
									"If previously did not vote, either this proposal was deleted, or only one kind of vote may change, and the other two are the same";
}
// TODO: Write spec for isProposal passing, or just for constitution
// constitution related
rule constitution_change(method f) {
	env _e;
	env eF;
	env e_;
	
	calldataarg arg_getConstitution;
	
	uint256 _res;
	_res = sinvoke getConstitution(_e,arg_getConstitution);
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	uint256 res_;
	res_ = sinvoke getConstitution(e_,arg_getConstitution);
	
	bool changed = !(_res == res_);
	
	// we're going to demand hard equality here - so 1/2 and 2/4 are INEQUAL
	assert !changed, "changes constitution";
}

rule constitution_change_legal(method f) {
	env _e;
	env eF;
	env e_;
	
	calldataarg arg_getConstitution;
	
	uint256 _res;
	_res = sinvoke getConstitution(_e,arg_getConstitution);
	
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	uint256 res_;
	res_ = sinvoke getConstitution(e_,arg_getConstitution);
	
	bool changed = !(_res == res_);
	// TODO: This needs to be re-written based on new library for fractions
	/*
	bool b1 = num_*2 <= denom_;
	bool b2 = num_ <= denom_;
	
	// if constitution is correct then we report that there was a change, but otherwise we report the incorrect change as well.
	// if constitution updated, check if it is correct. 
	assert changed => b1, "Updated constitution: Constitution must be at least majority, but got less: ${num_} to ${denom_}";
	assert changed => b2, "Updated constitution: Constitution cannot demand more than unanimous, but got ${num_} to ${denom_}";
	*/
	assert true;
}
// initialization rules
rule only_initializer_changes_initialized_field(method f) {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
		
	require f.selector != initialize(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256).selector;
	calldataarg arg;
	require !f.isView;
	sinvoke f(eF,arg);
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized == isInitialized_, "Method $f is not expected to change initialization field from ${_isInitialized} to ${isInitialized_}";
}

rule check_initializer {
	env _e;
	env eF;
	env e_;
	
	bool _isInitialized = sinvoke initialized(_e);
	
	calldataarg arg;
	invoke initialize(eF,arg);
	bool successInit = !lastReverted;
	
	bool isInitialized_ = sinvoke initialized(e_);
	
	assert _isInitialized => !successInit, "initialize() must revert if already initialized";
	assert successInit => isInitialized_, "When initialize() succeeds, must set initialization field to true";
}

/**
 * A utility for shortening calls to arbitrary functions in which we do not care about the environment.
 */
function callArbitrary(method f) {
	env e;
	calldataarg arg;
	f(e, arg);
}
